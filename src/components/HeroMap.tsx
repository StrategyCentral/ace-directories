"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * The hero is not decoration — every dot is a real listing at its real
 * coordinates. 5,900 firms, drawn as a point cloud of Australia.
 */

const BOUNDS = { minLng: 112, maxLng: 154, minLat: -44, maxLat: -10 };
const WIDTH = 13;
const HEIGHT = (WIDTH * (BOUNDS.maxLat - BOUNDS.minLat)) / (BOUNDS.maxLng - BOUNDS.minLng) * 1.25;

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng) - 0.5) * WIDTH;
  const y = ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat) - 0.5) * HEIGHT;
  return [x, y];
}

/** Coarse coastline — enough to read as Australia, cheap enough to be a line. */
const MAINLAND: [number, number][] = [
  [142.5, -10.7], [145.3, -14.9], [146.3, -18.6], [148.8, -20.4], [149.5, -22.5],
  [150.9, -23.5], [153.1, -25.9], [153.6, -28.6], [153.0, -30.3], [152.5, -32.4],
  [151.3, -33.4], [150.2, -35.6], [149.9, -37.5], [147.9, -37.9], [146.4, -38.8],
  [145.0, -38.4], [144.5, -38.1], [143.5, -38.8], [141.6, -38.4], [140.0, -37.9],
  [139.3, -35.6], [138.5, -35.6], [138.1, -34.2], [137.6, -35.2], [136.9, -35.3],
  [136.0, -34.9], [135.2, -34.6], [134.2, -32.6], [132.3, -32.0], [130.0, -31.6],
  [127.3, -32.3], [124.4, -33.0], [123.6, -33.9], [121.9, -33.9], [119.9, -34.0],
  [118.0, -35.1], [116.0, -34.9], [115.0, -34.3], [115.1, -33.5], [115.7, -32.0],
  [114.9, -30.5], [114.1, -28.1], [113.4, -26.1], [113.8, -24.9], [113.7, -22.6],
  [114.9, -21.8], [116.7, -20.6], [119.0, -20.0], [121.0, -19.6], [122.2, -18.0],
  [123.6, -17.5], [124.4, -16.4], [126.0, -13.8], [128.0, -15.4], [129.5, -14.8],
  [130.2, -12.6], [131.0, -12.2], [132.6, -12.1], [133.7, -11.5], [135.5, -12.2],
  [136.9, -12.0], [135.9, -13.8], [136.9, -15.8], [139.0, -17.7], [141.0, -16.5],
  [141.6, -14.0], [142.5, -10.7],
];

const TASMANIA: [number, number][] = [
  [144.7, -40.7], [148.3, -40.7], [148.3, -42.5], [147.9, -43.5],
  [146.0, -43.6], [145.2, -42.2], [144.7, -40.7],
];

