import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Send, Sparkles, X } from "lucide-react";

type Msg = { id: string; from: "zeni" | "user"; text: string };

const WELCOME =
  "Hello Explorer! I am ZENI, your celestial companion. Ask me anything about space, planets, stars, satellites, or Project Zenith.";

const KNOWLEDGE: { keys: string[]; reply: string }[] = [
  {
    keys: ["hi", "hello", "hey", "yo", "hola", "greetings"],
    reply: "Hi there, Explorer! ✨ I'm ZENI. Want to chat about planets, the ISS, or tonight's sky?",
  },
  {
    keys: ["mars", "red planet"],
    reply:
      "Mars 🔴 is the fourth planet — cold, dusty, and home to Olympus Mons, a volcano 22 km tall! A Martian day (sol) is just 24h 37m, almost like Earth's.",
  },
  {
    keys: ["iss", "space station", "international space"],
    reply:
      "The ISS 🛰️ orbits Earth at ~408 km, racing along at 7.66 km/s. It circles the planet every ~90 minutes — so astronauts see 16 sunrises a day!",
  },
  {
    keys: ["saturn", "rings"],
    reply:
      "Saturn 🪐 is the ringed jewel of our system. Its rings are mostly ice + rock, and its density is so low it would actually float in water!",
  },
  {
    keys: ["jupiter", "great red spot"],
    reply:
      "Jupiter is a gas giant with 95 known moons and a centuries-old storm — the Great Red Spot — wider than Earth itself.",
  },
  {
    keys: ["venus"],
    reply:
      "Venus is Earth's scorching twin — 465 °C surface, crushing pressure, and it spins backwards. One Venus day is longer than its year!",
  },
  {
    keys: ["mercury"],
    reply:
      "Mercury is the smallest planet and closest to the Sun. Despite that, ice hides in shadowed craters near its poles!",
  },
  {
    keys: ["earth"],
    reply: "Earth 🌍 — the only known world with life, liquid oceans, and pizza. Pretty special, right?",
  },
  {
    keys: ["moon", "luna"],
    reply:
      "Our Moon is slowly drifting away — about 3.8 cm per year. It also stabilises Earth's tilt, helping make our climate liveable.",
  },
  {
    keys: ["uranus"],
    reply: "Uranus rolls on its side as it orbits the Sun — tilted 98°. It's an ice giant with faint dark rings.",
  },
  {
    keys: ["neptune"],
    reply: "Neptune has the fastest winds in the solar system — up to 2,100 km/h. It's a deep blue ice giant.",
  },
  {
    keys: ["pluto"],
    reply: "Pluto is a dwarf planet with a heart-shaped nitrogen-ice plain called Tombaugh Regio. Tiny but fascinating!",
  },
  {
    keys: ["sun", "solar"],
    reply: "The Sun is a G-type star ~4.6 billion years old. Light from it takes 8 min 20 s to reach Earth.",
  },
  {
    keys: ["star", "stars"],
    reply:
      "There are more stars in the observable universe than grains of sand on every beach on Earth — roughly 10²³ of them. ✨",
  },
  {
    keys: ["black hole"],
    reply:
      "Black holes warp space-time so strongly that not even light escapes. The first image was captured of M87* in 2019.",
  },
  {
    keys: ["galaxy", "milky way"],
    reply:
      "Our Milky Way holds 100–400 billion stars. It'll merge with Andromeda in ~4.5 billion years to form 'Milkdromeda'!",
  },
  {
    keys: ["tonight", "visible", "planets visible", "see tonight"],
    reply:
      "Open the Observation page in Project Zenith — it lists which planets are above your horizon right now based on your location.",
  },
  {
    keys: ["constellation", "constellations"],
    reply:
      "Constellations are pattern-based regions of the sky. Check the Constellations page to explore the 88 official ones!",
  },
  {
    keys: ["satellite", "satellites"],
    reply:
      "There are 10,000+ active satellites orbiting Earth. The Satellites page in Zenith tracks the brightest passes near you.",
  },
  {
    keys: ["zenith", "project zenith", "this site", "website", "navigate", "help"],
    reply:
      "Project Zenith has pages for the Solar System, Planets, Earth, the ISS, Satellites, Constellations, and live Observation. Use the top nav to jump anywhere!",
  },
  {
    keys: ["who are you", "your name", "what are you"],
    reply: "I'm ZENI — a friendly alien from somewhere near Proxima b 👽 here to guide you through the cosmos!",
  },
  {
    keys: ["thanks", "thank you", "thx"],
    reply: "Anytime, Explorer! 💫 Keep looking up.",
  },
  {
    keys: ["bye", "goodbye", "see you"],
    reply: "Safe travels through the stars! 🌌 I'll be right here when you return.",
  },
];

