import { ONBOARDING, type FieldGuide } from "@/content/onboarding";

/**
 * "Write with AI" for firm profiles. The model drafts; the firm chooses and
 * edits. The rules below exist because the reader is a frightened member of
 * the public and the author is a regulated legal practice.
 */
export const COMPLIANCE = `Hard rules. Breaking any of these makes the draft unusable:
- Never promise or imply an outcome, success rate, win rate or "best result". No "we win", "guaranteed", "100%".
- Never use "specialist", "specialise", "expert" or "accredited" unless the firm's own facts below say they hold that accreditation.
- No superlatives or comparisons that cannot be proven: no "best", "leading", "top", "number one", "cheapest", "most trusted".
- Do not mention personal injury, compensation claims, workers' compensation, motor accident or medical negligence work, and no "no win no fee" wording. Several states restrict how those services may be advertised.
- No client testimonials, no invented facts, figures, years, awards, names, languages or prices. Use only the facts provided. If a fact you need is missing, write around it.
- Not legal advice. Do not state what the law is or what someone's rights are.
- Australian English spelling. Plain words a stressed person understands. No legal jargon in headlines.
- No em dashes. No exclamation marks. No hype words: "leverage", "seamless", "cutting-edge", "passionate", "dedicated team", "one-stop shop".`;

export function fieldGuide(name: string): { guide: FieldGuide; step: (typeof ONBOARDING)[number] } | null {
  for (const step of ONBOARDING) {
    const guide = step.fields.find((f) => f.name === name);
    if (guide) return { guide, step };
  }
  return null;
}

export function buildPrompt(guide: FieldGuide, step: (typeof ONBOARDING)[number], facts: string, brief: string, current: string) {
  const works = (guide.works ?? []).map((e) => `- "${e.eg}" (why: ${e.why})`).join("\n");
  const fails = (guide.fails ?? []).map((e) => `- "${e.eg}" (why it fails: ${e.why})`).join("\n");
  const system = `You write profile copy for Australian law firms listed on the Aussie Lawyer Directory.

The person reading the profile has a legal problem they did not choose. They are scared, not shopping. Copy that works names their situation in their words, removes the fear of cost and of being judged, and makes the first contact feel small. Copy about the firm's history or values does not work.

This step: "${step.title}". The principle: ${step.principle}
${step.why}

The field: ${guide.label}. ${guide.help}${guide.maxLength ? ` Maximum ${guide.maxLength} characters.` : ""}

Examples that work, and why:
${works}

Examples that fail, and why:
${fails}

${COMPLIANCE}`;

  const user = `Firm facts (the only facts you may use):
${facts}

${brief ? `What the firm wants to get across: ${brief}\n` : ""}${current ? `Their current draft, to improve on: ${current}\n` : ""}
Write the ${guide.label.toLowerCase()} now.`;
  return { system, user };
}
