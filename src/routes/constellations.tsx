import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, Stat } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { Telescope, Sparkles, Cloud, MapPin, Star, Wind, Eye, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/constellations")({
  head: () => ({
    meta: [
      { title: "Stargazing Observatory · Zenith" },
      { name: "description", content: "A futuristic observatory — tonight's brightest stars, constellations, and sky conditions." },
    ],
  }),
  component: StarsRoute,
});

type Star = { x: number; y: number; mag: number; name?: string };
type Constellation = {
  id: string;
  name: string;
  group: "Northern" | "Equatorial" | "Southern";
  mythology: string;
  stars: Star[];
  lines: [number, number][];
};

const DATA: Constellation[] = [
  {
    id: "orion", name: "Orion", group: "Equatorial",
    mythology: "The mighty hunter of Greek myth, killed by a scorpion sent by Gaia and placed in the sky opposite Scorpius.",
    stars: [
      { x: 0.20, y: 0.20, mag: 1.6, name: "Bellatrix" },
      { x: 0.42, y: 0.18, mag: 0.5, name: "Betelgeuse" },
      { x: 0.30, y: 0.45, mag: 2.2 },
      { x: 0.36, y: 0.46, mag: 1.7, name: "Alnilam" },
      { x: 0.42, y: 0.47, mag: 2.2 },
      { x: 0.22, y: 0.78, mag: 0.1, name: "Rigel" },
      { x: 0.50, y: 0.78, mag: 1.7, name: "Saiph" },
      { x: 0.36, y: 0.62, mag: 3 },
    ],
    lines: [[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[3,7]],
  },
  {
    id: "ursa", name: "Ursa Major", group: "Northern",
    mythology: "The Great Bear — Callisto, transformed by Hera and raised to the heavens by Zeus.",
    stars: [
      { x: 0.15, y: 0.55 }, { x: 0.30, y: 0.50 }, { x: 0.45, y: 0.45 },
      { x: 0.55, y: 0.55 }, { x: 0.65, y: 0.45 }, { x: 0.80, y: 0.35 }, { x: 0.92, y: 0.25 },
    ].map((s) => ({ ...s, mag: 2 })),
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[2,4]],
  },
  {
    id: "cassiopeia", name: "Cassiopeia", group: "Northern",
    mythology: "The vain queen of Aethiopia, set among the stars by Poseidon — eternally circling the pole.",
    stars: [
      { x: 0.15, y: 0.30 }, { x: 0.28, y: 0.32 }, { x: 0.40, y: 0.38 },
      { x: 0.50, y: 0.48 }, { x: 0.55, y: 0.60 }, { x: 0.62, y: 0.70 },
      { x: 0.72, y: 0.75 }, { x: 0.82, y: 0.68 }, { x: 0.86, y: 0.55 },
    ].map((s) => ({ ...s, mag: 2 })),
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]],
  },
  {
    id: "lyra", name: "Lyra", group: "Northern",
    mythology: "The lyre of Orpheus, whose music moved gods and stones; placed in the sky by Zeus.",
    stars: [
      { x: 0.5, y: 0.2, mag: 0.03, name: "Vega" },
      { x: 0.42, y: 0.45 }, { x: 0.58, y: 0.45 },
      { x: 0.40, y: 0.7 }, { x: 0.60, y: 0.7 },
    ].map((s, i) => ({ ...s, mag: s.mag ?? 3 - i * 0.1 })),
    lines: [[0,1],[0,2],[1,3],[2,4],[3,4]],
  },
  {
    id: "cygnus", name: "Cygnus", group: "Northern",
    mythology: "The swan — Zeus in disguise, or the loyal friend who searched the river for fallen Phaethon.",
    stars: [
      { x: 0.5, y: 0.15, mag: 1.25, name: "Deneb" },
      { x: 0.5, y: 0.4 }, { x: 0.5, y: 0.7 },
      { x: 0.25, y: 0.4 }, { x: 0.75, y: 0.4 },
    ].map((s) => ({ ...s, mag: s.mag ?? 2 })),
    lines: [[0,1],[1,2],[3,1],[1,4]],
  },
];

type FeaturedStar = {
  name: string;
  bayer?: string;
  magnitude: number;
  distanceLy: number;
  constellation: string;
  color: string;
  visible: boolean;
  description: string;
  altitude: number;
  direction: string;
};

