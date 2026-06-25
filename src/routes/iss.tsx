import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Compass,
  Gauge,
  Globe2,
  MapPin,
  Mountain,
  Orbit,
  Radio,
  Rocket,
  Satellite,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Skeleton } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/iss")({
  head: () => ({
    meta: [
      { title: "ISS Mission Control · Zenith" },
      {
        name: "description",
        content:
          "Live mission-control dashboard for the International Space Station: position, altitude, velocity, crew on board, orbit progress and tonight's visibility.",
      },
      { property: "og:title", content: "ISS Mission Control · Zenith" },
      {
        property: "og:description",
        content:
          "Real-time ISS telemetry, orbital path, crew roster and sighting forecast.",
      },
    ],
  }),
  component: ISSPage,
});

// ---------- types ----------
type ISSData = {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/h
  visibility: string;
  timestamp: number; // seconds
};

type Astronaut = { name: string; craft: string };

type HistoryPoint = { t: number; alt: number; vel: number };

// ISS orbital constants
const ORBITAL_PERIOD_MIN = 92.68;
const ISS_EPOCH = Date.UTC(1998, 10, 20); // launch reference
const ISS_INCLINATION = 51.64;

// ---------- page ----------
function ISSPage() {
  const [data, setData] = useState<ISSData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        if (!r.ok) throw new Error("ISS feed unavailable");
        const j = await r.json();
        if (cancelled) return;
        const d: ISSData = {
          latitude: j.latitude,
          longitude: j.longitude,
          altitude: j.altitude,
          velocity: j.velocity,
          visibility: j.visibility,
          timestamp: j.timestamp,
        };
        setData(d);
        setError(null);
        setHistory((h) => [
          ...h.slice(-59),
          { t: d.timestamp, alt: d.altitude, vel: d.velocity },
        ]);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    fetchData();
    const dataTimer = setInterval(fetchData, 5000);
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const lastUpdatedSec = data ? Math.max(0, Math.floor(now / 1000 - data.timestamp)) : null;
  const isStale = lastUpdatedSec !== null && lastUpdatedSec > 30;
  const status: "LIVE" | "STALE" | "OFFLINE" = error
    ? "OFFLINE"
    : isStale
      ? "STALE"
      : "LIVE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="ISS Mission Control"
        sub="Live telemetry from the International Space Station · Refreshes every 5s"
      />

      <HeroPanel data={data} status={status} lastUpdatedSec={lastUpdatedSec} error={error} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <GlassCard className="overflow-hidden p-4 sm:p-5">
          <SectionTitle icon={<Globe2 className="size-4" />} title="Ground Track" hint="Equirectangular projection · 51.6° inclination" />
          <OrbitMap lat={data?.latitude ?? 0} lon={data?.longitude ?? 0} />
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <SectionTitle icon={<Activity className="size-4" />} title="Telemetry Stream" hint="Last 60 samples" />
          <TelemetryChart history={history} />
          {error && (
            <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </GlassCard>
      </div>

      <MetricsGrid data={data} now={now} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OrbitProgressCard data={data} now={now} />
        <AstronautsCard />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <SightingCard data={data} />
        <FactsCard />
      </div>
    </div>
  );
}

// ---------- shared ----------
function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h3 className="flex items-center gap-2 font-display text-base font-bold">
        <span className="text-[color:var(--neon-cyan)]">{icon}</span>
        <span className="neon-text">{title}</span>
      </h3>
      {hint && (
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: "LIVE" | "STALE" | "OFFLINE" }) {
  const color =
    status === "LIVE"
      ? "var(--neon-cyan)"
      : status === "STALE"
        ? "oklch(0.82 0.18 80)"
        : "oklch(0.65 0.25 25)";
  return (
    <span className="relative inline-flex size-2.5">
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-60"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 70%, transparent)` }}
      />
      <span className="relative size-2.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

// ---------- hero ----------
function HeroPanel({
  data,
  status,
  lastUpdatedSec,
  error,
}: {
  data: ISSData | null;
  status: "LIVE" | "STALE" | "OFFLINE";
  lastUpdatedSec: number | null;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass card-glow neon-border relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-7"
    >
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.25 280 / 0.55), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.2 220 / 0.5), transparent 60%)",
        }}
      />

      <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <motion.div
          className="flex size-16 items-center justify-center rounded-2xl border border-[color:var(--neon-cyan)]/40 bg-white/5 text-[color:var(--neon-cyan)] sm:size-20"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Satellite className="size-8 sm:size-10" />
        </motion.div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em]",
                status === "LIVE" && "border-[color:var(--neon-cyan)]/50 text-[color:var(--neon-cyan)]",
                status === "STALE" && "border-amber-400/40 text-amber-300",
                status === "OFFLINE" && "border-destructive/50 text-destructive",
              )}
            >
              <StatusDot status={status} /> {status}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              NORAD 25544 · ZARYA
            </span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl">
            <span className="animate-gradient">International Space Station</span>
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            7 crew · 109 m wingspan · orbiting Earth at ~28,000 km/h since November 1998.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:min-w-[18rem]">
          <HeroStat
            icon={<Compass className="size-3.5" />}
            label="Position"
            value={data ? `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°` : "—"}
            loading={!data}
          />
          <HeroStat
            icon={<Mountain className="size-3.5" />}
            label="Altitude"
            value={data ? `${data.altitude.toFixed(1)} km` : "—"}
            loading={!data}
          />
          <HeroStat
            icon={<Gauge className="size-3.5" />}
            label="Velocity"
            value={data ? `${Math.round(data.velocity).toLocaleString()} km/h` : "—"}
            loading={!data}
          />
          <HeroStat
            icon={<Radio className="size-3.5" />}
            label="Updated"
            value={
              lastUpdatedSec === null
                ? "—"
                : lastUpdatedSec < 2
                  ? "just now"
                  : `${lastUpdatedSec}s ago`
            }
            loading={!data}
          />
        </div>
      </div>
      {error && !data && (
        <p className="relative mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/[0.04] p-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-[color:var(--neon-cyan)]">{icon}</span>
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-1.5 h-5 w-20" />
      ) : (
        <div className="mt-0.5 font-display text-sm font-bold neon-text">{value}</div>
      )}
    </div>
  );
}

