export default function TestListingBanner() {
  return (
    <div role="alert" className="test-banner mx-auto max-w-[1240px] px-5 mt-4">
      <div className="rounded-2xl border-2 border-red-500 bg-red-500/[0.12] px-6 py-4 text-center">
        <p className="text-[15px] font-bold tracking-[0.14em] uppercase text-red-300">Admin test listing</p>
        <p className="text-[13.5px] text-red-200 mt-1">&gt;&gt; This is not a real listing &lt;&lt;</p>
      </div>
    </div>
  );
}
