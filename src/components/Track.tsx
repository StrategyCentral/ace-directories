"use client";

import { useEffect, useRef } from "react";

/** Fire-and-forget beacon. Falls back to fetch where sendBeacon is unavailable. */
export function track(listingId: string, kind: string, source?: string) {
  const payload = JSON.stringify({ listing_id: listingId, kind, source });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

/** Records one profile view per mount. */
export default function TrackView({ listingId, source }: { listingId: string; source?: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // A visitor who bounces in under two seconds isn't a real view.
    const id = setTimeout(() => track(listingId, "view", source), 2000);
    return () => clearTimeout(id);
  }, [listingId, source]);
  return null;
}

/** A tel: link that records the tap before the dialler takes over. */
export function TrackedPhone({
  listingId,
  phone,
  href,
  className,
  children,
}: {
  listingId: string;
  phone: string;
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track(listingId, "call", "profile")}
    >
      {children ?? phone}
    </a>
  );
}

/** An outbound website link that records the click. */
export function TrackedLink({
  listingId,
  href,
  className,
  children,
}: {
  listingId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(listingId, "website", "profile")}
    >
      {children}
    </a>
  );
}
