import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  Droplets,
  Wind,
  Eye,
  Telescope,
  MapPin,
  Clock,
  Sparkles,
  Compass,
  Star,
  Orbit,
  Sun,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { GlassCard, Stat, Skeleton } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { SkyDome } from "@/components/SkyDome";
import { ConstellationCard } from "@/components/ConstellationCard";
import {
  CELESTIAL_CATALOG,
  CONSTELLATION_PATTERNS,
  bestViewingTime,
  compassDirection,
  raDecToAltAz,
  type CelestialKind,
  type CelestialObject,
} from "@/lib/celestial";

export const Route = createFileRoute("/observation")({
  head: () => ({
    meta: [
      { title: "Observer · Zenith" },
      {
        name: "description",
        content:
          "Premium observatory dashboard — sky conditions, visible objects, compass, and tonight's highlights.",
      },
    ],
  }),
  component: ObsPage,
});

type Obs = {
  cloud: number;
  humidity: number;
  wind: number;
  visibility: number;
  bestHour: string;
  cloudSeries: number[];
};

type FetchState = "loading" | "ok" | "error";

const KIND_FILTERS: { kind: CelestialKind | "All"; label: string; icon: typeof Star }[] = [
  { kind: "All", label: "All", icon: Sparkles },
  { kind: "Planet", label: "Planets", icon: Orbit },
  { kind: "Star", label: "Bright Stars", icon: Star },
  { kind: "Constellation", label: "Constellations", icon: Compass },
  { kind: "DeepSky", label: "Deep Sky", icon: Sun },
  { kind: "ISS", label: "ISS", icon: Telescope },
];

