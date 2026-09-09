"use client";

import dynamic from "next/dynamic";

const HeroMap = dynamic(() => import("./HeroMap"), {
  ssr: false,
  loading: () => null,
});

export default function HeroCanvas({ points }: { points: [number, number][] }) {
  return <HeroMap points={points} />;
}