// ---------- map ----------
function OrbitMap({ lat, lon }: { lat: number; lon: number }) {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;

  // Ground-track for the current orbit (sinusoid in equirectangular projection)
  const trackPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 720; i += 2) {
      const lo = ((i - 360) % 360 + 540) % 360 - 180;
      const phase = ((lo - lon) * Math.PI) / 180;
      const la = ISS_INCLINATION * Math.sin(phase);
      const px = ((lo + 180) / 360) * 360;
      const py = ((90 - la) / 180) * 180;
      pts.push(`${pts.length === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [lon]);

  return (
    <div className="relative mt-3 aspect-[2/1] w-full overflow-hidden rounded-xl border border-border bg-[oklch(0.08_0.05_265)]">
      <div className="absolute inset-0 grid-bg opacity-50" />
      {/* Continents — stylized silhouettes */}
      <svg
        viewBox="0 0 360 180"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="land" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.35 0.08 230 / 0.55)" />
            <stop offset="100%" stopColor="oklch(0.22 0.06 270 / 0.55)" />
          </linearGradient>
        </defs>
        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((l) => (
          <line
            key={l}
            x1="0"
            x2="360"
            y1={((90 - l) / 180) * 180}
            y2={((90 - l) / 180) * 180}
            stroke="oklch(0.78 0.18 230 / 0.12)"
            strokeWidth="0.3"
            strokeDasharray="2 3"
          />
        ))}
        {/* Stylized continents */}
        <path
          d="M40 50 Q60 38 90 46 T140 52 L150 80 Q120 95 90 90 T50 95 Z"
          fill="url(#land)"
        />
        <path
          d="M155 70 Q175 55 205 60 T255 72 L250 110 Q220 130 195 120 T160 110 Z"
          fill="url(#land)"
        />
        <path
          d="M260 55 Q300 45 340 60 L335 90 Q300 100 270 90 Z"
          fill="url(#land)"
        />
        <path
          d="M275 100 Q300 95 320 110 L310 140 Q290 145 275 130 Z"
          fill="url(#land)"
        />
        <path
          d="M100 110 Q120 105 140 115 L135 150 Q115 158 100 145 Z"
          fill="url(#land)"
        />
      </svg>

      {/* Orbit ground-track */}
      <svg
        viewBox="0 0 360 180"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path
          d={trackPath}
          stroke="oklch(0.85 0.18 200 / 0.5)"
          strokeWidth="0.7"
          fill="none"
          strokeDasharray="2 2"
        />
      </svg>

      {/* ISS marker */}
      <motion.div
        className="absolute z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
        animate={{ left: `${x}%`, top: `${y}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
          <div className="relative flex size-4 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[color:var(--neon-cyan)] pulse-ring" />
            <span className="absolute size-4 rounded-full border border-[color:var(--neon-cyan)]/40" />
            <span className="relative size-2.5 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_18px_oklch(0.85_0.18_200/0.9)]" />
          </div>
          <div className="mt-1 -translate-x-1/2 rounded-md border border-[color:var(--neon-cyan)]/40 bg-background/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--neon-cyan)] backdrop-blur">
            ISS
          </div>
        </div>
      </motion.div>

      {/* Corner crosshair labels */}
      <div className="pointer-events-none absolute left-2 top-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--neon-cyan)]/70">
        + 90°N · 180°W
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--neon-cyan)]/70">
        − 90°S · 180°E
      </div>
    </div>
  );
}

