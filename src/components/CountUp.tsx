"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * A number that counts up when it scrolls into view.
 *
 * It renders the REAL value first and only drops to zero once an animation is
 * actually about to run. The obvious way round — start state at 0 and count up
 * from there — means the true number exists nowhere in the server HTML, so
 * anything that doesn't run the IntersectionObserver sees "0 law firms"
 * forever: a crawler, a reduced-capability browser, a zero-height viewport, a
 * failed hydration. On a directory whose whole pitch is scale, that is the
 * worst possible number to show, and it fails silently.
 *
 * Resetting to 0 in a layout effect keeps the animation intact without a flash
 * of the final value, because it lands before the browser paints.
 */

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CountUp({
  to,
  duration = 1500,
  suffix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(to);
  const ran = useRef(false);

  // Arm the animation: park at 0 before first paint, but only if we can animate.
  useIsoLayoutEffect(() => {
    if (ran.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
  }, []);

  useEffect(() => {
    if (!inView || ran.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    ran.current = true;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — fast then settles, reads as "counting up and locking in"
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setN(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  // Belt and braces: if the observer never reports (zero-height viewport, no
  // IntersectionObserver, hydration that never completes), show the real number
  // rather than a permanent zero.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!ran.current) setN(to);
    }, 2500);
    return () => clearTimeout(id);
  }, [to]);

  return (
    <span ref={ref} className="tabular">
      {n.toLocaleString("en-AU")}
      {suffix}
    </span>
  );
}
