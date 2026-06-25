import { motion } from "framer-motion";

export function MiniBarChart({
  data,
  color = "oklch(0.78 0.18 230)",
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex items-center gap-2 text-[11px]">
            <div className="w-20 shrink-0 truncate text-muted-foreground">{d.label}</div>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, oklch(0.7 0.25 300))` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
            <div className="w-10 shrink-0 text-right tabular-nums text-foreground/80">{d.value}</div>
          </div>
        );
      })}
      <div className="sr-only" aria-hidden style={{ height }} />
    </div>
  );
}

export function Sparkline({ values, color = "oklch(0.88 0.18 200)" }: { values: number[]; color?: string }) {
  if (values.length === 0) return null;
  const w = 120;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1 || 1)) * w},${h - ((v - min) / span) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full">
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={pts}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}
