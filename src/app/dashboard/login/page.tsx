import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Firm Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const expired = sp.error === "expired";

  return (
    <>
      <PageHeader
        title="Sign in to your firm dashboard"
        intro="Enter the work email you used when you claimed your listing. We'll send a sign-in link — no password to remember."
      />
      <div className="mx-auto max-w-[520px] px-5 pb-20">
        {expired && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-300 mb-5">
            That link has expired. Request a new one below.
          </p>
        )}
        <LoginForm />
        <p className="text-[12.5px] text-paper-600 mt-6">
          Haven&apos;t claimed a listing yet?{" "}
          <Link href="/claim" className="text-brand-400 hover:text-brand-200">Find your firm →</Link>
        </p>
      </div>
    </>
  );
}
