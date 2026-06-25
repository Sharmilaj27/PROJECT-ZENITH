import { motion } from "framer-motion";
import { useMemo } from "react";
import { CATEGORY_COLOR, type SatCategory } from "@/lib/celestial";

export type OrbitSat = {
  id: string;
  name: string;
  category: SatCategory;
  altitude: number;
};

type Props = {
  satellites: OrbitSat[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

const SIZE = 420;
const CENTER = SIZE / 2;
const EARTH_R = 70;

export function EarthOrbit({ satellites, selectedId, onSelect }: Props) {
  // Bucket satellites into 4 orbital shells for visualization.
  const shells = useMemo(() => {
    const radii = [110, 145, 180, 210];
    const tilts = [0, 18, -22, 35];
    const buckets: OrbitSat[][] = [[], [], [], []];
    satellites.slice(0, 60).forEach((s, i) => buckets[i % 4].push(s));
    return buckets.map((sats, i) => ({ r: radii[i], tilt: tilts[i], sats }));
  }, [satellites]);

  return (
    <div className="relative aspect-square w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
        <defs>
          <radialGradient id="earthGrad" cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor="oklch(0.62 0.18 220)" />
            <stop offset="55%" stopColor="oklch(0.32 0.14 250)" />
            <stop offset="100%" stopColor="oklch(0.12 0.08 270)" />
          </radialGradient>
          <radialGradient id="atmoGrad" cx="50%" cy="50%" r="60%">
            <stop offset="60%" stopColor="oklch(0.78 0.18 230 / 0)" />
            <stop offset="100%" stopColor="oklch(0.78 0.2 230 / 0.5)" />
          </radialGradient>
          <pattern id="earthGrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="oklch(0.88 0.18 200 / 0.18)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer atmosphere glow */}
        <circle cx={CENTER} cy={CENTER} r={EARTH_R + 16} fill="url(#atmoGrad)" />

        {/* Orbit ellipses */}
        {shells.map((shell, i) => (
          <g key={i} transform={`rotate(${shell.tilt} ${CENTER} ${CENTER})`}>
            <ellipse
              cx={CENTER}
              cy={CENTER}
              rx={shell.r}
              ry={shell.r * 0.32}
              fill="none"
              stroke="oklch(0.78 0.18 230 / 0.35)"
              strokeWidth="0.6"
              strokeDasharray="3 4"
            />
          </g>
        ))}

        {/* Earth */}
        <circle cx={CENTER} cy={CENTER} r={EARTH_R} fill="url(#earthGrad)" />
        <circle cx={CENTER} cy={CENTER} r={EARTH_R} fill="url(#earthGrid)" opacity="0.7" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={EARTH_R}
          fill="none"
          stroke="oklch(0.88 0.2 200 / 0.6)"
          strokeWidth="0.8"
          filter="url(#glow)"
        />

        {/* Satellites animated along orbits */}
        {shells.map((shell, si) => {
          const duration = 18 + si * 6;
          return (
            <g key={si} transform={`rotate(${shell.tilt} ${CENTER} ${CENTER})`}>
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration, ease: "linear", repeat: Infinity }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              >
                {shell.sats.map((sat, i) => {
                  const angle = (i / Math.max(shell.sats.length, 1)) * Math.PI * 2;
                  const x = CENTER + Math.cos(angle) * shell.r;
                  const y = CENTER + Math.sin(angle) * shell.r * 0.32;
                  const selected = sat.id === selectedId;
                  const color = CATEGORY_COLOR[sat.category];
                  return (
                    <g key={sat.id} onClick={() => onSelect?.(sat.id)} style={{ cursor: "pointer" }}>
                      {selected && (
                        <circle cx={x} cy={y} r="9" fill={color} opacity="0.25" filter="url(#glow)" />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={selected ? 3.5 : 2}
                        fill={color}
                        stroke="white"
                        strokeOpacity={selected ? 0.8 : 0.2}
                        strokeWidth="0.5"
                      />
                    </g>
                  );
                })}
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* Floating label */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]/80">
        Live Orbital View · {satellites.length} tracked
      </div>
    </div>
  );
}
