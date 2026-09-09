import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thanks", robots: { index: false, follow: false } };

const COPY: Record<string, { title: string; body: string }> = {
  verified: {
    title: "Email confirmed — thank you",
    body: "Your review is in the moderation queue. A person reads every review before it goes live, usually within a business day. You'll see it on the firm's profile once it's approved.",
  },
  live: {
    title: "Already confirmed",
    body: "This review has already been confirmed and published. Thanks for taking the time.",
  },
  invalid: {
    title: "That link has expired",
    body: "Confirmation links can only be used once. If your review hasn't appeared, write to us and we'll find it.",
  },
};

export default async function ReviewThanksPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const state = typeof sp.state === "string" ? sp.state : "verified";
  const copy = COPY[state] ?? COPY.verified;

  return (
    <PageHeader title={copy.title} intro={copy.body}>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="btn btn-primary">Back to the directory</Link>
        <Link href="/review-policy" className="btn btn-ghost">How reviews work</Link>
      </div>
    </PageHeader>
  );
}