// ---------- telemetry chart ----------
function TelemetryChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="mt-3 grid gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  const altDomain: [number, number] = [
    Math.min(...history.map((h) => h.alt)) - 1,
    Math.max(...history.map((h) => h.alt)) + 1,
  ];
  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>Altitude (km)</span>
          <span>{history[history.length - 1].alt.toFixed(2)}</span>
        </div>
        <div className="h-24">
          <ResponsiveContainer>
            <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="altFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.18 200)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="oklch(0.85 0.18 200)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis domain={altDomain} hide />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.15 0.06 270 / 0.95)",
                  border: "1px solid oklch(0.78 0.18 230 / 0.4)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleTimeString()}
                formatter={(v: number) => [`${v.toFixed(2)} km`, "Altitude"]}
              />
              <Area
                type="monotone"
                dataKey="alt"
                stroke="oklch(0.88 0.18 200)"
                strokeWidth={2}
                fill="url(#altFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>Velocity (km/h)</span>
          <span>{Math.round(history[history.length - 1].vel).toLocaleString()}</span>
        </div>
        <div className="h-20">
          <ResponsiveContainer>
            <LineChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="t" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.15 0.06 270 / 0.95)",
                  border: "1px solid oklch(0.78 0.18 230 / 0.4)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleTimeString()}
                formatter={(v: number) => [`${Math.round(v).toLocaleString()} km/h`, "Velocity"]}
              />
              <Line
                type="monotone"
                dataKey="vel"
                stroke="oklch(0.7 0.25 300)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- metric grid ----------
