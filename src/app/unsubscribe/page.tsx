import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import UnsubscribeBox from "@/components/UnsubscribeBox";
import { validUnsubSig } from "@/lib/unsubscribe";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ e?: string; s?: string }> }) {
  const { e = "", s = "" } = await searchParams;
  const ok = Boolean(e) && validUnsubSig(e, s);

  return (
    <>
      <PageHeader
        title="Email preferences"
        intro="One click, no login, no questions."
      />
      <div className="mx-auto max-w-[1240px] px-5 pb-16">
        {ok ? (
          <UnsubscribeBox e={e} s={s} />
        ) : (
          <div className="surface rounded-2xl p-7 md:p-9 max-w-[620px]">
            <p className="text-[14px] text-paper-300">
              This unsubscribe link is incomplete. Email{" "}
              <a className="text-brand-400" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>{" "}
              from the address you want removed and we&apos;ll take it off within two business days.
            </p>
          </div>
        )}
        <p className="text-[12.5px] text-paper-600 mt-6">
          Want the listing itself gone? <Link href="/remove-my-listing" className="text-brand-400">Removal is free</Link>.
        </p>
      </div>
    </>
  );
}
