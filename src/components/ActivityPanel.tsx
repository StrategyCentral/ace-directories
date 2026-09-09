import type { Activity } from "@/lib/queries";

export default function ActivityPanel({
  activity,
  daily,
}: {
  activity: Activity;
  daily: { day: string; views: number; calls: number }[];
}) {
  const peak = Math.max(1, ...daily.map((d) => d.views));

  return (
    <div className="surface rounded-[var(--radius-card)] p-5 mb-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="eyebrow">Last 30 days</p>
        <p className="text-[11.5px] text-paper-600">
          {activity.views_90.toLocaleString("en-AU")} views · {activity.calls_90.toLocaleString("en-AU")} calls in 90 days
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <Metric label="Profile views" value={activity.views_30} />
        <Metric label="Phone taps" value={activity.calls_30} accent />
        <Metric label="Website clicks" value={activity.website_30} />
        <Metric label="Enquiries" value={activity.enquiries_30} accent />
      </div>

      {daily.length > 0 && (
        <div className="mt-5">
          <div className="flex items-end gap-[3px] h-14" aria-hidden="true">
            {daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.views} views, ${d.calls} calls`}
                className="flex-1 rounded-sm bg-brand-500/35 min-h-[2px]"
                style={{ height: `${Math.max(3, (d.views / peak) * 100)}%` }}
              />
            ))}
          </div>
          <p className="text-[10.5px] text-paper-600 mt-2">
            Daily profile views · {daily[0]?.day} to {daily[daily.length - 1]?.day}
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`display text-[26px] tabular ${accent ? "text-gold-300" : "text-paper-100"}`}>
        {value.toLocaleString("en-AU")}
      </p>
      <p className="text-[11px] text-paper-600 mt-0.5">{label}</p>
    </div>
  );
}
