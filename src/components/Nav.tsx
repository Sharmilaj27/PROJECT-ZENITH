import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Rocket } from "lucide-react";

const NAV = [
  { to: "/", label: "Mission" },
  { to: "/earth", label: "Earth" },
  { to: "/iss", label: "ISS" },
  { to: "/satellites", label: "Satellites" },
  { to: "/planets", label: "Planets" },
  { to: "/constellations", label: "Stars" },
  { to: "/observation", label: "Observe" },
  { to: "/solar-system", label: "Solar System" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40">
      <div className="glass-strong border-b border-border/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--neon)]/15 neon-border">
              <Rocket className="size-4 text-[color:var(--neon-cyan)]" />
            </span>
            <span className="font-display text-sm font-bold tracking-[0.2em] sm:text-base">
              <span className="neon-text">ZENITH</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className="rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-foreground/70 transition hover:bg-white/5 hover:text-foreground"
                  activeProps={{ className: "text-[color:var(--neon-cyan)] bg-white/5" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            className="grid size-9 place-items-center rounded-md border border-border lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </nav>
        {open && (
          <ul className="grid grid-cols-2 gap-1 border-t border-border/60 p-3 lg:hidden">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-white/5"
                  activeProps={{ className: "text-[color:var(--neon-cyan)] bg-white/5" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