const STARS: FeaturedStar[] = [
  { name: "Sirius", bayer: "α CMa", magnitude: -1.46, distanceLy: 8.6, constellation: "Canis Major", color: "oklch(0.95 0.04 230)", visible: true, description: "Brightest star in the night sky.", altitude: 42, direction: "SE" },
  { name: "Canopus", bayer: "α Car", magnitude: -0.74, distanceLy: 310, constellation: "Carina", color: "oklch(0.95 0.06 90)", visible: false, description: "Second-brightest, far southern hemisphere.", altitude: -6, direction: "S" },
  { name: "Arcturus", bayer: "α Boo", magnitude: -0.05, distanceLy: 36.7, constellation: "Boötes", color: "oklch(0.85 0.16 60)", visible: true, description: "Orange giant racing through the local sky.", altitude: 28, direction: "W" },
  { name: "Vega", bayer: "α Lyr", magnitude: 0.03, distanceLy: 25, constellation: "Lyra", color: "oklch(0.95 0.05 220)", visible: true, description: "Anchor of the Summer Triangle.", altitude: 58, direction: "NW" },
  { name: "Capella", bayer: "α Aur", magnitude: 0.08, distanceLy: 42.9, constellation: "Auriga", color: "oklch(0.92 0.08 90)", visible: true, description: "Multi-star system shining yellow-white.", altitude: 34, direction: "NE" },
  { name: "Rigel", bayer: "β Ori", magnitude: 0.13, distanceLy: 860, constellation: "Orion", color: "oklch(0.92 0.06 230)", visible: true, description: "Blue supergiant in Orion's foot.", altitude: 22, direction: "S" },
  { name: "Procyon", bayer: "α CMi", magnitude: 0.34, distanceLy: 11.5, constellation: "Canis Minor", color: "oklch(0.94 0.04 210)", visible: true, description: "Tip of the Winter Triangle.", altitude: 39, direction: "E" },
  { name: "Betelgeuse", bayer: "α Ori", magnitude: 0.5, distanceLy: 642, constellation: "Orion", color: "oklch(0.78 0.2 35)", visible: true, description: "Red supergiant — destined to go supernova.", altitude: 31, direction: "SE" },
  { name: "Altair", bayer: "α Aql", magnitude: 0.77, distanceLy: 16.7, constellation: "Aquila", color: "oklch(0.95 0.05 230)", visible: true, description: "Fast-spinning star — flattened at the poles.", altitude: 47, direction: "S" },
  { name: "Aldebaran", bayer: "α Tau", magnitude: 0.85, distanceLy: 65, constellation: "Taurus", color: "oklch(0.8 0.18 35)", visible: true, description: "Eye of the bull — orange giant.", altitude: 19, direction: "E" },
  { name: "Antares", bayer: "α Sco", magnitude: 1.09, distanceLy: 550, constellation: "Scorpius", color: "oklch(0.74 0.22 25)", visible: false, description: "Heart of the Scorpion — rival of Mars.", altitude: -12, direction: "SW" },
  { name: "Polaris", bayer: "α UMi", magnitude: 1.98, distanceLy: 433, constellation: "Ursa Minor", color: "oklch(0.95 0.04 95)", visible: true, description: "The North Star — true sky anchor.", altitude: 28, direction: "N" },
];

const TIPS = [
  { icon: <Eye className="size-4" />, title: "Dark-adapt first", text: "Give your eyes 20 minutes away from bright screens to see fainter stars." },
  { icon: <Telescope className="size-4" />, title: "Use averted vision", text: "Look slightly off-center — your peripheral vision catches dim stars best." },
  { icon: <Wind className="size-4" />, title: "Watch the seeing", text: "Stars twinkling violently means the upper atmosphere is turbulent." },
  { icon: <Lightbulb className="size-4" />, title: "Red light only", text: "Use a red flashlight to preserve night vision while reading sky maps." },
];

