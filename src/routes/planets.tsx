import { createFileRoute } from "@tanstack/react-router";
import { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, Stat } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { compassDir, eqToHoriz, planetRaDec, riseSet } from "@/lib/astro";
import { Compass, Sparkles, ArrowUpDown, Eye, EyeOff, Clock, MapPin, GitCompareArrows, X } from "lucide-react";

export const Route = createFileRoute("/planets")({
  head: () => ({
    meta: [
      { title: "Planet Visibility · Zenith" },
      { name: "description", content: "Tonight's planets — visibility, direction, rise & set times." },
    ],
  }),
  component: PlanetsRoute,
});

const PLANETS = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;
type PlanetName = (typeof PLANETS)[number];

type PlanetStyle = {
  base: string;
  highlight: string;
  ring?: string;
  glow: string;
  bands?: string;
  size: number;
  fact: string;
  type: string;
};

const STYLES: Record<PlanetName, PlanetStyle> = {
  Mercury: {
    base: "oklch(0.78 0.06 60)",
    highlight: "oklch(0.95 0.04 80)",
    glow: "oklch(0.85 0.1 70)",
    size: 0.62,
    fact: "Smallest planet, closest to the Sun.",
    type: "Terrestrial",
  },
  Venus: {
    base: "oklch(0.86 0.12 85)",
    highlight: "oklch(0.97 0.08 95)",
    glow: "oklch(0.9 0.16 80)",
    bands: "oklch(0.78 0.14 70)",
    size: 0.78,
    fact: "Brightest planet — the morning & evening star.",
    type: "Terrestrial",
  },
  Mars: {
    base: "oklch(0.7 0.2 35)",
    highlight: "oklch(0.88 0.18 45)",
    glow: "oklch(0.72 0.24 30)",
    bands: "oklch(0.55 0.18 25)",
    size: 0.7,
    fact: "The Red Planet — rusted iron oxide surface.",
    type: "Terrestrial",
  },
  Jupiter: {
    base: "oklch(0.82 0.12 70)",
    highlight: "oklch(0.95 0.1 85)",
    glow: "oklch(0.85 0.16 60)",
    bands: "oklch(0.68 0.14 45)",
    size: 1,
    fact: "Largest planet — gas giant with the Great Red Spot.",
    type: "Gas Giant",
  },
  Saturn: {
    base: "oklch(0.86 0.1 90)",
    highlight: "oklch(0.97 0.08 95)",
    ring: "oklch(0.92 0.08 85)",
    glow: "oklch(0.88 0.12 85)",
    bands: "oklch(0.74 0.1 75)",
    size: 0.92,
    fact: "Famous for its dazzling system of icy rings.",
    type: "Gas Giant",
  },
  Uranus: {
    base: "oklch(0.82 0.14 200)",
    highlight: "oklch(0.95 0.1 200)",
    glow: "oklch(0.85 0.18 205)",
    ring: "oklch(0.82 0.12 220)",
    size: 0.84,
    fact: "Ice giant tilted on its side — rolls around the Sun.",
    type: "Ice Giant",
  },
  Neptune: {
    base: "oklch(0.62 0.2 255)",
    highlight: "oklch(0.85 0.18 240)",
    glow: "oklch(0.7 0.24 250)",
    bands: "oklch(0.5 0.22 260)",
    size: 0.82,
    fact: "Windiest planet — supersonic storms tear its clouds.",
    type: "Ice Giant",
  },
};

class PlanetsErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("Planets page error:", error); }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <GlassCard className="text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">// Telemetry lost</div>
            <h2 className="mt-2 font-display text-2xl font-black"><span className="neon-text">Planet feed unavailable</span></h2>
            <p className="mt-2 text-sm text-foreground/70">
              We hit an unexpected error while computing tonight's planet visibility. Mission control is standing by.
            </p>
            <button onClick={this.reset} className="btn-neon mt-6">Retry</button>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}

function PlanetsRoute() {
  return (
    <PlanetsErrorBoundary>
      <PlanetsPage />
    </PlanetsErrorBoundary>
  );
}

