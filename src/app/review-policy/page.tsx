import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Review Policy",
  description:
    "How reviews work on the Aussie Lawyer Directory — verification, moderation, the firm's right of reply, and what gets removed.",
  alternates: { canonical: "/review-policy" },
};

const SECTIONS: [string, string][] = [
  ["Who can leave a review",
   "Anyone who has actually been a client of the firm. You confirm that when you submit. Reviews from people who were never clients — including competitors, and including anyone acting for the firm itself — are removed."],
  ["Every review is verified and moderated",
   "You confirm your email address, then a person reads the review before it is published. Moderation exists to check the review is genuine and lawful. It is not there to filter out criticism, and we do not hold negative reviews to a higher standard than positive ones."],
  ["Firms cannot pay to remove a review",
   "There is no price for taking down a genuine review, and no plan that includes it. A firm that asks will be told the same thing. Under the Australian Consumer Law, selectively suppressing genuine negative reviews is illegal, and we would not do it regardless."],
  ["Firms always get a right of reply",
   "Any claimed firm can publish a response to any review of it, free, on every plan. Replies appear directly under the review and are not moderated for tone — only for the same lawfulness standard as reviews."],
  ["What we remove",
   "Reviews that are fake or incentivised; reviews from people who were not clients; content that identifies third parties or discloses someone else's private information; material that is defamatory or alleges criminal conduct without foundation; and anything that would prejudice a matter still before a court."],
  ["Reporting a review",
   "Anyone can report a review from the profile page. A reported review is unpublished immediately while we look at it, rather than left up during the dispute. If it checks out, it goes back up. If it doesn't, it stays down."],
  ["Reviews are not legal advice about a lawyer's competence",
   "A review describes one client's experience. It is not an assessment of professional conduct. If you believe a lawyer has acted improperly, the legal services regulator in their state handles complaints — and that is a more effective route than a review."],
];

export default function ReviewPolicyPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Review policy" }]}
        eyebrow="Transparency"
        title="How reviews work here"
        intro="A directory's reviews are worth exactly as much as the rules behind them. These are ours, in full."
      />
      <div className="mx-auto max-w-[760px] px-5 pb-16 space-y-7">
        {SECTIONS.map(([h, body]) => (
          <section key={h}>
            <h2 className="text-[15px] font-medium text-paper-100">{h}</h2>
            <p className="text-[14px] leading-relaxed text-paper-400 mt-2">{body}</p>
          </section>
        ))}
        <p className="text-[12.5px] text-paper-600 pt-4 edge-t">
          Think a review breaches this policy?{" "}
          <Link href="/contact" className="underline hover:text-paper-400">Tell us</Link> — or use
          the report link under the review itself, which takes it down straight away.
        </p>
      </div>
    </>
  );
}