function ObsPage() {
  const [coord, setCoord] = useState({ lat: 28.6139, lon: 77.209, name: "New Delhi" });
  const [obs, setObs] = useState<Obs | null>(null);
  const [state, setState] = useState<FetchState>("loading");
  const [now, setNow] = useState(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CelestialKind | "All">("All");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoord({ lat: p.coords.latitude, lon: p.coords.longitude, name: "Your location" }),
      () => {},
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setState("loading");
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current=cloud_cover,relative_humidity_2m,wind_speed_10m,visibility&hourly=cloud_cover,visibility`,
          { signal: ctrl.signal },
        );
        if (!r.ok) throw new Error("network");
        const j = await r.json();
        const times: string[] = j.hourly.time;
        const clouds: number[] = j.hourly.cloud_cover;
        const viz: number[] = j.hourly.visibility;
        let best = -1;
        let bestScore = -Infinity;
        for (let i = 0; i < times.length; i++) {
          const h = new Date(times[i]).getHours();
          if (h < 19 && h > 4) continue;
          const score = -clouds[i] + (viz[i] ?? 0) / 1000;
          if (score > bestScore) {
            bestScore = score;
            best = i;
          }
        }
        const bestHour =
          best >= 0
            ? new Date(times[best]).toLocaleTimeString([], {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              } as Intl.DateTimeFormatOptions)
            : "—";
        setObs({
          cloud: j.current.cloud_cover,
          humidity: j.current.relative_humidity_2m,
          wind: j.current.wind_speed_10m,
          visibility: (j.current.visibility ?? 0) / 1000,
          bestHour,
          cloudSeries: clouds.slice(0, 24),
        });
        setState("ok");
      } catch {
        setState("error");
      }
    })();
    return () => ctrl.abort();
  }, [coord]);

  const score = obs
    ? Math.max(
        0,
        Math.min(
          10,
          10 - obs.cloud / 12 - obs.humidity / 25 - Math.max(0, 10 - obs.visibility) / 2,
        ),
      )
    : 0;
  const verdict =
    score > 7
      ? "Excellent"
      : score > 5
        ? "Good"
        : score > 3
          ? "Fair"
          : "Poor";
  const verdictColor =
    score > 7
      ? "oklch(0.82 0.18 160)"
      : score > 5
        ? "oklch(0.85 0.18 200)"
        : score > 3
          ? "oklch(0.85 0.2 70)"
          : "oklch(0.7 0.22 30)";

  // Positioned celestial objects.
  const objects = useMemo(() => {
    return CELESTIAL_CATALOG.map((o) => {
      const { alt, az } = raDecToAltAz(o.ra, o.dec, coord.lat, coord.lon, now);
      return {
        ...o,
        alt,
        az,
        visible: alt > 0,
        direction: compassDirection(az),
        best: bestViewingTime(o, coord.lat, coord.lon, now),
      };
    });
  }, [coord.lat, coord.lon, now]);

  const filtered = useMemo(
    () => (filter === "All" ? objects : objects.filter((o) => o.kind === filter)),
    [objects, filter],
  );

  const compassQuadrants = useMemo(() => {
    const dirs = ["N", "E", "S", "W"] as const;
    return dirs.map((d) => {
      const range = {
        N: [315, 360, 0, 45],
        E: [45, 135],
        S: [135, 225],
        W: [225, 315],
      }[d];
      const items = objects
        .filter((o) => o.visible)
        .filter((o) => {
          if (d === "N") return o.az >= 315 || o.az < 45;
          return o.az >= range[0] && o.az < range[1];
        })
        .sort((a, b) => b.alt - a.alt)
        .slice(0, 2);
      return { dir: d, items };
    });
  }, [objects]);

  const highlights = useMemo(() => {
    const visible = objects.filter((o) => o.visible);
    const planet = visible
      .filter((o) => o.kind === "Planet")
      .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99))[0];
    const star = visible
      .filter((o) => o.kind === "Star")
      .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99))[0];
    const deep = visible
      .filter((o) => o.kind === "DeepSky")
      .sort((a, b) => b.alt - a.alt)[0];
    return [planet, star, deep].filter(Boolean) as (CelestialObject & {
      alt: number;
      az: number;
      visible: boolean;
      direction: ReturnType<typeof compassDirection>;
      best: string;
    })[];
  }, [objects]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Observer"
        sub={`Stargazing forecast & sky map for ${coord.name}.`}
      />

      {/* Hero band */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Location
            <MapPin className="size-4 text-[color:var(--neon-cyan)]" />
          </div>
          <div className="mt-2 truncate font-display text-lg font-bold neon-text">
            {coord.name}
          </div>
          <button
            onClick={requestLocation}
            className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--neon-cyan)] hover:text-foreground"
          >
            Use my location
          </button>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Local Time
            <Clock className="size-4 text-[color:var(--neon-cyan)]" />
          </div>
          <div className="mt-2 font-display text-2xl font-black neon-text tabular-nums">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </GlassCard>
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Stargazing Score
            <Sparkles className="size-4 text-[color:var(--neon-cyan)]" />
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="font-display text-3xl font-black neon-text">{score.toFixed(1)}</span>
            <span className="mb-1 text-xs text-muted-foreground">/ 10</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${verdictColor}, oklch(0.7 0.25 300))` }}
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Sky Condition
            <Cloud className="size-4 text-[color:var(--neon-cyan)]" />
          </div>
          <div
            className="mt-2 inline-flex rounded-full px-2.5 py-1 font-display text-sm font-bold"
            style={{
              background: `${verdictColor}26`,
              color: verdictColor,
              border: `1px solid ${verdictColor}66`,
            }}
          >
            {verdict}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {obs ? `${obs.cloud}% cloud · ${obs.visibility.toFixed(1)} km viz` : "Awaiting data…"}
          </div>
        </GlassCard>
      </div>

      {state === "error" && (
        <GlassCard className="mt-4 border-[color:var(--destructive)]/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-[color:var(--destructive)]" />
              Weather feed unavailable.
            </div>
            <button
              onClick={() => setCoord({ ...coord })}
              className="btn-neon text-xs"
            >
              <RefreshCw className="mr-2 size-3.5" /> Retry
            </button>
          </div>
        </GlassCard>
      )}

      {/* Sky dome + compass panel */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <GlassCard>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Sky Dome</h3>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
              {filtered.filter((o) => o.visible).length} visible
            </span>
          </div>
          <SkyDome
            lat={coord.lat}
            lon={coord.lon}
            now={now}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard>
            <h3 className="mb-3 font-display text-base font-bold">Compass Bearings</h3>
            <div className="grid grid-cols-2 gap-3">
              {compassQuadrants.map((q) => (
                <div
                  key={q.dir}
                  className="rounded-xl border border-border/60 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Looking {q.dir === "N" ? "North" : q.dir === "S" ? "South" : q.dir === "E" ? "East" : "West"}
                    <Compass className="size-3.5 text-[color:var(--neon-cyan)]" />
                  </div>
                  {q.items.length ? (
                    q.items.map((o) => (
                      <div key={o.id} className="mt-2 text-sm">
                        <div className="font-display font-bold">{o.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {o.alt.toFixed(0)}° altitude · {o.kind}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mt-2 text-[11px] text-muted-foreground">Nothing prominent.</div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 font-display text-base font-bold">Atmospheric Conditions</h3>
            {state === "loading" || !obs ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile icon={Cloud} label="Cloud" value={`${obs.cloud}%`} good={obs.cloud < 25} />
                <Tile icon={Droplets} label="Humidity" value={`${obs.humidity}%`} good={obs.humidity < 60} />
                <Tile icon={Wind} label="Wind" value={`${obs.wind.toFixed(1)} km/h`} good={obs.wind < 20} />
                <Tile icon={Eye} label="Visibility" value={`${obs.visibility.toFixed(1)} km`} good={obs.visibility > 15} />
              </div>
            )}
            {obs && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1.5 text-sm">
                <Telescope className="size-4 text-[color:var(--neon-cyan)]" />
                Best viewing: <span className="font-semibold">{obs.bestHour}</span>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Tonight's highlights */}
      {highlights.length > 0 && (
        <GlassCard className="mt-6 grid-bg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Tonight's Highlights</h3>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
              Curated for you
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {highlights.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedId(h.id)}
                className="cursor-pointer rounded-xl border border-border/60 bg-white/5 p-4 transition hover:border-[color:var(--neon-cyan)]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--neon-cyan)]">
                    {h.kind}
                  </span>
                  <Sparkles className="size-3.5 text-[color:var(--neon-cyan)] float-y" />
                </div>
                <div className="mt-1 font-display text-xl font-black neon-text">{h.name}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{h.description ?? "Worth a look tonight."}</div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="rounded-full border border-border bg-white/5 px-2 py-0.5">
                    {h.direction} · {h.alt.toFixed(0)}°
                  </span>
                  <span className="text-[color:var(--neon-cyan)]">Best {h.best}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Filter tabs + object cards */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {KIND_FILTERS.map((f) => {
            const active = filter === f.kind;
            return (
              <button
                key={f.kind}
                onClick={() => setFilter(f.kind)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-[color:var(--neon-cyan)] bg-[color:var(--neon-cyan)]/15 text-[color:var(--neon-cyan)] neon-border"
                    : "border-border bg-white/5 text-foreground/80 hover:bg-white/10"
                }`}
              >
                <f.icon className="size-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((o, i) => (
            <motion.button
              key={o.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              onClick={() => setSelectedId(o.id)}
              className={`glass card-glow rounded-2xl p-4 text-left transition hover:-translate-y-0.5 ${
                selectedId === o.id ? "neon-border" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-bold neon-text">{o.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {o.kind}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                    o.visible
                      ? "bg-[color:var(--neon-cyan)]/15 text-[color:var(--neon-cyan)] border border-[color:var(--neon-cyan)]/40"
                      : "bg-white/5 text-muted-foreground border border-border"
                  }`}
                >
                  {o.visible ? "Visible" : "Below"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <Cell label="Dir" value={o.direction} />
                <Cell label="Alt" value={`${o.alt.toFixed(0)}°`} />
                <Cell label="Best" value={o.best} />
              </div>
              {o.description && (
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{o.description}</p>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Constellation previews */}
      <GlassCard className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Constellation Atlas</h3>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
            Animated previews
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {CONSTELLATION_PATTERNS.map((p) => (
            <ConstellationCard key={p.id} pattern={p} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: typeof Cloud;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/5 p-3">
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        <Icon className={`size-3.5 ${good ? "text-[color:var(--neon-cyan)]" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-1 font-display text-lg font-bold neon-text">{value}</div>
      <div
        className="mt-1 h-0.5 rounded-full"
        style={{ background: good ? "oklch(0.82 0.18 160 / 0.7)" : "oklch(0.7 0.22 30 / 0.5)" }}
      />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/5 px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="font-display text-xs font-bold">{value}</div>
    </div>
  );
}
