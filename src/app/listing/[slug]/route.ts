import { redirect, permanentRedirect } from "next/navigation";

/**
 * The pre-2026 site served some profiles at /listing/[slug]/ and others at
 * /firm/[slug]/. Everything now lives under /firm/, so the old shape 301s
 * across and keeps whatever link equity survived the hack.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  permanentRedirect(`/firm/${slug}`);
}
