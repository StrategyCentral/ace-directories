"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cx } from "@/lib/format";

export interface Member {
  id: string; slug: string; full_name: string; role_title: string | null;
  bio: string | null; photo_url: string | null; practice_areas: string[] | null; status: string;
}

/** Individual lawyer profiles under a firm's listing. */
export default function TeamPanel({
  listingId, allowance, members, firmAreas,
}: {
  listingId: string;
  allowance: number;
  members: Member[];
  firmAreas: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (allowance === 0 && members.length === 0) return null;

  function open(m: Member | "new") {
    setEditing(m); setMsg(null);
    setAreas(m === "new" ? [] : m.practice_areas ?? []);
  }

  async function call(method: string, body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/team", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setBusy(false);
    if (!r?.ok) { setMsg(j?.error ?? "Could not save"); return false; }
    setEditing(null); router.refresh(); return true;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fields = {
      full_name: f.get("full_name"), role_title: f.get("role_title"),
      bio: f.get("bio"), photo_url: f.get("photo_url"), practice_areas: areas,
    };
    if (editing === "new") await call("POST", { listing_id: listingId, ...fields });
    else if (editing) await call("PATCH", { id: editing.id, ...fields });
  }

  const input = "w-full rounded-lg bg-white/[0.03] edge px-3 py-2.5 text-[13.5px] text-paper-100 outline-none focus:border-brand-500/60";
  const current = editing && editing !== "new" ? editing : null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <p className="eyebrow">Lawyer profiles</p>
        <span className="text-[12.5px] text-paper-500">{members.length} of {allowance} used</span>
      </div>

      <div className="grid gap-2.5">
        {members.map((m) => (
          <div key={m.id} className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.015] px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[13.5px] font-medium">
                {m.full_name}
                {m.status === "hidden" && <span className="ml-2 text-[11px] text-gold-300">hidden: over your plan&apos;s allowance</span>}
              </p>
              <p className="text-[12.5px] text-paper-500 mt-0.5">{m.role_title ?? "Lawyer"}</p>
            </div>
            <div className="flex gap-2">
              {m.status === "live" && <Link href={`/firm/${m.slug}`} className="btn btn-ghost !py-1.5 !px-3 !text-[12.5px]">View</Link>}
              <button type="button" onClick={() => open(m)} className="btn btn-ghost !py-1.5 !px-3 !text-[12.5px]">Edit</button>
              <button type="button" disabled={busy}
                onClick={() => { if (window.confirm(`Remove ${m.full_name}'s profile?`)) void call("DELETE", { id: m.id }); }}
                className="btn btn-ghost !py-1.5 !px-3 !text-[12.5px] hover:!text-red-400">Remove</button>
            </div>
          </div>
        ))}

        {editing ? (
          <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-brand-500/40 bg-brand-500/[0.05] p-5 grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] text-paper-500">Full name
              <input name="full_name" required defaultValue={current?.full_name ?? ""} className={cx(input, "mt-1.5")} />
            </label>
            <label className="text-[12px] text-paper-500">Role, for example Senior Associate
              <input name="role_title" defaultValue={current?.role_title ?? ""} className={cx(input, "mt-1.5")} />
            </label>
            <label className="text-[12px] text-paper-500 sm:col-span-2">Photo URL (https)
              <input name="photo_url" type="url" placeholder="https://" defaultValue={current?.photo_url ?? ""} className={cx(input, "mt-1.5")} />
            </label>
            <label className="text-[12px] text-paper-500 sm:col-span-2">About this lawyer
              <textarea name="bio" rows={4} defaultValue={current?.bio ?? ""} className={cx(input, "mt-1.5")} />
            </label>
            {firmAreas.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[12px] text-paper-500 mb-2">Practice areas (from the firm&apos;s list)</p>
                <div className="flex flex-wrap gap-2">
                  {firmAreas.map((a) => {
                    const on = areas.includes(a.slug);
                    return (
                      <button key={a.slug} type="button"
                        onClick={() => setAreas((c) => (on ? c.filter((x) => x !== a.slug) : [...c, a.slug]))}
                        className={cx("text-[12.5px] px-3 py-1.5 rounded-full border transition-colors",
                          on ? "border-brand-500/60 bg-brand-500/[0.12] text-paper-100" : "border-white/[0.1] text-paper-500")}>
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {msg && <p className="text-[12.5px] text-red-400 sm:col-span-2">{msg}</p>}
            <div className="flex gap-2.5 sm:col-span-2">
              <button disabled={busy} className="btn btn-primary !py-2 !px-4 !text-[12.5px] disabled:opacity-60">
                {busy ? "Saving…" : editing === "new" ? "Publish profile" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">Cancel</button>
            </div>
          </form>
        ) : members.length < allowance ? (
          <button type="button" onClick={() => open("new")}
            className="rounded-[var(--radius-card)] border border-dashed border-white/[0.16] px-5 py-4 text-left text-[13px] text-paper-300 hover:border-brand-500/50">
            + Add a lawyer profile
          </button>
        ) : (
          <p className="text-[12.5px] text-paper-500">All profiles used. Add more from the add-ons panel above.</p>
        )}
        {!editing && msg && <p className="text-[12.5px] text-red-400">{msg}</p>}
      </div>
    </div>
  );
}
