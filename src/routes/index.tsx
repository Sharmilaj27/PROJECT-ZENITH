import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Rocket, Globe2, Satellite, Sparkles, Radar, Telescope, CloudMoon, Orbit } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Zenith — Mission Control" },
      { name: "description", content: "Enter the celestial eye: launch missions, explore Earth, and track the cosmos in real time." },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Globe2, to: "/earth", title: "Earth Explorer", desc: "Spin a 3D globe and pull live conditions for any coordinate." },
  { icon: Satellite, to: "/iss", title: "ISS Tracker", desc: "Real-time position, altitude and orbital velocity." },
  { icon: Radar, to: "/satellites", title: "Satellite Radar", desc: "Active satellites sweeping across a live radar grid." },
  { icon: Telescope, to: "/planets", title: "Planet Visibility", desc: "Tonight's planets — direction, rise & set times." },
  { icon: Sparkles, to: "/constellations", title: "Constellations", desc: "Connect the stars and read their mythology." },
  { icon: CloudMoon, to: "/observation", title: "Observation Center", desc: "Cloud cover, humidity, wind — stargazing score." },
  { icon: Orbit, to: "/solar-system", title: "Solar System", desc: "Fly through an interactive 3D solar system." },
] as const;

function Home() {
  return (
    <div className="relative">
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--neon-cyan)] backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--neon-cyan)]" /> Mission Control Online
          </div>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            <span className="block neon-text">PROJECT ZENITH</span>
            <span className="mt-2 block text-xl font-medium tracking-[0.5em] text-foreground/70 sm:text-2xl">
              THE CELESTIAL EYE
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-foreground/70 sm:text-lg">
            A NASA-inspired command deck for explorers. Track spacecraft, scan satellites,
            inspect tonight's sky and orbit the planets — all in real time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/solar-system"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--neon)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] neon-glow transition hover:scale-[1.02]"
            >
              <Rocket className="size-4 transition group-hover:translate-x-0.5" /> Launch Mission
            </Link>
            <Link
              to="/earth"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--neon)]/40 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-white/10"
            >
              <Globe2 className="size-4" /> Explore Earth
            </Link>
            <Link
              to="/iss"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-6 py-3 text-sm font-semibold text-foreground/90 backdrop-blur transition hover:bg-white/10"
            >
              <Satellite className="size-4" /> Track ISS
            </Link>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
            >
              <Link
                to={f.to}
                className="group relative block h-full overflow-hidden rounded-2xl glass p-5 transition hover:-translate-y-1 hover:neon-border"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/30">
                  <f.icon className="size-5 text-[color:var(--neon-cyan)]" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{f.desc}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--neon-cyan)] opacity-0 transition group-hover:opacity-100">
                  Enter →
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