function MetricsGrid({ data, now }: { data: ISSData | null; now: number }) {
  const orbitNumber = useMemo(() => {
    const ms = now - ISS_EPOCH;
    return Math.floor(ms / 1000 / 60 / ORBITAL_PERIOD_MIN);
  }, [now]);

  const cards = [
    {
      icon: <Compass className="size-4" />,
      label: "Latitude",
      value: data ? `${data.latitude.toFixed(4)}°` : null,
      sub: data ? (data.latitude >= 0 ? "Northern hemisphere" : "Southern hemisphere") : "",
    },
    {
      icon: <MapPin className="size-4" />,
      label: "Longitude",
      value: data ? `${data.longitude.toFixed(4)}°` : null,
      sub: data ? (data.longitude >= 0 ? "Eastern hemisphere" : "Western hemisphere") : "",
    },
    {
      icon: <Mountain className="size-4" />,
      label: "Altitude",
      value: data ? `${data.altitude.toFixed(2)} km` : null,
      sub: data ? `${(data.altitude * 0.621371).toFixed(1)} mi above sea level` : "",
    },
    {
      icon: <Gauge className="size-4" />,
      label: "Speed",
      value: data ? `${Math.round(data.velocity).toLocaleString()} km/h` : null,
      sub: data ? `${(data.velocity / 3600).toFixed(2)} km/s` : "",
    },
    {
      icon: <Orbit className="size-4" />,
      label: "Orbit #",
      value: orbitNumber.toLocaleString(),
      sub: "Since launch · Nov 20, 1998",
    },
    {
      icon: <Sun className="size-4" />,
      label: "Visibility",
      value: data ? data.visibility.toUpperCase() : null,
      sub: data?.visibility === "daylight" ? "ISS in sunlight" : "ISS in Earth's shadow",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
          className="glass card-glow rounded-2xl p-3.5"
        >
          <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="text-[color:var(--neon-cyan)]">{c.icon}</span>
            {c.label}
          </div>
          {c.value === null ? (
            <Skeleton className="mt-2 h-6 w-20" />
          ) : (
            <div className="mt-1 font-display text-lg font-bold neon-text">{c.value}</div>
          )}
          {c.sub && (
            <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{c.sub}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ---------- orbit progress ----------
function OrbitProgressCard({ data, now }: { data: ISSData | null; now: number }) {
  // Progress through current orbit, derived from longitude phase
  const orbitMs = ORBITAL_PERIOD_MIN * 60 * 1000;
  const progress = data
    ? ((((data.longitude + 180) / 360) * orbitMs + (now - data.timestamp * 1000)) % orbitMs) /
      orbitMs
    : 0;
  const minsLeft = ((1 - progress) * ORBITAL_PERIOD_MIN).toFixed(1);

  return (
    <GlassCard className="p-4 sm:p-5">
      <SectionTitle
        icon={<Orbit className="size-4" />}
        title="Orbit Progress"
        hint={`Period · ${ORBITAL_PERIOD_MIN} min`}
      />

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
        {/* Orbital ring viz */}
        <div className="relative mx-auto size-36 sm:size-40">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(0.78 0.18 230 / 0.15)" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#orbitGrad)"
              strokeWidth="3"
              strokeDasharray={`${progress * 276.46} 276.46`}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px oklch(0.78 0.2 240 / 0.7))" }}
            />
            <defs>
              <linearGradient id="orbitGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.88 0.18 200)" />
                <stop offset="100%" stopColor="oklch(0.7 0.25 300)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Earth */}
          <div
            className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.55 0.15 230), oklch(0.18 0.08 270) 75%)",
              boxShadow: "0 0 24px oklch(0.5 0.2 250 / 0.5), inset -4px -6px 12px oklch(0 0 0 / 0.5)",
            }}
          />
          {/* ISS dot on orbit */}
          <motion.div
            className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_12px_oklch(0.85_0.18_200/0.9)]"
            style={{
              transform: `translate(-50%, -50%) rotate(${progress * 360}deg) translateX(70px)`,
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {Math.round(progress * 100)}%
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <span>Current orbit completion</span>
              <span className="text-[color:var(--neon-cyan)]">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.88 0.18 200), oklch(0.7 0.25 300))",
                  boxShadow: "0 0 12px oklch(0.78 0.2 240 / 0.7)",
                }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Period" value={`${ORBITAL_PERIOD_MIN} min`} />
            <MiniStat label="Inclination" value={`${ISS_INCLINATION}°`} />
            <MiniStat label="Time left" value={`${minsLeft} min`} />
            <MiniStat label="Orbits/day" value={`${(1440 / ORBITAL_PERIOD_MIN).toFixed(1)}`} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white/[0.04] p-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-sm font-bold neon-text">{value}</div>
    </div>
  );
}

