import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  CELESTIAL_CATALOG,
  raDecToAltAz,
  type CelestialObject,
} from "@/lib/celestial";

type Props = {
  lat: number;
  lon: number;
  now: Date;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

const SIZE = 440;
const C = SIZE / 2;
const R = 200;

const KIND_COLOR: Record<CelestialObject["kind"], string> = {
  Planet: "oklch(0.85 0.2 60)",
  Star: "oklch(0.95 0.05 220)",
  Constellation: "oklch(0.78 0.22 260)",
  ISS: "oklch(0.88 0.18 160)",
  DeepSky: "oklch(0.78 0.22 320)",
};

export function SkyDome({ lat, lon, now, selectedId, onSelect }: Props) {
  const positioned = useMemo(() => {
    return CELESTIAL_CATALOG.map((o) => {
      const { alt, az } = raDecToAltAz(o.ra, o.dec, lat, lon, now);
      // Project onto dome: r scales with (90-alt). Above-horizon only.
      const visible = alt > 0;
      const rr = ((90 - Math.max(alt, 0)) / 90) * R;
      const theta = ((az - 90) * Math.PI) / 180; // 0° = N at top
      const x = C + rr * Math.cos(theta);
      const y = C + rr * Math.sin(theta);
      return { ...o, alt, az, x, y, visible };
    });
  }, [lat, lon, now]);

  // Background twinkle stars (deterministic).
  const bgStars = useMemo(() => {
    const arr: { x: number; y: number; r: number; d: number }[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 90; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = rand() * R * 0.96;
      arr.push({
        x: C + Math.cos(angle) * radius,
        y: C + Math.sin(angle) * radius,
        r: rand() * 0.9 + 0.3,
        d: rand() * 2,
      });
    }
    return arr;
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[480px] mx-auto">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
        <defs>
          <radialGradient id="domeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.18 0.1 270)" />
            <stop offset="70%" stopColor="oklch(0.10 0.07 270)" />
            <stop offset="100%" stopColor="oklch(0.06 0.04 270)" />
          </radialGradient>
          <filter id="skyGlow">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        <circle cx={C} cy={C} r={R} fill="url(#domeGrad)" stroke="oklch(0.78 0.18 230 / 0.4)" strokeWidth="1" />

        {/* Altitude rings */}
        {[0.33, 0.66].map((f, i) => (
          <circle
            key={i}
            cx={C}
            cy={C}
            r={R * f}
            fill="none"
            stroke="oklch(0.78 0.18 230 / 0.18)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
        ))}

        {/* Compass cross */}
        <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="oklch(0.78 0.18 230 / 0.2)" strokeDasharray="2 4" />
        <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="oklch(0.78 0.18 230 / 0.2)" strokeDasharray="2 4" />

        {/* Background twinkle stars */}
        {bgStars.map((s, i) => (
          <motion.circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="white"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2 + s.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Celestial objects */}
        {positioned.filter((p) => p.visible).map((o) => {
          const selected = o.id === selectedId;
          const color = KIND_COLOR[o.kind];
          const size = o.kind === "Planet" ? 4.5 : o.kind === "Constellation" ? 3 : 3.2;
          return (
            <g key={o.id} onClick={() => onSelect?.(o.id)} style={{ cursor: "pointer" }}>
              {selected && (
                <circle cx={o.x} cy={o.y} r={12} fill={color} opacity="0.25" filter="url(#skyGlow)" />
              )}
              <circle
                cx={o.x}
                cy={o.y}
                r={size}
                fill={color}
                stroke="white"
                strokeOpacity={selected ? 0.9 : 0.3}
                strokeWidth="0.6"
              />
              {(o.kind === "Planet" || selected) && (
                <text
                  x={o.x + 8}
                  y={o.y + 3}
                  fontSize="9"
                  fill="oklch(0.95 0.05 240)"
                  fontFamily="Inter, sans-serif"
                >
                  {o.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Compass labels */}
        {[
          { l: "N", x: C, y: C - R - 8 },
          { l: "S", x: C, y: C + R + 16 },
          { l: "E", x: C + R + 12, y: C + 4 },
          { l: "W", x: C - R - 12, y: C + 4 },
        ].map((d) => (
          <text
            key={d.l}
            x={d.x}
            y={d.y}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="oklch(0.88 0.18 200)"
            fontFamily="Orbitron, sans-serif"
          >
            {d.l}
          </text>
        ))}
      </svg>
    </div>
  );
}
