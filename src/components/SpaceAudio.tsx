import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Ambient space-themed BGM synthesized with WebAudio (no external asset).
 * Starts only after the user's first interaction (autoplay policy).
 * Volume is intentionally low. Toggle button sits fixed top-right.
 */
export function SpaceAudio() {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("zenith-bgm-muted") === "1";
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  const ensureStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const AC: typeof AudioContext =
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
        window.AudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.06;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Soft pad: two detuned oscillators through a low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.7;
      filter.connect(master);

      const tones = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4 — airy minor pad
      tones.forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = freq;
        o.detune.value = (Math.random() - 0.5) * 8;
        const g = ctx.createGain();
        g.gain.value = 0.18;
        o.connect(g).connect(filter);
        o.start();
        // Slow LFO on gain for breathing
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.05 + Math.random() * 0.05;
        lfoGain.gain.value = 0.08;
        lfo.connect(lfoGain).connect(g.gain);
        lfo.start();
      });
    } catch {
      /* ignore */
    }
  };

  // Start on first interaction
  useEffect(() => {
    const onFirst = () => {
      ensureStarted();
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply mute changes
  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(muted ? 0 : 0.06, ctxRef.current.currentTime, 0.2);
    }
    window.localStorage.setItem("zenith-bgm-muted", muted ? "1" : "0");
  }, [muted]);

  return (
    <button
      onClick={() => {
        ensureStarted();
        setMuted((m) => !m);
      }}
      title={muted ? "Unmute ambient music" : "Mute ambient music"}
      aria-label={muted ? "Unmute ambient music" : "Mute ambient music"}
      className="glass-strong fixed right-4 top-20 z-50 grid size-10 place-items-center rounded-full border border-[color:var(--neon)]/40 text-foreground/90 transition hover:scale-105 hover:text-[color:var(--neon-cyan)]"
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}
