import { motion } from "framer-motion";

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
    >
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
          // Zenith Console
        </div>
        <h1 className="truncate font-display text-3xl font-black tracking-tight sm:text-5xl">
          <span className="neon-text animate-gradient">{title}</span>
        </h1>
        {sub && <p className="mt-2 text-sm text-foreground/75 sm:text-base">{sub}</p>}
      </div>
      <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
        <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--neon-cyan)]" /> LIVE
      </div>
    </motion.header>
  );
}
