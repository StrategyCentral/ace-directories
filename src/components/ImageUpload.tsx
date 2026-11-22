"use client";

import { useRef, useState } from "react";

/**
 * Pick an image, shrink it in the browser, upload it. Logos keep transparency
 * (PNG/WebP); photos are resized to a sensible width.
 */
export default function ImageUpload({
  listingId, kind, value, onChange,
}: { listingId: string; kind: "logo" | "photo"; value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function shrink(file: File): Promise<Blob> {
    const max = kind === "logo" ? 512 : 1400;
    const img = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", kind === "logo" ? 0.92 : 0.82));
    if (blob && blob.type === "image/webp") return blob;
    // Older Safari can't encode WebP; fall back to PNG for logos, JPEG for photos.
    return (await new Promise<Blob | null>((r) =>
      c.toBlob(r, kind === "logo" ? "image/png" : "image/jpeg", 0.85))) ?? file;
  }

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    setBusy(true); setError(null);
    try {
      const blob = await shrink(file);
      const fd = new FormData();
      fd.set("listing_id", listingId); fd.set("kind", kind); fd.set("file", blob, "upload");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      onChange(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files[0]); }}
        className={"flex items-center gap-4 rounded-xl border border-dashed p-4 transition-colors " +
          (drag ? "border-brand-400 bg-brand-500/[0.08]" : "border-white/[0.14] bg-white/[0.015]")}
      >
        <div className={"shrink-0 grid place-items-center overflow-hidden bg-white/[0.04] edge " +
          (kind === "logo" ? "size-16 rounded-lg" : "w-24 h-16 rounded-lg")}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className={kind === "logo" ? "max-w-full max-h-full object-contain" : "w-full h-full object-cover"} />
          ) : (
            <span className="text-[11px] text-paper-600">None</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={busy}
              className="btn btn-primary !py-2 !px-4 !text-[12.5px] disabled:opacity-60">
              {busy ? "Uploading…" : value ? "Replace" : `Upload ${kind === "logo" ? "logo" : "photo"}`}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="btn btn-ghost !py-2 !px-4 !text-[12.5px]">Remove</button>
            )}
          </div>
          <p className="text-[11.5px] text-paper-600 mt-2">PNG, JPG or WebP. Drag and drop works too. We resize it for you.</p>
          {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden
        onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
