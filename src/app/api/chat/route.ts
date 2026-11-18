import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { db } from "@/lib/supabase";
import { getPracticeAreas } from "@/lib/queries";
import { CRISIS_PATTERNS, MADDIE, systemPrompt } from "@/lib/agent/persona";
import { TOOLS, runTool, type FirmCard } from "@/lib/agent/tools";
import { clientIp } from "@/lib/client-ip";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_TURNS = 24;          // a conversation this long is a human's job
const MAX_PER_HOUR = 40;       // new conversations per IP
const MAX_INPUT = 2000;        // characters in one user message
const MAX_SESSION_MESSAGES = 30; // user messages in one conversation
// Per-message limits (in memory): every message is a paid model call.
const IP_MSGS = { max: 30, windowMs: 10 * 60_000 };
const SESSION_MSGS = { max: 8, windowMs: 60_000 };

const anthropic = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
};

const hashIp = (ip: string) =>
  createHash("sha256").update(ip + (process.env.JWT_SECRET ?? "")).digest("hex").slice(0, 32);

type Msg = { role?: unknown; content?: unknown };

export async function POST(req: Request) {
  let body: { sessionKey?: string; message?: unknown; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Only the newest user message is taken from the client. The conversation so
  // far comes from our own log, so a caller cannot feed the model forged
  // assistant or tool turns, or a huge history, at our expense.
  const sessionKey = String(body.sessionKey ?? "").slice(0, 64);
  const sent = Array.isArray(body.messages) ? body.messages : [];
  const last = sent[sent.length - 1];
  const rawText =
    typeof body.message === "string" ? body.message
    : last && last.role === "user" && typeof last.content === "string" ? last.content
    : "";
  const lastText = rawText.trim().slice(0, MAX_INPUT);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(sessionKey) || !lastText) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Crisis checks run before the model, not after. If someone has just said they
  // want to die, the right response is a phone number in under a second — not
  // whatever a language model decides to produce.
  for (const p of CRISIS_PATTERNS) {
    if (p.test.test(lastText)) {
      await log(sessionKey, req, [
        { role: "user", content: lastText, flagged: true },
        { role: "assistant", content: p.response, flagged: true },
      ]);
      return NextResponse.json({ reply: p.response, firms: [], escalated: true });
    }
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  if (
    rateLimited(`chat:ip:${ip}`, IP_MSGS.max, IP_MSGS.windowMs) ||
    rateLimited(`chat:s:${sessionKey}`, SESSION_MSGS.max, SESSION_MSGS.windowMs) ||
    (await overLimit(ipHash))
  ) {
    return NextResponse.json(
      { reply: "I've hit my limit for the hour, sorry. Try the enquiry form and someone will come back to you.", firms: [] },
      { status: 429 },
    );
  }

  const areas = await getPracticeAreas();
  const system = systemPrompt({
    practiceAreas: areas.map((a) => ({ slug: a.slug, name: a.name, blurb: a.blurb })),
    today: new Date().toLocaleDateString("en-AU", { dateStyle: "long", timeZone: "Australia/Melbourne" }),
  });

  const past = await loadHistory(sessionKey);
  if (past.userCount >= MAX_SESSION_MESSAGES) {
    return NextResponse.json({
      reply:
        "We've covered a lot, so it's time a person picked this up. Use the enquiry " +
        "form or email support@aussielawyerdirectory.com.au and someone will come back to you.",
      firms: [],
      escalated: true,
    });
  }
  const messages: Anthropic.MessageParam[] = [...past.turns, { role: "user", content: lastText }];

  let firms: FirmCard[] = [];
  let escalated = false;
  let reply = "";

  try {
    const client = anthropic();
    // Tool loop, capped. Two rounds is enough for "find firms then describe them";
    // more than that means something has gone wrong and we should not keep paying
    // for it.
    for (let round = 0; round < 3; round++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system,
        tools: TOOLS,
        messages,
      });

      reply = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      const calls = res.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      if (calls.length === 0) break;

      messages.push({ role: "assistant", content: res.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const c of calls) {
        const out = await runTool(c.name, c.input as Record<string, unknown>);
        if (out.firms) firms = out.firms;
        if (out.escalated) escalated = true;
        results.push({
          type: "tool_result",
          tool_use_id: c.id,
          content: JSON.stringify(out.result).slice(0, 6000),
        });
      }
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    console.error("chat failed", e);
    return NextResponse.json(
      {
        reply:
          "Sorry — something went wrong on my end. You can use the enquiry form and " +
          "someone will get back to you, or email support@aussielawyerdirectory.com.au.",
        firms: [],
      },
      { status: 503 },
    );
  }

  await log(
    sessionKey,
    req,
    [
      { role: "user", content: lastText, flagged: false },
      { role: "assistant", content: reply, flagged: escalated },
    ],
    { firms, escalated },
  );

  return NextResponse.json({ reply, firms: firms.slice(0, 3), escalated });
}

export async function GET() {
  return NextResponse.json({ greeting: MADDIE.greeting, name: MADDIE.name, label: MADDIE.label });
}

/* ------------------------------------------------------------------ history */

/** The conversation so far, from our own log: plain text turns only. */
async function loadHistory(sessionKey: string): Promise<{ turns: Anthropic.MessageParam[]; userCount: number }> {
  try {
    const { data: conv } = await db()
      .from("agent_conversations").select("id").eq("session_key", sessionKey).maybeSingle();
    const convId = (conv as { id: string } | null)?.id;
    if (!convId) return { turns: [], userCount: 0 };
    const [{ data: rows }, { count }] = await Promise.all([
      db().from("agent_messages").select("role,content")
        .eq("conv_id", convId).in("role", ["user", "assistant"])
        .order("created_at", { ascending: false }).limit(MAX_TURNS - 1),
      db().from("agent_messages").select("id", { count: "exact", head: true })
        .eq("conv_id", convId).eq("role", "user"),
    ]);
    const turns: Anthropic.MessageParam[] = [];
    for (const r of ((rows ?? []) as { role: "user" | "assistant"; content: string }[]).reverse()) {
      const prev = turns[turns.length - 1];
      if (prev && prev.role === r.role) prev.content = `${prev.content as string}\n\n${r.content}`;
      else turns.push({ role: r.role, content: r.content });
    }
    // The model call must start with the user and alternate; the new message is a user turn.
    while (turns.length && turns[0].role !== "user") turns.shift();
    if (turns.length && turns[turns.length - 1].role === "user") turns.pop();
    return { turns, userCount: count ?? 0 };
  } catch (e) {
    console.error("chat history load failed", e);
    return { turns: [], userCount: 0 };
  }
}

/* ------------------------------------------------------------------ logging */

async function overLimit(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db()
    .from("agent_conversations")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  return (count ?? 0) > MAX_PER_HOUR;
}

/**
 * Logging is best-effort — a failed write must never cost the person their
 * answer — but it is not optional in intent. If anyone ever claims Maddie gave
 * them legal advice, this transcript is the only record of what was said.
 */
async function log(
  sessionKey: string,
  req: Request,
  msgs: { role: "user" | "assistant"; content: string; flagged: boolean }[],
  extra?: { firms: FirmCard[]; escalated: boolean },
) {
  try {
    const ipHash = hashIp(clientIp(req));
    const { data: existing } = await db()
      .from("agent_conversations")
      .select("id")
      .eq("session_key", sessionKey)
      .maybeSingle();

    let convId = (existing as { id: string } | null)?.id;
    if (!convId) {
      const { data } = await db()
        .from("agent_conversations")
        .insert({ session_key: sessionKey, ip_hash: ipHash })
        .select("id")
        .single();
      convId = (data as { id: string } | null)?.id;
    }
    if (!convId) return;

    await db().from("agent_messages").insert(
      msgs.map((m) => ({ conv_id: convId, role: m.role, content: m.content.slice(0, 8000), flagged: m.flagged })),
    );

    if (extra?.escalated) {
      await db().from("agent_conversations").update({ outcome: "escalated" }).eq("id", convId);
    }
    if (extra?.firms.length) {
      await db().from("agent_conversations").update({ outcome: "shortlisted" }).eq("id", convId);
      await db().from("agent_referrals").upsert(
        extra.firms.slice(0, 3).map((f, i) => ({ conv_id: convId, listing_id: f.id, position: i + 1 })),
        { onConflict: "conv_id,listing_id", ignoreDuplicates: true },
      );
    }
  } catch (e) {
    console.error("agent log failed", e);
  }
}