const FALLBACKS = [
  "Hmm, my antennae didn't quite catch that — try asking about a planet, the ISS, or what's visible tonight!",
  "Interesting question! I'm best with space topics — planets, stars, satellites, or Project Zenith navigation.",
  "I'm still learning Earth-speak 👽 — could you rephrase? Try 'Tell me about Mars' or 'What is the ISS?'",
];

function getReply(input: string): string {
  const q = input.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.keys.some((k) => q.includes(k))) return entry.reply;
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function ZeniAlien({ speaking }: { speaking: boolean }) {
  return (
    <motion.div
      className="relative"
      animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* soft glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.25 300 / 0.55), oklch(0.78 0.2 220 / 0.25) 55%, transparent 75%)",
          filter: "blur(14px)",
        }}
        animate={{ scale: speaking ? [1, 1.18, 1] : [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: speaking ? 0.9 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* breathing wrap */}
      <motion.svg
        viewBox="0 0 120 130"
        className="relative h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_0_18px_oklch(0.7_0.25_300/0.7)]"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="zeniBody" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="oklch(0.9 0.18 220)" />
            <stop offset="55%" stopColor="oklch(0.65 0.22 260)" />
            <stop offset="100%" stopColor="oklch(0.38 0.18 290)" />
          </radialGradient>
          <radialGradient id="zeniEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(1 0.05 200)" />
            <stop offset="60%" stopColor="oklch(0.88 0.18 200)" />
            <stop offset="100%" stopColor="oklch(0.55 0.2 240)" />
          </radialGradient>
          <radialGradient id="zeniCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.22 330 / 0.9)" />
            <stop offset="100%" stopColor="oklch(0.78 0.22 330 / 0)" />
          </radialGradient>
          <filter id="zeniGlow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* antenna */}
        <g filter="url(#zeniGlow)">
          <line x1="60" y1="22" x2="60" y2="6" stroke="oklch(0.88 0.18 200)" strokeWidth="2" strokeLinecap="round" />
          <motion.circle
            cx="60"
            cy="5"
            r="4"
            fill="oklch(0.92 0.2 200)"
            animate={{ opacity: [0.6, 1, 0.6], r: [3.5, 4.5, 3.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </g>

        {/* head/body */}
        <ellipse cx="60" cy="65" rx="42" ry="44" fill="url(#zeniBody)" />
        <ellipse cx="60" cy="50" rx="38" ry="22" fill="oklch(1 0 0 / 0.12)" />

        {/* cheeks */}
        <circle cx="28" cy="78" r="9" fill="url(#zeniCheek)" />
        <circle cx="92" cy="78" r="9" fill="url(#zeniCheek)" />

        {/* eyes */}
        <g filter="url(#zeniGlow)">
          <motion.g
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            style={{ transformOrigin: "42px 62px" }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.42, 0.46, 0.5, 1] }}
          >
            <ellipse cx="42" cy="62" rx="11" ry="13" fill="url(#zeniEye)" />
            <circle cx="44" cy="60" r="3" fill="white" opacity="0.95" />
          </motion.g>
          <motion.g
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            style={{ transformOrigin: "78px 62px" }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.42, 0.46, 0.5, 1] }}
          >
            <ellipse cx="78" cy="62" rx="11" ry="13" fill="url(#zeniEye)" />
            <circle cx="80" cy="60" r="3" fill="white" opacity="0.95" />
          </motion.g>
        </g>

        {/* mouth */}
        {speaking ? (
          <motion.ellipse
            cx="60"
            cy="92"
            rx="7"
            ry="5"
            fill="oklch(0.25 0.08 290)"
            stroke="oklch(0.88 0.18 200)"
            strokeWidth="1.5"
            animate={{ ry: [2, 6, 3, 5, 2] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        ) : (
          <path
            d="M50 90 Q60 98 70 90"
            stroke="oklch(0.92 0.15 220)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </motion.svg>

      {/* orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{
            background: i % 2 ? "oklch(0.88 0.18 200)" : "oklch(0.78 0.22 320)",
            boxShadow: "0 0 8px currentColor",
          }}
          animate={{
            x: [Math.cos((i * 2.1)) * 42, Math.cos((i * 2.1) + Math.PI) * 42, Math.cos((i * 2.1)) * 42],
            y: [Math.sin((i * 2.1)) * 42, Math.sin((i * 2.1) + Math.PI) * 42, Math.sin((i * 2.1)) * 42],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "linear", delay: i * 0.6 }}
        />
      ))}
    </motion.div>
  );
}

export function ZeniAssistant() {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "welcome", from: "zeni", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  function send() {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    const reply = getReply(text);
    const delay = Math.min(2200, 600 + reply.length * 18);
    setTimeout(() => {
      setMessages((m) => [...m, { id: `z-${Date.now()}`, from: "zeni", text: reply }]);
      setTyping(false);
    }, delay);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="glass-strong relative flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl"
            style={{
              height: "min(70vh, 520px)",
              boxShadow:
                "0 0 0 1px oklch(0.78 0.18 230 / 0.45), 0 0 38px oklch(0.7 0.25 300 / 0.45), 0 20px 60px oklch(0 0 0 / 0.5)",
            }}
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-[color:var(--neon)]/20 px-4 py-3">
              <div className="relative size-10 shrink-0">
                <ZeniAlien speaking={typing} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-wider text-[color:var(--neon-cyan)]">
                  <Sparkles className="size-3.5" /> ZENI
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {typing ? "thinking…" : "your celestial companion"}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-full border border-[color:var(--neon)]/30 bg-card/40 text-foreground/80 transition hover:text-foreground"
                aria-label="Minimize"
              >
                <Minus className="size-3.5" />
              </button>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        m.from === "user"
                          ? "rounded-br-sm bg-gradient-to-br from-[color:var(--neon-violet)]/80 to-[color:var(--neon)]/70 text-white shadow-[0_0_18px_oklch(0.7_0.25_300/0.45)]"
                          : "rounded-bl-sm border border-[color:var(--neon)]/25 bg-white/5 text-foreground/95 backdrop-blur"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[color:var(--neon)]/25 bg-white/5 px-3 py-2.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="size-1.5 rounded-full bg-[color:var(--neon-cyan)]"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-[color:var(--neon)]/20 bg-black/20 px-3 py-2.5"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ZENI about space…"
                className="flex-1 rounded-full border border-[color:var(--neon)]/25 bg-white/5 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-[color:var(--neon-cyan)] focus:shadow-[0_0_0_2px_oklch(0.88_0.18_200/0.25)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)] text-background shadow-[0_0_18px_oklch(0.7_0.25_300/0.55)] transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Send"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* alien launcher */}
      <div className="relative">
        <AnimatePresence>
          {!open && hint && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-strong neon-border absolute bottom-2 right-24 hidden max-w-[220px] rounded-2xl rounded-br-sm px-3 py-2 text-xs sm:block"
            >
              <span className="text-[color:var(--neon-cyan)] font-semibold">ZENI:</span>{" "}
              <span className="text-foreground/90">Hi Explorer! Tap me to chat ✨</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setOpen((o) => !o);
            setHint(false);
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06, rotate: -4 }}
          className="relative grid size-20 place-items-center rounded-full sm:size-24"
          aria-label="Open ZENI assistant"
        >
          <motion.span
            className="absolute inset-0 rounded-full border border-[color:var(--neon-cyan)]/40"
            animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <ZeniAlien speaking={false} />
          {open && (
            <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full border border-[color:var(--neon)]/40 bg-card/80 text-foreground/80 backdrop-blur">
              <X className="size-3.5" />
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