function Coastline({ path }: { path: [number, number][] }) {
  const line = useMemo(() => {
    const pts = path.map(([lng, lat]) => {
      const [x, y] = project(lng, lat);
      return new THREE.Vector3(x, y, -0.05);
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({
      color: "#3f74ff",
      transparent: true,
      opacity: 0.5,
    });
    return new THREE.Line(geometry, material);
  }, [path]);

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);

  return <primitive object={line} />;
}

const CAPITALS: { name: string; lng: number; lat: number }[] = [
  { name: "Sydney", lng: 151.209, lat: -33.868 },
  { name: "Melbourne", lng: 144.963, lat: -37.814 },
  { name: "Brisbane", lng: 153.026, lat: -27.47 },
  { name: "Perth", lng: 115.857, lat: -31.953 },
  { name: "Adelaide", lng: 138.6, lat: -34.928 },
  { name: "Hobart", lng: 147.325, lat: -42.882 },
  { name: "Canberra", lng: 149.128, lat: -35.282 },
  { name: "Darwin", lng: 130.845, lat: -12.463 },
];

function dotTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(180,205,255,0.85)");
  g.addColorStop(1, "rgba(63,116,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function Cloud({ points }: { points: [number, number][] }) {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const texture = useMemo(dotTexture, []);

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const sd = new Float32Array(points.length);
    points.forEach(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = 0;
      sd[i] = Math.random() * Math.PI * 2;
    });
    return { positions: pos, seeds: sd };
  }, [points]);

  // Dots settle into place on load, then breathe very slightly.
  useFrame(({ clock }) => {
    const g = ref.current?.geometry as THREE.BufferGeometry | undefined;
    if (!g) return;
    const t = clock.getElapsedTime();
    const attr = g.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < seeds.length; i++) {
      arr[i * 3 + 2] = Math.sin(t * 0.55 + seeds[i]) * 0.13;
    }
    attr.needsUpdate = true;
    if (matRef.current) {
      matRef.current.opacity = Math.min(1, matRef.current.opacity + 0.03);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.26}
        map={texture}
        color="#b6cdff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Beacons() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    group.current?.children.forEach((child, i) => {
      const s = 1 + (Math.sin(t * 1.1 - i * 0.8) * 0.5 + 0.5) * 1.9;
      child.scale.setScalar(s);
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.42 * (1 - (s - 1) / 1.9);
    });
  });
  return (
    <group ref={group}>
      {CAPITALS.map((c) => {
        const [x, y] = project(c.lng, c.lat);
        return (
          <mesh key={c.name} position={[x, y, 0.05]}>
            <ringGeometry args={[0.16, 0.2, 48]} />
            <meshBasicMaterial color="#c9a84c" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({ points }: { points: [number, number][] }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const k = Math.min(1, delta * 2.2);
    group.current.rotation.y += (target.current.x * 0.22 - group.current.rotation.y) * k;
    group.current.rotation.x += (-0.34 + target.current.y * 0.1 - group.current.rotation.x) * k;
  });

  // Sit the continent in the right-hand third so the headline keeps the left.
  // Scale from the viewport height so the whole country always fits the frame.
  const wide = viewport.width >= 11;
  const scale = Math.min(0.78, (viewport.height * 0.86) / HEIGHT);
  const offsetX = wide ? viewport.width * 0.13 : 0;
  const offsetY = wide ? 0.2 : 1.4;

  return (
    <group ref={group} position={[offsetX, offsetY, 0]} rotation={[-0.34, 0, 0]} scale={scale}>
      <Coastline path={MAINLAND} />
      <Coastline path={TASMANIA} />
      <Cloud points={points} />
      <Beacons />
    </group>
  );
}

export default function HeroMap({ points }: { points: [number, number][] }) {
  const host = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Measure the container rather than the window: the hero can be laid out
  // before the viewport reports a width, which would wrongly fall back to SVG.
  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const capable = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      try {
        const probe = document.createElement("canvas");
        return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
      } catch {
        return false;
      }
    };

    const evaluate = () => setEnabled(el.clientWidth >= 640 && capable());
    evaluate();

    const ro = new ResizeObserver(evaluate);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={host} className="absolute inset-0" aria-hidden="true">
      {enabled && points.length > 0 ? (
        <Canvas
          camera={{ position: [0, 0, 11], fov: 42 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Scene points={points} />
        </Canvas>
      ) : (
        <StaticFallback points={points} />
      )}
    </div>
  );
}

/** SVG stand-in for reduced motion, small screens and no-WebGL. */
function StaticFallback({ points }: { points: [number, number][] }) {
  const sample = points.filter((_, i) => i % 3 === 0);
  return (
    <div className="absolute inset-0 grid place-items-center opacity-45" aria-hidden="true">
      <svg viewBox="0 0 420 340" className="w-[min(90vw,820px)]">
        {sample.map(([lng, lat], i) => {
          const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 420;
          const y = 340 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 340;
          return <circle key={i} cx={x} cy={y} r="1.1" fill="#6d97ff" opacity="0.7" />;
        })}
      </svg>
    </div>
  );
}
