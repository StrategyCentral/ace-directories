"use client";

import { useState } from "react";
import type { Listing, PracticeArea } from "@/lib/types";
import { isPaid } from "@/lib/types";
import { cx } from "@/lib/format";

const AREA_LIMIT: Record<string, number> = { verified: 3, featured: 8, dominator: 99, firm: 99 };

export default function ProfileEditor({
  listing,
  areas,
}: {
  listing: Listing;
  areas: PracticeArea[];
}) {
  const [selected, setSelected] = useState<string[]>(listing.practice_areas ?? []);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const paid = isPaid(listing.tier);
  const limit = AREA_LIMIT[listing.tier] ?? 1;

  function toggleArea(slug: string) {
    setSelected((cur) => {
      if (cur.includes(slug)) return cur.filter((s) => s !== slug);
      if (cur.length >= limit) return cur;
      return [...cur, slug];
    });
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/listing/update", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          tagline: f.get("tagline"),
          bio: f.get("bio"),
          website: f.get("website"),
          email: f.get("email"),
          phone: f.get("phone"),
          logo_url: f.get("logo_url"),
          founded_year: f.get("founded_year") ? Number(f.get("founded_year")) : null,
          team_size: f.get("team_size") ? Number(f.get("team_size")) : null,
          practice_areas: selected,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="tagline" label="Tagline" defaultValue={listing.tagline ?? ""}
               placeholder="One line on what you do" full />
        <Field name="website" label="Website" defaultValue={listing.website ?? ""} placeholder="https://" />
        <Field name="email" label="Enquiry email" type="email" defaultValue={listing.email ?? ""} />
        <Field name="phone" label="Phone" defaultValue={listing.phone ?? ""} />
        <Field name="logo_url" label="Logo URL" defaultValue={listing.logo_url ?? ""} placeholder="https://" />
        <Field name="founded_year" label="Founded" type="number" defaultValue={listing.founded_year ?? ""} />
        <Field name="team_size" label="Lawyers on staff" type="number" defaultValue={listing.team_size ?? ""} />
      </div>

      <label className="block">
        <span className="block text-[11.5px] text-paper-600 mb-1.5">
          About the firm — who you act for and how you work
        </span>
        <textarea
          name="bio"
          rows={6}
          defaultValue={listing.bio ?? ""}
          className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100
                     outline-none focus:border-brand-500/60 transition-colors resize-y"
        />
      </label>

      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2.5">
          <span className="text-[11.5px] text-paper-600">
            Practice areas — {selected.length} of {limit === 99 ? "unlimited" : limit}
          </span>
          {!paid && (
            <span className="text-[11.5px] text-gold-400">Upgrade to add more than one</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = selected.includes(a.slug);
            const blocked = !on && (selected.length >= limit || !paid);
            return (
              <button
                key={a.slug}
                type="button"
                disabled={blocked}
                onClick={() => toggleArea(a.slug)}
                className={cx(
                  "text-[12px] px-3 py-1.5 rounded-full border transition-colors",
                  on
                    ? "border-brand-500/60 bg-brand-500/15 text-brand-200"
                    : blocked
                      ? "border-white/[0.05] text-paper-600 cursor-not-allowed"
                      : "border-white/[0.09] text-paper-400 hover:text-paper-100 hover:border-brand-500/40",
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-[12.5px] text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button disabled={state === "saving"} className="btn btn-primary !text-[13px] disabled:opacity-60">
          {state === "saving" ? "Saving…" : "Save changes"}
        </button>
        {state === "saved" && <span className="text-[12.5px] text-brand-300">Saved.</span>}
      </div>
    </form>
  );
}

function Field({
  name, label, type = "text", defaultValue, placeholder, full,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <label className={cx("block", full && "sm:col-span-2")}>
      <span className="block text-[11.5px] text-paper-600 mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100
                   placeholder:text-paper-600 outline-none focus:border-brand-500/60 transition-colors"
      />
    </label>
  );
}
