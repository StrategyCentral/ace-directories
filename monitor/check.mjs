/**
 * Uptime check for the directory.
 *
 * Runs on Railway rather than inside Supabase or the app itself, because the
 * outage on 2026-09-10 was the database going down while Railway stayed up —
 * anything hosted alongside the thing it watches cannot report its death.
 *
 * Hits /api/health, which does a real read of the listings table, and emails if
 * that fails twice in a row. Twice, because a single blip on a cold container
 * is not worth waking anyone for.
 */
const SITE = process.env.SITE_URL || "https://aussielawyerdirectory.com.au";
const RESEND = process.env.RESEND_API_KEY;
const ALERT_TO = process.env.ALERT_EMAIL || "profitlab@acetradingbots.com";
const FROM = process.env.RESEND_FROM || "Aussie Lawyer Directory <hello@aussielawyerdirectory.com.au>";

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

async function alert(first, second) {
  if (!RESEND) {
    console.error("no RESEND_API_KEY — cannot alert");
    return;
  }
  const detail = JSON.stringify({ first, second }, null, 1);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [ALERT_TO],
      subject: "🔴 Aussie Lawyer Directory is down",
      html: `<p><strong>${SITE}/api/health</strong> failed two checks in a row.</p>
             <p>The most likely cause is the Supabase database being unreachable — that is what
             happened on 10 September, and it went unnoticed for 17 hours because listing pages
             were quietly serving 404s.</p>
             <p><strong>First thing to try:</strong> restart the database from the Supabase
             dashboard, or check
             <code>/v1/projects/vpumgmasnggconvgujho/health</code>.</p>
             <pre style="background:#f4f6f9;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">${detail}</pre>`,
    }),
  });
  console.log("alert sent:", res.status);
}

const first = await probe();
console.log("check 1:", JSON.stringify(first));

if (first.ok) {
  console.log("healthy");
  process.exit(0);
}

// One retry before crying wolf.
await new Promise((r) => setTimeout(r, 20_000));
const second = await probe();
console.log("check 2:", JSON.stringify(second));

if (second.ok) {
  console.log("recovered on retry — no alert");
  process.exit(0);
}

await alert(first, second);
process.exit(1);