type PlanetRow = {
  name: PlanetName;
  visible: boolean;
  alt: number;
  az: number;
  dir: string;
  rise: string;
  set: string;
  score: number;
};

function PlanetsPage() {
  const [coord, setCoord] = useState({ lat: 28.6139, lon: 77.209 });
  const [now, setNow] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);
  const [sort, setSort] = useState<"score" | "alt" | "name">("score");
  const [filter, setFilter] = useState<"all" | "visible">("all");
  const [compare, setCompare] = useState<PlanetName[]>([]);

  useEffect(() => {
    setNow(new Date());
    const t = setTimeout(() => setReady(true), 350);
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    try {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (p?.coords && Number.isFinite(p.coords.latitude) && Number.isFinite(p.coords.longitude)) {
            setCoord({ lat: p.coords.latitude, lon: p.coords.longitude });
          }
        },
        () => {},
        { timeout: 8000 }
      );
    } catch (e) { console.warn("geolocation failed", e); }
  }, []);

  const rows = useMemo<PlanetRow[]>(() => {
    if (!now) return [];
    return PLANETS.map((p) => {
      try {
        const eq = planetRaDec(p, now);
        if (!eq || !Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) return null;
        const h = eqToHoriz(eq, coord.lat, coord.lon, now);
        if (!h || !Number.isFinite(h.alt) || !Number.isFinite(h.az)) return null;
        const rs = riseSet(eq, coord.lat, coord.lon, now) ?? { rise: "—", set: "—" };
        const visible = h.alt > 0;
        const score = Math.max(0, Math.min(10, ((h.alt + 10) / 90) * 10));
        return {
          name: p,
          visible,
          alt: h.alt,
          az: h.az,
          dir: compassDir(h.az) ?? "—",
          rise: rs.rise ?? "—",
          set: rs.set ?? "—",
          score,
        };
      } catch (e) {
        console.warn(`planet calc failed for ${p}`, e);
        return null;
      }
    }).filter((r): r is PlanetRow => r !== null);
  }, [coord, now]);

  const visibleCount = rows.filter((r) => r.visible).length;
  const best = useMemo(() => {
    return [...rows].filter((r) => r.visible).sort((a, b) => b.score - a.score)[0] ?? null;
  }, [rows]);

  const displayed = useMemo(() => {
    let r = [...rows];
    if (filter === "visible") r = r.filter((x) => x.visible);
    if (sort === "score") r.sort((a, b) => b.score - a.score);
    if (sort === "alt") r.sort((a, b) => b.alt - a.alt);
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [rows, sort, filter]);

  const toggleCompare = (n: PlanetName) => {
    setCompare((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 3) return [...prev.slice(1), n];
      return [...prev, n];
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Planet Visibility Command Center"
        sub="Live ephemeris for the seven classical planets — tracked against your sky in real time."
      />

      {/* Hero stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroTile
          icon={<Sparkles className="size-4" />}
          label="Visible Tonight"
          value={ready ? `${visibleCount}/7` : "—"}
          sub={ready ? `${7 - visibleCount} below horizon` : "scanning sky…"}
          accent="oklch(0.78 0.2 220)"
          ready={ready}
        />
        <HeroTile
          icon={<Clock className="size-4" />}
          label="Observation Time"
          value={now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          sub={now ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : ""}
          accent="oklch(0.85 0.18 200)"
          ready={ready}
        />
        <HeroTile
          icon={<MapPin className="size-4" />}
          label="Observer Location"
          value={`${coord.lat.toFixed(2)}°, ${coord.lon.toFixed(2)}°`}
          sub="Geo-anchored ephemeris"
          accent="oklch(0.7 0.25 300)"
          ready={ready}
        />
        <HeroTile
          icon={<Eye className="size-4" />}
          label="Best Planet Tonight"
          value={best ? best.name : ready ? "—" : ""}
          sub={best ? `${best.dir} · alt ${best.alt.toFixed(0)}°` : ready ? "All below horizon" : "calculating…"}
          accent={best ? STYLES[best.name].glow : "oklch(0.78 0.2 220)"}
          ready={ready}
        />
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-border bg-white/5 p-1 text-xs">
          {(["all", "visible"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 transition ${
                filter === f
                  ? "bg-[color:var(--neon)]/20 text-[color:var(--neon-cyan)] neon-border"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {f === "all" ? "All planets" : "Visible only"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpDown className="size-3.5" />
          <span>Sort</span>
          <div className="flex gap-1 rounded-full border border-border bg-white/5 p-1">
            {(["score", "alt", "name"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-2.5 py-1 capitalize transition ${
                  sort === s
                    ? "bg-[color:var(--neon)]/20 text-[color:var(--neon-cyan)]"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {s === "alt" ? "altitude" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Planet cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!ready && Array.from({ length: 8 }).map((_, i) => <PlanetSkeleton key={i} />)}
        {ready && displayed.length === 0 && (
          <GlassCard className="col-span-full text-center">
            <p className="text-sm text-foreground/70">No planets match this filter right now.</p>
          </GlassCard>
        )}
        <AnimatePresence mode="popLayout">
          {ready && displayed.map((r, idx) => (
            <PlanetCard
              key={r.name}
              row={r}
              idx={idx}
              selected={compare.includes(r.name)}
              onToggle={() => toggleCompare(r.name)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Comparison panel */}
      <ComparisonPanel
        rows={rows.filter((r) => compare.includes(r.name))}
        onRemove={(n) => setCompare((c) => c.filter((x) => x !== n))}
        onClear={() => setCompare([])}
      />
    </div>
  );
}

function HeroTile({
  icon, label, value, sub, accent, ready,
}: { icon: ReactNode; label: string; value: ReactNode; sub?: string; accent: string; ready: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass card-glow relative overflow-hidden rounded-2xl p-4"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-30 blur-3xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        <span className="grid size-6 place-items-center rounded-md bg-white/5 text-[color:var(--neon-cyan)]">{icon}</span>
        {label}
      </div>
      {ready ? (
        <div className="mt-2 font-display text-2xl font-black neon-text">{value}</div>
      ) : (
        <div className="mt-2 h-7 w-28 animate-pulse rounded bg-white/10" />
      )}
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function PlanetSkeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-white/10" />
          <div className="h-5 w-24 rounded bg-white/10" />
        </div>
        <div className="size-20 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 h-3 w-24 rounded bg-white/10" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
    </div>
  );
}

function PlanetCard({
  row, idx, selected, onToggle,
}: { row: PlanetRow; idx: number; selected: boolean; onToggle: () => void }) {
  const style = STYLES[row.name];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay: idx * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <div className="glass card-glow relative overflow-hidden rounded-2xl p-5 transition-shadow group-hover:shadow-[0_12px_40px_oklch(0_0_0/0.5),0_0_60px_var(--planet-glow,oklch(0.78_0.2_220/0.35))]"
        style={{ ["--planet-glow" as never]: style.glow } as React.CSSProperties}
      >
        {/* Orbit ring decoration */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full border border-white/5" />
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-50 blur-2xl transition group-hover:opacity-80"
          style={{ background: style.glow }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{style.type}</div>
            <h3 className="font-display text-xl font-bold tracking-wide">{row.name}</h3>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-black/20 px-2.5 py-1 text-xs">
              <span className={`size-1.5 rounded-full ${row.visible ? "bg-emerald-400 shadow-[0_0_8px_oklch(0.78_0.2_140)]" : "bg-zinc-500"}`} />
              {row.visible ? "Visible now" : "Below horizon"}
            </div>
          </div>
          <PlanetOrb style={style} />
        </div>

        <dl className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Direction</dt>
          <dd className="text-right font-medium">{row.dir} · {row.az.toFixed(0)}°</dd>
          <dt className="text-muted-foreground">Altitude</dt>
          <dd className="text-right font-medium">{row.alt.toFixed(1)}°</dd>
          <dt className="text-muted-foreground">Rise</dt>
          <dd className="text-right">{row.rise}</dd>
          <dt className="text-muted-foreground">Set</dt>
          <dd className="text-right">{row.set}</dd>
        </dl>

        <div className="relative mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Visibility score</span><span className="font-medium text-foreground/80">{row.score.toFixed(1)} / 10</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${style.glow}, oklch(0.78 0.2 220))` }}
              initial={{ width: 0 }}
              animate={{ width: `${row.score * 10}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </div>

        <p className="relative mt-4 text-[11px] leading-relaxed text-foreground/60">{style.fact}</p>

        <button
          onClick={onToggle}
          className={`relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-wider transition ${
            selected
              ? "border-[color:var(--neon-cyan)]/60 bg-[color:var(--neon)]/15 text-[color:var(--neon-cyan)] neon-border"
              : "border-border bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <GitCompareArrows className="size-3.5" />
          {selected ? "In comparison" : "Add to compare"}
        </button>
      </div>
    </motion.div>
  );
}

function PlanetOrb({ style }: { style: PlanetStyle }) {
  const px = Math.round(72 + style.size * 28);
  const bg = `radial-gradient(circle at 32% 30%, ${style.highlight} 0%, ${style.base} 45%, ${style.base} 70%, ${style.glow} 100%)`;
  const bands = style.bands
    ? `repeating-linear-gradient(180deg, transparent 0 6px, ${style.bands} 6px 7px, transparent 7px 13px)`
    : null;
  return (
    <div
      className="relative shrink-0"
      style={{ width: px, height: px }}
    >
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{ background: style.glow }}
      />
      {/* planet */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ background: bg, boxShadow: `inset -4px -6px 16px oklch(0 0 0 / 0.25), 0 0 30px ${style.glow}` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {bands && <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: bands }} />}
        {/* surface highlight */}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 30% 25%, oklch(1 0 0 / 0.35) 0%, transparent 35%)` }}
        />
      </motion.div>
      {/* Saturn rings */}
      {style.ring && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: px * 1.7,
            height: px * 0.5,
            transform: `translate(-50%, -50%) rotate(-22deg)`,
            background: `radial-gradient(ellipse at center, transparent 38%, ${style.ring} 42%, ${style.ring} 58%, transparent 62%)`,
            filter: `drop-shadow(0 0 10px ${style.glow})`,
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
}

function ComparisonPanel({
  rows, onRemove, onClear,
}: { rows: PlanetRow[]; onRemove: (n: PlanetName) => void; onClear: () => void }) {
  if (rows.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10"
    >
      <GlassCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">// Comparison Bay</div>
            <h3 className="font-display text-xl font-bold">Planet Comparison</h3>
          </div>
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
            Clear all
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const s = STYLES[r.name];
            return (
              <div key={r.name} className="relative rounded-xl border border-border bg-white/5 p-4">
                <button
                  onClick={() => onRemove(r.name)}
                  className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-border bg-black/40 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${r.name}`}
                >
                  <X className="size-3" />
                </button>
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${s.highlight}, ${s.base} 60%, ${s.glow})`,
                      boxShadow: `0 0 20px ${s.glow}`,
                    }}
                  />
                  <div>
                    <div className="font-display text-base font-bold">{r.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.type}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Altitude" value={`${r.alt.toFixed(1)}°`} />
                  <Stat label="Direction" value={r.dir} sub={`${r.az.toFixed(0)}°`} />
                  <Stat label="Score" value={`${r.score.toFixed(1)}`} sub="/ 10" />
                  <Stat label="Status" value={r.visible ? "Up" : "Down"} sub={r.visible ? "in sky" : "below"} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Compass className="size-3" /> rises {r.rise} · sets {r.set}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparative bar chart */}
        <div className="mt-6 rounded-xl border border-border bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Visibility scores</div>
          <div className="mt-3 space-y-2">
            {rows.map((r) => {
              const s = STYLES[r.name];
              return (
                <div key={r.name} className="grid grid-cols-[80px_1fr_42px] items-center gap-3 text-xs">
                  <div className="font-medium">{r.name}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.score * 10}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${s.glow}, oklch(0.78 0.2 220))` }}
                    />
                  </div>
                  <div className="text-right text-muted-foreground">{r.score.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </div>
        {rows.length < 3 && (
          <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <EyeOff className="size-3" /> Select up to 3 planets to compare side-by-side.
          </p>
        )}
      </GlassCard>
    </motion.section>
  );
}
