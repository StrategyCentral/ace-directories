import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/supabase";
import { searchListings, getSuburb } from "@/lib/queries";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "find_lawyers",
    description:
      "Find firms matching a practice area and a location. Call this once you know " +
      "both. Returns at most 6 firms ordered by fit and client reviews. Present no " +
      "more than 3 of them to the person.",
    input_schema: {
      type: "object",
      properties: {
        practice_area: {
          type: "string",
          description: "An exact practice area slug from the list in your instructions.",
        },
        state: {
          type: "string",
          description: "State abbreviation: NSW, VIC, QLD, WA, SA, TAS, ACT, NT.",
        },
        suburb: {
          type: "string",
          description: "Suburb name, if the person gave one. Narrows the search.",
        },
      },
      required: ["practice_area"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand the conversation to a person. Use for deadlines inside 7 days, crisis " +
      "situations, billing or site problems, or when you are stuck.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why this needs a human, in one line." },
        urgency: { type: "string", enum: ["urgent", "soon", "planning"] },
      },
      required: ["reason", "urgency"],
    },
  },
];

export interface FirmCard {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  practice_areas: string[];
  review_avg: number | null;
  review_count: number;
  verified: boolean;
  sparse: boolean;
}

async function findLawyers(input: {
  practice_area: string;
  state?: string;
  suburb?: string;
}): Promise<{ firms: FirmCard[]; note?: string }> {
  let suburbId: string | undefined;
  if (input.suburb) {
    const { data } = await db()
      .from("suburbs")
      .select("id,state")
      .ilike("name", input.suburb.trim())
      .order("listing_count", { ascending: false })
      .limit(1);
    const hit = (data as { id: string; state: string }[] | null)?.[0];
    if (hit && (!input.state || hit.state === input.state)) suburbId = hit.id;
  }

  let { rows } = await searchListings({
    practice: input.practice_area,
    suburbId,
    state: suburbId ? undefined : input.state,
    perPage: 6,
  });

  let note: string | undefined;
  // Widen to the whole state rather than return nothing — an empty answer sends
  // the person away, and a firm one suburb over is still a real option.
  if (rows.length === 0 && input.state) {
    ({ rows } = await searchListings({
      practice: input.practice_area,
      state: input.state,
      perPage: 6,
    }));
    note = "No firms in that suburb list this speciality — these are elsewhere in the state.";
  }

  return {
    note,
    firms: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.full_name,
      suburb: r.suburb,
      state: r.state,
      practice_areas: r.practice_areas ?? [],
      review_avg: r.review_avg,
      review_count: r.review_count ?? 0,
      verified: Boolean(r.verified_at),
      // Imported-from-public-records listings are thin. Say so rather than
      // letting the model imply a fuller endorsement than the data supports.
      sparse: !r.website && !r.bio,
    })),
  };
}

export async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: unknown; firms?: FirmCard[]; escalated?: boolean }> {
  if (name === "find_lawyers") {
    const out = await findLawyers(input as Parameters<typeof findLawyers>[0]);
    return { result: out, firms: out.firms };
  }
  if (name === "escalate_to_human") {
    return { result: { ok: true, contact: "support@aussielawyerdirectory.com.au" }, escalated: true };
  }
  return { result: { error: `Unknown tool ${name}` } };
}

export { getSuburb };
