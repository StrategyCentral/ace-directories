import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireOwner } from "@/lib/ownership";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const MAX_BYTES = 600 * 1024;
const TYPES: Record<string, (b: Buffer) => boolean> = {
  "image/webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  "image/png": (b) => b[0] === 0x89 && b.subarray(1, 4).toString() === "PNG",
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8,
};

/**
 * Logo and photo uploads. The browser shrinks the image before sending, so
 * what arrives is small. We check the bytes really are an image (not just the
 * claimed type), store it, and return a URL on our own domain that Cloudflare
 * caches, so serving it costs almost nothing.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const listingId = String(form?.get("listing_id") ?? "");
  const kind = String(form?.get("kind") ?? "photo");
  const file = form?.get("file");
  if (!(await requireOwner(listingId))) {
    return NextResponse.json({ error: "You don't manage that listing" }, { status: 403 });
  }
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That image is too large. Try a smaller one." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = Object.keys(TYPES).find((t) => TYPES[t](buf));
  if (!type) return NextResponse.json({ error: "Please upload a PNG, JPG or WebP image" }, { status: 400 });

  const supabase = db();
  // Keep each listing tidy: at most 20 stored images.
  const { count } = await supabase.from("media").select("id", { count: "exact", head: true }).eq("listing_id", listingId);
  if ((count ?? 0) >= 20) {
    const { data: old } = await supabase.from("media").select("id").eq("listing_id", listingId)
      .order("created_at", { ascending: true }).limit(5);
    if (old?.length) await supabase.from("media").delete().in("id", old.map((o) => o.id));
  }
  const { data, error } = await supabase.from("media").insert({
    listing_id: listingId, kind: kind === "logo" ? "logo" : "photo",
    content_type: type, bytes: buf.length, data_b64: buf.toString("base64"),
  }).select("id").single();
  if (error) return NextResponse.json({ error: "Could not save the image" }, { status: 500 });
  const ext = type.split("/")[1].replace("jpeg", "jpg");
  return NextResponse.json({ url: `${SITE.url}/media/${data.id}.${ext}` });
}
