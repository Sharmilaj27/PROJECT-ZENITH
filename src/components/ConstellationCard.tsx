import { motion } from "framer-motion";
import type { ConstellationPattern } from "@/lib/celestial";

export function ConstellationCard({ pattern }: { pattern: ConstellationPattern }) {
  return (
    <div className="glass card-glow group relative h-[150px] w-[200px] shrink-0 rounded-xl p-3 transition hover:scale-[1.03]">
      <svg viewBox="0 0 100 60" className="h-[90px] w-full">
        {pattern.lines.map(([a, b], i) => {
          const [x1, y1] = pattern.stars[a];
          const [x2, y2] = pattern.stars[b];
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="oklch(0.78 0.22 260)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.2, delay: i * 0.08 }}
            />
          );
        })}
        {pattern.stars.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="1.4"
            fill="white"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05, type: "spring", stiffness: 200 }}
          />
        ))}
      </svg>
      <div className="mt-1 font-display text-sm font-bold neon-text">{pattern.name}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Constellation
      </div>
    </div>
  );
}
