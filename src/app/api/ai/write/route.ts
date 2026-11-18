import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/supabase";
import { requireOwner } from "@/lib/ownership";
import { buildPrompt, fieldGuide } from "@/lib/agent/copywriter";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const DAILY_LIMIT = 30;

/** Every output shape is a tool, so the reply is always parseable. */
const TOOL: Record<string, Anthropic.Tool> = {
  options: {
    name: "drafts",
    description: "Return three distinct drafts for the field.",
    input_schema: {
      type: "object",
      properties: { drafts: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
      required: ["drafts"],
    },
  },
  list: {
    name: "points",
    description: "Return five short, specific points, one sentence each. The firm will keep the best three.",
    input_schema: {
      type: "object",
      properties: { points: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 } },
      required: ["points"],
    },
  },
  faq: {
    name: "faqs",
    description: "Return five questions real clients ask, in their own words, each with a short plain-English answer from the firm.",
    input_schema: {
      type: "object",
      properties: {
        faqs: {
          type: "array", minItems: 4, maxItems: 5,
          items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] },
        },
      },
      required: ["faqs"],
    },
  },
};

const BANNED = /\b(guarantee[ds]?|100%|best|leading|number one|no win,? no fee|cheapest|expert|specialis[et])\b|—/i;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }
  const found = fieldGuide(String(body.field ?? ""));
  if (!found?.guide.ai) return NextResponse.json({ error: "AI isn't available for that field" }, { status: 400 });
  const { guide, step } = found;

  const supabase = db();
  const { data: calls } = await supabase.rpc("ai_usage_bump", { p_listing: listingId });
  if (Number(calls) > DAILY_LIMIT) {
    return NextResponse.json({ error: "That's today's AI limit for this listing. It resets tomorrow." }, { status: 429 });
  }

  const { data: l } = await supabase.from("lawyers").select(
    "full_name,suburb,state,practice_areas,languages,free_consult,free_consult_mins,fee_approach,response_commitment," +
    "admitted_year,principal_name,memberships,accreditations,after_hours,home_visits,video_consults,usps",
  ).eq("id", listingId).maybeSingle();
  const { data: areas } = await supabase.from("practice_areas").select("slug,name");
  const r = (l ?? {}) as Record<string, unknown>;
  const areaNames = ((r.practice_areas as string[]) ?? [])
    .map((s) => areas?.find((a) => a.slug === s)?.name ?? s).filter((n) => !/injur|compensation/i.test(n));
  const fact = (k: string, label: string) => {
    const v = r[k];
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length) || v === false) return null;
    return `- ${label}: ${Array.isArray(v) ? v.join(", ") : v === true ? "yes" : v}`;
  };
  const facts = [
    `- Firm: ${r.full_name}`,
    `- Location: ${[r.suburb, r.state].filter(Boolean).join(", ")}`,
    areaNames.length ? `- Practice areas: ${areaNames.join(", ")}` : null,
    fact("free_consult", "Offers a free first consultation"),
    fact("free_consult_mins", "Free consultation length in minutes"),
    fact("fee_approach", "How they charge"),
    fact("response_commitment", "Reply time promise"),
    fact("admitted_year", "Principal admitted"),
    fact("principal_name", "Principal"),
    fact("languages", "Languages spoken"),
    fact("memberships", "Memberships and accreditations"),
    fact("accreditations", "Accreditations"),
    fact("after_hours", "After-hours appointments"),
    fact("home_visits", "Home visits"),
    fact("video_consults", "Video consultations"),
  ].filter(Boolean).join("\n");

  const shape = guide.type === "list" ? "list" : guide.type === "faq" ? "faq" : "options";
  const { system, user } = buildPrompt(guide, step,
    facts, String(body.brief ?? "").slice(0, 500), typeof body.current === "string" ? body.current.slice(0, 1500) : "");

  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("no key");
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: MODEL, max_tokens: 1500, system,
      tools: [TOOL[shape]], tool_choice: { type: "tool", name: TOOL[shape].name },
      messages: [{ role: "user", content: user }],
    });
    const out = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")?.input as Record<string, unknown> | undefined;
    if (!out) throw new Error("no output");

    // Belt and braces: drop anything that slipped past the rules.
    const ok = (t: string) => !BANNED.test(t);
    const cap = (t: string) => (guide.maxLength ? t.slice(0, guide.maxLength) : t);
    if (shape === "faq") {
      const faqs = ((out.faqs as { q: string; a: string }[]) ?? []).filter((f) => ok(f.q) && ok(f.a));
      return NextResponse.json({ faqs });
    }
    const list = ((out.drafts ?? out.points) as string[] ?? []).map((t) => cap(t.trim())).filter(ok);
    return NextResponse.json(shape === "list" ? { points: list } : { drafts: list });
  } catch (e) {
    console.error("ai write failed", e);
    return NextResponse.json({ error: "The writer is busy. Try again in a moment." }, { status: 502 });
  }
}
