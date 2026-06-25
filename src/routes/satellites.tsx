import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Satellite as SatIcon, Activity, Clock, Target, AlertTriangle, Copy, Check } from "lucide-react";
import { GlassCard, Stat, Skeleton } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { EarthOrbit, type OrbitSat } from "@/components/EarthOrbit";
import { MiniBarChart, Sparkline } from "@/components/MiniCharts";
import {
  categorizeSatellite,
  CATEGORY_COLOR,
  SAT_CATEGORIES,
  type SatCategory,
} from "@/lib/celestial";

export const Route = createFileRoute("/satellites")({
  head: () => ({
    meta: [
      { title: "Satellite Explorer · Zenith" },
      {
        name: "description",
        content:
          "Live mission control for orbital traffic — explore active satellites, orbits, telemetry and statistics.",
      },
    ],
  }),
  component: SatellitesPage,
});

type SatelliteData = {
  id: string;
  name: string;
  noradId: string;
  category: SatCategory;
  altitude: number;
  velocity: number;
  inclination: number;
  meanMotion: number;
};

type FetchState = "idle" | "loading" | "ok" | "error";

function SatellitesPage() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [state, setState] = useState<FetchState>("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<SatCategory>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  const fetchSatellites = useCallback(async () => {
    setState((s) => (s === "ok" ? "ok" : "loading"));
    try {
      const res = await fetch(
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
      );
      if (!res.ok) throw new Error("network");
      const data = await res.json();
      const liveSats: SatelliteData[] = (data as Array<Record<string, unknown>>)
        .slice(0, 250)
        .map((sat, i): SatelliteData => {
          const name = String(sat.OBJECT_NAME ?? "Unknown");
          const mm = Number(sat.MEAN_MOTION ?? 15);
          return {
            id: String(sat.NORAD_CAT_ID ?? `${name}-${i}`),
            name,
            noradId: String(sat.NORAD_CAT_ID ?? "—"),
            category: categorizeSatellite(name),
            altitude: mm ? Number((35786 / (mm / 15)).toFixed(0)) : 500,
            velocity: mm ? Number((mm * 0.5).toFixed(2)) : 7.8,
            inclination: Number(sat.INCLINATION ?? 0),
            meanMotion: mm,
          };
        });
      setSatellites(liveSats);
      setLastUpdated(new Date());
      setState("ok");
      setSelectedId((cur) => cur ?? liveSats[0]?.id ?? null);
    } catch (err) {
      console.error("Failed to load satellites:", err);
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchSatellites();
    const interval = setInterval(fetchSatellites, 60_000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [fetchSatellites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return satellites.filter((s) => {
      if (activeCats.size && !activeCats.has(s.category)) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.noradId.includes(q)) return false;
      return true;
    });
  }, [satellites, query, activeCats]);

  const selected = useMemo(
    () => satellites.find((s) => s.id === selectedId) ?? filtered[0] ?? null,
    [satellites, selectedId, filtered],
  );

  const orbitSats: OrbitSat[] = useMemo(
    () =>
      (filtered.length ? filtered : satellites).slice(0, 60).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        altitude: s.altitude,
      })),
    [filtered, satellites],
  );

  const categoryStats = useMemo(() => {
    const map = new Map<SatCategory, number>();
    SAT_CATEGORIES.forEach((c) => map.set(c, 0));
    satellites.forEach((s) => {
      if (s.category !== "Other") map.set(s.category, (map.get(s.category) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [satellites]);

  const altitudeStats = useMemo(() => {
    const buckets = [
      { label: "<500 km", min: 0, max: 500 },
      { label: "500–800", min: 500, max: 800 },
      { label: "800–2000", min: 800, max: 2000 },
      { label: "2000–20000", min: 2000, max: 20000 },
      { label: ">20000", min: 20000, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      value: satellites.filter((s) => s.altitude >= b.min && s.altitude < b.max).length,
    }));
  }, [satellites]);

  const activeCount = satellites.length;

  const toggleCat = (c: SatCategory) =>
    setActiveCats((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Satellite Explorer"
        sub="Live orbital telemetry from CelesTrak · click any satellite to inspect."
      />

      {/* Hero stat band */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <HeroTile
          icon={SatIcon}
          label="Total Tracked"
          value={state === "loading" && !satellites.length ? "—" : satellites.length.toLocaleString()}
        />
        <HeroTile
          icon={Activity}
          label="Active"
          value={activeCount.toLocaleString()}
          pulse
        />
        <HeroTile
          icon={Target}
          label="Selected"
          value={selected?.name ?? "—"}
        />
        <HeroTile
          icon={Clock}
          label="Last Sync"
          value={lastUpdated ? timeAgo(lastUpdated, now) : "—"}
        />
      </div>

      {/* Error banner */}
      {state === "error" && (
        <GlassCard className="mt-4 border-[color:var(--destructive)]/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-[color:var(--destructive)]" />
              Could not reach CelesTrak. Telemetry feed is offline.
            </div>
            <button onClick={fetchSatellites} className="btn-neon text-xs">
              <RefreshCw className="mr-2 size-3.5" /> Retry
            </button>
          </div>
        </GlassCard>
      )}

      {/* Mission control split */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <GlassCard className="grid-bg overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Orbital Theatre</h3>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
              Live
            </span>
          </div>
          {state === "loading" && !satellites.length ? (
            <Skeleton className="aspect-square w-full max-w-[460px] mx-auto rounded-full" />
          ) : (
            <EarthOrbit
              satellites={orbitSats}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
            />
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
                Satellite Detail
              </div>
              <h3 className="mt-1 truncate font-display text-2xl font-black neon-text">
                {selected?.name ?? "—"}
              </h3>
            </div>
            {selected && (
              <CategoryBadge category={selected.category} />
            )}
          </div>

          {selected ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="NORAD ID" value={<CopyableId id={selected.noradId} />} />
                <Stat label="Altitude" value={`${selected.altitude.toLocaleString()} km`} />
                <Stat label="Velocity" value={`${selected.velocity.toFixed(2)} km/s`} />
                <Stat label="Inclination" value={`${selected.inclination.toFixed(2)}°`} />
                <Stat label="Mean Motion" value={`${selected.meanMotion.toFixed(2)} /day`} />
                <Stat
                  label="Status"
                  value={<span className="text-[color:var(--neon-cyan)]">OPERATIONAL</span>}
                />
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Telemetry (synthetic)</span>
                  <span>last 24 cycles</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-white/5 p-3">
                  <Sparkline
                    values={Array.from({ length: 24 }, (_, i) =>
                      selected.altitude + Math.sin(i / 2) * 4 + Math.cos(i) * 2,
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </GlassCard>
      </div>

      {/* Search + filters */}
      <GlassCard className="mt-6">
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or NORAD ID…"
              className="w-full rounded-xl border border-border bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[color:var(--neon-cyan)] focus:ring-2 focus:ring-[color:var(--neon-cyan)]/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SAT_CATEGORIES.map((c) => {
              const active = activeCats.has(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-transparent text-[color:var(--background)] neon-border"
                      : "border-border bg-white/5 text-foreground/80 hover:bg-white/10"
                  }`}
                  style={active ? { background: CATEGORY_COLOR[c] } : undefined}
                >
                  {c}
                </button>
              );
            })}
            {activeCats.size > 0 && (
              <button
                onClick={() => setActiveCats(new Set())}
                className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Showing <span className="text-foreground">{filtered.length}</span> of {satellites.length} satellites.
          </div>
        </div>
      </GlassCard>

      {/* Satellite grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {state === "loading" && !satellites.length
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : filtered.slice(0, 60).map((sat, i) => (
                <motion.button
                  key={sat.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.01, 0.2) }}
                  onClick={() => setSelectedId(sat.id)}
                  className={`group glass card-glow rounded-2xl p-3 text-left transition hover:-translate-y-0.5 ${
                    selected?.id === sat.id ? "neon-border" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold">{sat.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        NORAD {sat.noradId}
                      </div>
                    </div>
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full"
                      style={{ background: CATEGORY_COLOR[sat.category], boxShadow: `0 0 8px ${CATEGORY_COLOR[sat.category]}` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-foreground/80">
                    <span>{sat.altitude.toLocaleString()} km</span>
                    <span>{sat.velocity.toFixed(2)} km/s</span>
                    <span>{sat.inclination.toFixed(0)}°</span>
                  </div>
                </motion.button>
              ))}
        </AnimatePresence>
      </div>

      {/* Statistics */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <h3 className="mb-3 font-display text-sm font-bold">Category Distribution</h3>
          {state === "loading" && !satellites.length ? (
            <Skeleton className="h-40" />
          ) : (
            <MiniBarChart data={categoryStats} />
          )}
        </GlassCard>
        <GlassCard>
          <h3 className="mb-3 font-display text-sm font-bold">Altitude Bands</h3>
          {state === "loading" && !satellites.length ? (
            <Skeleton className="h-40" />
          ) : (
            <MiniBarChart data={altitudeStats} color="oklch(0.7 0.25 300)" />
          )}
        </GlassCard>
        <GlassCard>
          <h3 className="mb-3 font-display text-sm font-bold">Mission Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total" value={satellites.length} />
            <Stat label="Categories" value={SAT_CATEGORIES.length} />
            <Stat
              label="Avg Altitude"
              value={satellites.length
                ? `${Math.round(satellites.reduce((a, s) => a + s.altitude, 0) / satellites.length).toLocaleString()} km`
                : "—"}
            />
            <Stat
              label="Avg Velocity"
              value={satellites.length
                ? `${(satellites.reduce((a, s) => a + s.velocity, 0) / satellites.length).toFixed(2)} km/s`
                : "—"}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function HeroTile({
  icon: Icon,
  label,
  value,
  pulse,
}: {
  icon: typeof SatIcon;
  label: string;
  value: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </div>
        <div className="relative">
          <Icon className="size-4 text-[color:var(--neon-cyan)]" />
          {pulse && (
            <span className="absolute -inset-1 rounded-full bg-[color:var(--neon-cyan)]/40 pulse-ring" />
          )}
        </div>
      </div>
      <div className="mt-2 truncate font-display text-2xl font-black neon-text">{value}</div>
    </GlassCard>
  );
}

function CategoryBadge({ category }: { category: SatCategory }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{
        background: `${CATEGORY_COLOR[category]}26`,
        color: CATEGORY_COLOR[category],
        border: `1px solid ${CATEGORY_COLOR[category]}66`,
      }}
    >
      {category}
    </span>
  );
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1.5 text-base hover:text-[color:var(--neon-cyan)]"
    >
      {id}
      {copied ? <Check className="size-3" /> : <Copy className="size-3 opacity-60" />}
    </button>
  );
}

function timeAgo(then: Date, now: Date) {
  const s = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