// ---------- astronauts ----------
function AstronautsCard() {
  const [astros, setAstros] = useState<Astronaut[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("https://corsproxy.io/?https://api.open-notify.org/astros.json");
        if (!r.ok) throw new Error("Unable to load crew roster");
        const j = await r.json();
        if (cancelled) return;
        const iss = (j.people as Astronaut[]).filter((p) => p.craft === "ISS");
        setAstros(iss);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlassCard className="p-4 sm:p-5">
      <SectionTitle
        icon={<Users className="size-4" />}
        title="Astronauts On Board"
        hint={astros ? `${astros.length} crew · ISS` : "Live roster"}
      />

      {err && !astros && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-200">
          Crew roster unavailable right now. {err}
        </p>
      )}

      {!astros && !err && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {astros && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {astros.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/[0.04] p-2.5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--neon-cyan)]/40 bg-white/5 text-[color:var(--neon-cyan)]">
                <Rocket className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-bold">{a.name}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {a.craft}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ---------- sighting ----------
function SightingCard({ data }: { data: ISSData | null }) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [denied, setDenied] = useState(false);

  const distanceKm = useMemo(() => {
    if (!data || !coords) return null;
    return haversine(data.latitude, data.longitude, coords.lat, coords.lon);
  }, [data, coords]);

  const visible = distanceKm !== null && distanceKm < 2000;

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setDenied(true),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <GlassCard className="p-4 sm:p-5">
      <SectionTitle
        icon={<Sparkles className="size-4" />}
        title="Can You See the ISS Tonight?"
        hint="Based on your location"
      />

      {!coords && !denied && (
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/75">
            Share your location to compute the ISS's current distance from you and a quick
            sighting verdict for the next pass.
          </p>
          <button onClick={requestLocation} className="btn-neon shrink-0">
            <MapPin className="mr-2 size-4" /> Use my location
          </button>
        </div>
      )}

      {denied && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-foreground/75">
            Location access denied. You can still check sighting opportunities for any city on
            NASA's Spot the Station.
          </p>
          <a
            href="https://spotthestation.nasa.gov/sightings/"
            target="_blank"
            rel="noreferrer"
            className="btn-neon inline-flex"
          >
            Open Spot the Station
          </a>
        </div>
      )}

      {coords && data && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Your lat" value={`${coords.lat.toFixed(2)}°`} />
            <MiniStat label="Your lon" value={`${coords.lon.toFixed(2)}°`} />
            <MiniStat
              label="Distance"
              value={distanceKm !== null ? `${Math.round(distanceKm).toLocaleString()} km` : "—"}
            />
          </div>
          <div
            className={cn(
              "rounded-xl border p-3 text-sm",
              visible
                ? "border-[color:var(--neon-cyan)]/50 bg-[color:var(--neon-cyan)]/5 text-[color:var(--neon-cyan)]"
                : "border-border/60 bg-white/[0.04] text-foreground/80",
            )}
          >
            <div className="font-display text-base font-bold">
              {visible ? "ISS is overhead-ish right now" : "Not visible at this moment"}
            </div>
            <p className="mt-1 text-xs text-foreground/70">
              {visible
                ? "The ISS is within ~2,000 km of you. If it's twilight at your location and the sky is clear, look up."
                : "The ISS is on the other side of the planet. Check Spot the Station for your next pass."}
            </p>
          </div>
          <a
            href="https://spotthestation.nasa.gov/sightings/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--neon-cyan)] hover:underline"
          >
            NASA sighting forecasts →
          </a>
        </div>
      )}
    </GlassCard>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- facts ----------
const ISS_FACTS = [
  "The ISS orbits Earth roughly every 92 minutes — astronauts see 16 sunrises a day.",
  "It travels at about 28,000 km/h — fast enough to cross a continent in 10 minutes.",
  "The station is roughly the size of a football field, weighing ~420,000 kg.",
  "It has been continuously inhabited since November 2, 2000.",
  "More than 270 people from 23 countries have visited the ISS.",
  "Solar arrays span 109 meters — wider than a Boeing 777's wingspan.",
  "The ISS hosts ~250 ongoing experiments at any given time.",
  "Astronauts drink recycled water — including from sweat and condensation.",
  "It's the third brightest object in the night sky after the Sun and Moon.",
  "The ISS reboosts itself periodically to counter atmospheric drag.",
];

function FactsCard() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ISS_FACTS.length), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <GlassCard className="relative overflow-hidden p-4 sm:p-5">
      <SectionTitle icon={<Sparkles className="size-4" />} title="ISS Facts" hint="Rotating every 6s" />
      <div className="relative mt-4 min-h-[7.5rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="font-display text-lg leading-snug text-foreground/90"
          >
            <span className="neon-text">“</span>
            {ISS_FACTS[i]}
            <span className="neon-text">”</span>
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-1.5">
        {ISS_FACTS.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Fact ${idx + 1}`}
            onClick={() => setI(idx)}
            className={cn(
              "h-1 flex-1 rounded-full transition-all",
              idx === i ? "bg-[color:var(--neon-cyan)]" : "bg-white/10 hover:bg-white/20",
            )}
          />
        ))}
      </div>
    </GlassCard>
  );
}
