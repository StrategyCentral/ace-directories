import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { db } from "@/lib/supabase";
import { getPracticeAreas } from "@/lib/queries";
import { CRISIS_PATTERNS, MADDIE, systemPrompt } from "@/lib/agent/persona";
import { TOOLS, runTool, type FirmCard } from "@/lib/agent/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_TURNS = 24;          // a conversation this long is a human's job
const MAX_PER_HOUR = 40;       // per IP

const anthropic = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
};

const hashIp = (ip: string) =>
  createHash("sha256").update(ip + (process.env.JWT_SECRET ?? "")).digest("hex").slice(0, 32);

type Msg = { role: "user" | "assistant"; content: string | Anthropic.ContentBlockParam[] };

export async function POST(req: Request) {
  let body: { sessionKey?: string; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sessionKey = String(body.sessionKey ?? "").slice(0, 64);
  const history = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
  if (!sessionKey || history.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const last = history[history.length - 1];
  const lastText = typeof last?.content === "string" ? last.content : "";

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

  const ipHash = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  );
  if (await overLimit(ipHash)) {
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

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content as Anthropic.MessageParam["content"],
  }));

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
    const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown");
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
