import { db } from "@/lib/supabase";

export const runtime = "nodejs";

/** Serves an uploaded image. Never changes once stored, so caches keep it for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uuid = id.replace(/\.(webp|png|jpg)$/i, "");
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return new Response("Not found", { status: 404 });
  const { data } = await db().from("media").select("content_type,data_b64").eq("id", uuid).maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data.data_b64, "base64"), {
    headers: {
      "content-type": data.content_type,
      "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
