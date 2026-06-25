import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Mode = "dark" | "light";

function applyMode(mode: Mode) {
  const html = document.documentElement;
  if (mode === "light") {
    html.classList.add("theme-light");
    html.classList.remove("dark");
  } else {
    html.classList.remove("theme-light");
    html.classList.add("dark");
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = (window.localStorage.getItem("zenith-theme") as Mode | null) ?? "dark";
    setMode(saved);
    applyMode(saved);
  }, []);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
    window.localStorage.setItem("zenith-theme", next);
  };

  return (
    <button
      onClick={toggle}
      title={mode === "dark" ? "Switch to day mode" : "Switch to night mode"}
      aria-label="Toggle day/night theme"
      className="glass-strong fixed right-4 top-32 z-50 grid size-10 place-items-center rounded-full border border-[color:var(--neon)]/40 text-foreground/90 transition hover:scale-105 hover:text-[color:var(--neon-cyan)]"
    >
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
