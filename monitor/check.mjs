/**
 * Uptime check for the directory.
 *
 * Runs on Railway rather than inside Supabase or the app itself, because the
 * outage on 2026-09-10 was the database going down while Railway stayed up —
 * anything hosted alongside the thing it watches cannot report its death.
 *
 * Hits /api/health, which does a real read of the listings table. It emails on
 * a change of state, not on every failed run: once when the site goes down,
 * once a day while it stays down, and once when it recovers. The first version
 * emailed every 15 minutes through an outage, which got the monitor switched
 * off — and a switched-off monitor is how a four-week outage went unwatched.
 *
 * State lives in a small file on a Railway volume (STATE_FILE), since a cron
 * container remembers nothing between runs.
 */
import { readFile, writeFile } from "node:fs/promises";

const SITE = process.env.SITE_URL || "https://aussielawyerdirectory.com.au";
const RESEND = process.env.RESEND_API_KEY;
const ALERT_TO = process.env.ALERT_EMAIL || "profitlab@acetradingbots.com";
const FROM = process.env.RESEND_FROM || "Aussie Lawyer Directory <hello@aussielawyerdirectory.com.au>";
const STATE_FILE = process.env.STATE_FILE || "/data/ald-monitor-state.json";
const REMIND_EVERY_MS = 24 * 3_600_000;

async function probe() {
  const started = Date.now();
  try {
    const res = await fetch(`${SITE}/api/health`, {
      signal: AbortSignal.timeout(25_000),
      headers: { "cache-control": "no-cache" },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && body.ok === true, status: res.status, body, ms: Date.now() - started };
  } catch (e) {
    return { ok: false, status: 0, body: { error: String(e) }, ms: Date.now() - started };
  }
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return { down: false, since: null, lastAlertAt: null };
  }
}

/** Returns false when the state cannot be saved, so the caller can say so. */
async function saveState(state) {
  try {
    await writeFile(STATE_FILE, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("could not save state:", String(e));
    return false;
  }
}

async function email(subject, html) {
  if (!RESEND) {
    console.error("no RESEND_API_KEY — cannot alert");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [ALERT_TO], subject, html }),
  });
  console.log(`email "${subject}":`, res.status);
  return res.ok;
}

const hours = (ms) => Math.max(1, Math.round(ms / 3_600_000));

const state = await loadState();
const first = await probe();
console.log("check 1:", JSON.stringify(first));

let healthy = first.ok;
let second = null;
if (!healthy) {
  // One retry before crying wolf.
  await new Promise((r) => setTimeout(r, 20_000));
  second = await probe();
  console.log("check 2:", JSON.stringify(second));
  healthy = second.ok;
}

const now = Date.now();

if (healthy) {
  if (state.down) {
    await email(
      "🟢 Aussie Lawyer Directory is back up",
      `<p><strong>${SITE}</strong> is answering again after about
       ${hours(now - new Date(state.since).getTime())} hour(s) down.</p>`,
    );
    await saveState({ down: false, since: null, lastAlertAt: null });
  }
  console.log("healthy");
  process.exit(0);
}

const since = state.down && state.since ? state.since : new Date(now).toISOString();
const due =
  !state.down || !state.lastAlertAt || now - new Date(state.lastAlertAt).getTime() >= REMIND_EVERY_MS;

if (due) {
  const detail = JSON.stringify({ first, second }, null, 1);
  const still = state.down;
  const sent = await email(
    still
      ? `🔴 Aussie Lawyer Directory is still down (${hours(now - new Date(since).getTime())}h)`
      : "🔴 Aussie Lawyer Directory is down",
    `<p><strong>${SITE}/api/health</strong> failed two checks in a row${
      still ? `, and has been failing since ${since}` : ""
    }.</p>
     <p>Both outages so far were the Supabase database: an instance that stopped answering
     (restart it from the dashboard), and the free plan's monthly egress allowance running
     out (the health detail below shows <code>402</code> or <code>exceed_egress_quota</code>).</p>
     <p>You will get one reminder a day while it stays down, and one email when it recovers.</p>
     <pre style="background:#f4f6f9;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">${detail}</pre>`,
  );
  await saveState({ down: true, since, lastAlertAt: sent ? new Date(now).toISOString() : state.lastAlertAt });
} else {
  console.log("still down — already alerted, next reminder in",
    hours(REMIND_EVERY_MS - (now - new Date(state.lastAlertAt).getTime())), "h");
}
process.exit(1);