function StarsRoute() {
  const [selected, setSelected] = useState<Constellation>(DATA[0]);
  const [group, setGroup] = useState<"All" | Constellation["group"]>("All");
  const [now, setNow] = useState<Date | null>(null);
  const [coord, setCoord] = useState({ lat: 28.6139, lon: 77.209 });
  const [ready, setReady] = useState(false);
  const [sortStars, setSortStars] = useState<"brightness" | "distance" | "name">("brightness");

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
          if (p?.coords) setCoord({ lat: p.coords.latitude, lon: p.coords.longitude });
        },
        () => {},
        { timeout: 8000 }
      );
    } catch (e) { console.warn("geo failed", e); }
  }, []);

  // Sky conditions — derive deterministic but lively values from date
  const conditions = useMemo(() => {
    const hour = now?.getHours() ?? 22;
    const isNight = hour >= 19 || hour < 6;
    const seed = (now?.getDate() ?? 12) + (now?.getHours() ?? 22);
    const seeing = ((seed * 37) % 30) / 10 + 6; // 6.0–9.0
    const clouds = ((seed * 13) % 60); // 0–59%
    const transparency = Math.max(40, 100 - clouds - 8);
    const bortle = clouds < 20 ? 3 : clouds < 40 ? 5 : 7;
    return {
      isNight,
      seeing: seeing.toFixed(1),
      clouds,
      transparency,
      bortle,
      quality: clouds < 20 ? "Excellent" : clouds < 45 ? "Good" : "Fair",
    };
  }, [now]);

  const visibleStars = STARS.filter((s) => s.visible);
  const brightest = useMemo(
    () => [...visibleStars].sort((a, b) => a.magnitude - b.magnitude).slice(0, 5),
    [],
  );

  const filteredConst = group === "All" ? DATA : DATA.filter((c) => c.group === group);

  const sortedStars = useMemo(() => {
    const arr = [...STARS];
    if (sortStars === "brightness") arr.sort((a, b) => a.magnitude - b.magnitude);
    if (sortStars === "distance") arr.sort((a, b) => a.distanceLy - b.distanceLy);
    if (sortStars === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [sortStars]);

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* page-scoped immersive starfield */}
      <ObservatoryBackdrop />

      <PageHeader
        title="Stargazing Observatory"
        sub="Live sky conditions, featured stars, and the mythic constellations overhead — wherever you are."
      />

      {/* Hero */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroTile
          icon={<Star className="size-4" />}
          label="Stars Visible Tonight"
          value={ready ? `${visibleStars.length * 380}+` : "—"}
          sub={`${visibleStars.length} featured nearby`}
          accent="oklch(0.85 0.18 200)"
          ready={ready}
        />
        <HeroTile
          icon={<Telescope className="size-4" />}
          label="Sky Quality"
          value={ready ? conditions.quality : "—"}
          sub={ready ? `Bortle ${conditions.bortle} · seeing ${conditions.seeing}″` : "scanning…"}
          accent="oklch(0.7 0.25 300)"
          ready={ready}
        />
        <HeroTile
          icon={<Cloud className="size-4" />}
          label="Observation Conditions"
          value={ready ? `${conditions.clouds}% clouds` : "—"}
          sub={ready ? `Transparency ${conditions.transparency}%` : ""}
          accent="oklch(0.78 0.2 220)"
          ready={ready}
        />
        <HeroTile
          icon={<MapPin className="size-4" />}
          label="Current Location"
          value={`${coord.lat.toFixed(2)}°, ${coord.lon.toFixed(2)}°`}
          sub={now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          accent="oklch(0.88 0.16 180)"
          ready={ready}
        />
      </div>

      {/* Tonight's brightest stars */}
      <section className="mt-10">
        <SectionHeader
          kicker="// Spotlight"
          title="Tonight's Brightest Stars"
          desc="Naked-eye stars currently above the horizon, ranked by apparent magnitude."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {!ready && Array.from({ length: 5 }).map((_, i) => <BrightStarSkeleton key={i} />)}
          {ready && brightest.map((s, i) => (
            <BrightStarCard key={s.name} star={s} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Star catalog */}
      <section className="mt-10">
        <SectionHeader
          kicker="// Star Catalog"
          title="Featured Stars"
          desc="Iconic stars across the celestial sphere — tap a row to learn more."
          right={
            <div className="flex gap-1 rounded-full border border-border bg-white/5 p-1 text-xs">
              {(["brightness", "distance", "name"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortStars(k)}
                  className={`rounded-full px-3 py-1.5 capitalize transition ${
                    sortStars === k
                      ? "bg-[color:var(--neon)]/20 text-[color:var(--neon-cyan)] neon-border"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!ready && Array.from({ length: 6 }).map((_, i) => <StarRowSkeleton key={i} />)}
          {ready && sortedStars.map((s, i) => <StarCatalogCard key={s.name} star={s} idx={i} />)}
        </div>
      </section>

      {/* Constellation explorer */}
      <section className="mt-10">
        <SectionHeader
          kicker="// Mythos"
          title="Constellation Explorer"
          desc="Tonight's mythological figures, traced in starlight."
          right={
            <div className="flex gap-1 rounded-full border border-border bg-white/5 p-1 text-xs">
              {(["All", "Northern", "Equatorial", "Southern"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`rounded-full px-3 py-1.5 transition ${
                    group === g
                      ? "bg-[color:var(--neon)]/20 text-[color:var(--neon-cyan)] neon-border"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <GlassCard>
            <h3 className="font-display text-base font-bold">Constellations · {group}</h3>
            <ul className="mt-3 space-y-1">
              {filteredConst.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      selected.id === c.id
                        ? "bg-[color:var(--neon)]/15 text-[color:var(--neon-cyan)] neon-border"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.group}</span>
                  </button>
                </li>
              ))}
              {filteredConst.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No constellations in this group right now.</li>
              )}
            </ul>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard className="overflow-hidden p-0">
              <ConstSVG c={selected} />
            </GlassCard>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <GlassCard>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">Mythology · {selected.group}</div>
                  <h3 className="mt-1 font-display text-xl font-bold">{selected.name}</h3>
                  <p className="mt-2 text-sm text-foreground/80">{selected.mythology}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat label="Stars" value={selected.stars.length} />
                    <Stat label="Lines" value={selected.lines.length} />
                    <Stat label="Brightest" value={`m ${Math.min(...selected.stars.map((s) => s.mag)).toFixed(1)}`} />
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Tips & highlights */}
      <section className="mt-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <GlassCard>
          <SectionHeader kicker="// Field Notes" title="Observation Tips" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TIPS.map((t) => (
              <div key={t.title} className="flex gap-3 rounded-xl border border-border bg-white/5 p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[color:var(--neon)]/15 text-[color:var(--neon-cyan)] neon-border">
                  {t.icon}
                </div>
                <div>
                  <div className="font-display text-sm font-bold">{t.title}</div>
                  <p className="mt-1 text-xs text-foreground/70">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-[color:var(--neon-violet)]/20 blur-3xl" />
          <SectionHeader kicker="// Sky Highlight" title="Tonight's Focus" />
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[color:var(--neon-cyan)]/40 blur-xl" />
              <div className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-white to-[color:var(--neon-cyan)] text-2xl font-black text-[oklch(0.12_0.05_270)]">
                ✦
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">Featured</div>
              <h4 className="font-display text-lg font-bold">{brightest[0]?.name ?? "Sirius"}</h4>
              <p className="text-xs text-muted-foreground">in {brightest[0]?.constellation}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-foreground/70">
            Look {brightest[0]?.direction ?? "SE"} after dusk — {brightest[0]?.description}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label="Magnitude" value={brightest[0]?.magnitude.toFixed(2) ?? "—"} />
            <Stat label="Distance" value={`${brightest[0]?.distanceLy ?? "—"} ly`} />
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

function SectionHeader({
  kicker, title, desc, right,
}: { kicker: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">{kicker}</div>
        <h2 className="mt-1 font-display text-2xl font-black"><span className="neon-text">{title}</span></h2>
        {desc && <p className="mt-1 text-sm text-foreground/70">{desc}</p>}
      </div>
      {right}
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

function BrightStarSkeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-5">
      <div className="size-12 rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-24 rounded bg-white/10" />
      <div className="mt-2 h-3 w-16 rounded bg-white/10" />
    </div>
  );
}

function StarRowSkeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-2 w-32 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function BrightStarCard({ star, rank }: { star: FeaturedStar; rank: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.06 }}
      whileHover={{ y: -3 }}
      className="glass card-glow relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-50 blur-3xl"
        style={{ background: star.color }}
      />
      <div className="absolute right-3 top-3 grid size-6 place-items-center rounded-full border border-border bg-black/40 text-[10px] font-bold text-foreground/70">
        #{rank}
      </div>
      <div className="relative">
        <div className="relative size-14">
          <div className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: star.color }} />
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, white 0%, ${star.color} 55%, transparent 75%)`,
              boxShadow: `0 0 24px ${star.color}, 0 0 60px ${star.color}`,
            }}
          />
          <TwinkleSpikes color={star.color} />
        </div>
        <div className="mt-4 font-display text-lg font-bold">{star.name}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{star.bayer} · {star.constellation}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">Mag</div>
            <div className="font-medium">{star.magnitude.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Distance</div>
            <div className="font-medium">{star.distanceLy} ly</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StarCatalogCard({ star, idx }: { star: FeaturedStar; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.03 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="glass card-glow group relative overflow-hidden rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0">
          <div
            className="absolute inset-0 rounded-full opacity-50 blur-md transition group-hover:opacity-90"
            style={{ background: star.color }}
          />
          <div
            className="relative size-full rounded-full"
            style={{
              background: `radial-gradient(circle, white 0%, ${star.color} 60%, transparent 80%)`,
              boxShadow: `0 0 16px ${star.color}`,
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-display text-base font-bold">{star.name}</div>
            <span className={`size-1.5 rounded-full ${star.visible ? "bg-emerald-400 shadow-[0_0_8px_oklch(0.78_0.2_140)]" : "bg-zinc-500"}`} />
          </div>
          <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {star.bayer} · {star.constellation}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-sm font-bold neon-text">m {star.magnitude.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{star.distanceLy} ly</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{star.visible ? `Up · ${star.direction} · alt ${star.altitude}°` : "Below horizon"}</span>
        <Sparkles className="size-3 text-[color:var(--neon-cyan)] opacity-0 transition group-hover:opacity-100" />
      </div>
    </motion.div>
  );
}

function TwinkleSpikes({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 animate-pulse">
      <defs>
        <linearGradient id="sp" x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.5" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="49" width="100" height="2" fill="url(#sp)" />
      <rect x="49" y="0" width="2" height="100" fill="url(#sp)" />
    </svg>
  );
}

function ConstSVG({ c }: { c: Constellation }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[oklch(0.08_0.05_270)]">
      <div className="absolute inset-0 grid-bg opacity-25" />
      {/* drifting starfield within the canvas */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 100}%`,
              width: `${(i % 3) + 1}px`,
              height: `${(i % 3) + 1}px`,
              opacity: 0.2 + ((i * 7) % 50) / 100,
              animation: `pulse 3s ${(i % 5) * 0.4}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="starG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="white" />
            <stop offset="0.4" stopColor="oklch(0.85 0.18 200)" stopOpacity="0.9" />
            <stop offset="1" stopColor="oklch(0.85 0.18 200)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {c.lines.map(([a, b], i) => {
          const sa = c.stars[a], sb = c.stars[b];
          return (
            <motion.line
              key={i}
              x1={sa.x * 100} y1={sa.y * 60} x2={sb.x * 100} y2={sb.y * 60}
              stroke="oklch(0.85 0.18 200)" strokeWidth="0.25" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              style={{ filter: "drop-shadow(0 0 1px oklch(0.85 0.18 200))" }}
            />
          );
        })}
        {c.stars.map((s, i) => {
          const r = Math.max(0.5, 1.4 - s.mag * 0.25);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={s.x * 100} cy={s.y * 60} r={r * 3.2} fill="url(#starG)" />
              <circle cx={s.x * 100} cy={s.y * 60} r={r} fill="white" />
              {hover === i && s.name && (
                <g>
                  <rect x={s.x * 100 + 1} y={s.y * 60 - 4} width={s.name.length * 1.4 + 2} height="3" rx="0.5" fill="oklch(0.12 0.05 270 / 0.85)" />
                  <text x={s.x * 100 + 2} y={s.y * 60 - 1.7} fill="oklch(0.88 0.18 200)" fontSize="2">{s.name}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 rounded-full border border-border bg-black/40 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        {c.name} · {c.stars.length} stars
      </div>
    </div>
  );
}

function ObservatoryBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] overflow-hidden opacity-70" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.22_0.1_280/0.6),transparent_60%)]" />
      {Array.from({ length: 70 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${(i * 73) % 100}%`,
            top: `${(i * 47) % 100}%`,
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            opacity: 0.15 + ((i * 11) % 70) / 100,
            boxShadow: i % 6 === 0 ? "0 0 6px oklch(0.85 0.18 200)" : undefined,
            animation: `pulse ${2 + (i % 4)}s ${(i % 7) * 0.3}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}


