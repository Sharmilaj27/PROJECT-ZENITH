import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Search, Crosshair, Loader2, Bell, BellOff, MapPin, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, Stat, Skeleton } from "@/components/GlassCard";

export const Route = createFileRoute("/earth")({
  head: () => ({
    meta: [
      { title: "Earth Explorer · Zenith" },
      { name: "description", content: "Spin a 3D globe, pick a coordinate, and run a celestial analysis for your location." },
    ],
  }),
  component: EarthPage,
});

type Coord = { lat: number; lon: number; name?: string };
type Weather = { temp: number; wind: number; cloud: number; humidity: number; visibility: number; condition: string };
type Place = { city?: string; region?: string; country?: string; countryCode?: string };
type Priority = "normal" | "important" | "high";
type SkyObject = {
  name: string;
  icon: string;
  altitude: number;     // degrees above horizon
  azimuth: number;      // degrees from north
  status: "Rising" | "Visible" | "Setting" | "Below";
  rise: string;
  set: string;
  distanceKm?: string;
  priority: Priority;
};

/* --- Futuristic alert tones (WebAudio, no asset) --- */
let _ac: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ac) {
    try {
      const AC: typeof AudioContext =
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
        window.AudioContext;
      _ac = new AC();
    } catch {
      return null;
    }
  }
  return _ac;
}
function playAlert(priority: Priority) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const cfg =
    priority === "high"
      ? { freqs: [880, 1320, 1760], dur: 0.5, gain: 0.18 }
      : priority === "important"
        ? { freqs: [660, 990], dur: 0.35, gain: 0.13 }
        : { freqs: [520], dur: 0.18, gain: 0.08 };
  cfg.freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, now + i * 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + i * 0.08);
    g.gain.linearRampToValueAtTime(cfg.gain, now + i * 0.08 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + cfg.dur);
    o.connect(g).connect(ctx.destination);
    o.start(now + i * 0.08);
    o.stop(now + i * 0.08 + cfg.dur + 0.05);
  });
}

function EarthPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [coord, setCoord] = useState<Coord>({ lat: 28.6139, lon: 77.2090, name: "New Delhi" });
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingW, setLoadingW] = useState(false);
  const [objects, setObjects] = useState<SkyObject[]>([]);
  const [place, setPlace] = useState<Place>({});
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("zenith-earth-sound") !== "0";
  });
  const prevObjectKeysRef = useRef<string>("");
  const markerRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    window.localStorage.setItem("zenith-earth-sound", soundOn ? "1" : "0");
  }, [soundOn]);

  // 3D globe
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = 4.8;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x556688, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const tex = loader.load("https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg");
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 64, 64),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.1 })
    );
    scene.add(earth);

    // atmosphere
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x4fb0ff, transparent: true, opacity: 0.12, side: THREE.BackSide })
    );
    scene.add(atmo);

    // marker
   // marker
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0xffffff
  })
);
//marker.visible=false;

//earth.add(marker);
//markerRef.current = marker ;
marker.renderOrder = 999;
marker.material.depthTest = false;

// hover marker
const hoverMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.03, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0x66ffe6
  })
);

earth.add(hoverMarker);

const selectedMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);

earth.add(selectedMarker);

// glow effect
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0x66ffe6,
    transparent: true,
    opacity: 0.4
  })
);

marker.add(glow);

earth.add(marker);
markerRef.current = marker;

    let drag = false;
    let lx = 0, ly = 0;
    let rotY = 0, rotX = 0;
    const onDown = (e: PointerEvent) => { drag = true; lx = e.clientX; ly = e.clientY; };
    const onUp = () => { drag = false; };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      rotY += (e.clientX - lx) * 0.005;
      rotX += (e.clientY - ly) * 0.005;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      lx = e.clientX; ly = e.clientY;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

    // click to pick
    const ray = new THREE.Raycaster();
    const vec = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      vec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      vec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(vec, camera);
      const hits = ray.intersectObject(earth);
      if (hits.length) {
        const p = hits[0].point.clone().applyMatrix4(new THREE.Matrix4().copy(earth.matrixWorld).invert());
        const lat = Math.asin(p.y/1.6)*(180/Math.PI);
        const lon = ((Math.atan2(p.z, -p.x) * 180) / Math.PI);
        setCoord({ lat, lon });
        setCoord({
  lat,
  lon,
  name: `Selected Point`
});

      }
    };
    renderer.domElement.addEventListener("click", onClick);

    let raf = 0;
    const tick = () => {
      earth.rotation.y = rotY + 0.0008 * performance.now() * 0.05;
      earth.rotation.x = rotX;
      atmo.rotation.copy(earth.rotation);
      if (markerRef.current) {
  markerRef.current.rotation.copy(earth.rotation);
}
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // position marker on coord change
  useEffect(() => {
    if (!markerRef.current) return;
    const phi = (90 - coord.lat) * (Math.PI / 180);
    const theta = (coord.lon + 180) * (Math.PI / 180);
    const r = 1.72;
    markerRef.current.position.set(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }, [coord]);

  // fetch weather (Open-Meteo)
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoadingW(true);
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,visibility,weather_code`,
          { signal: ctrl.signal }
        );
        const j = await r.json();
        const c = j.current;
        setWeather({
          temp: c.temperature_2m,
          humidity: c.relative_humidity_2m,
          cloud: c.cloud_cover,
          wind: c.wind_speed_10m,
          visibility: (c.visibility ?? 0) / 1000,
          condition: codeToText(c.weather_code),
        });
       
      } catch {
        // ignore
      } finally {
        setLoadingW(false);
      }
    })();
    return () => ctrl.abort();
  }, [coord]);



  // Reverse-geocode the picked coordinate → city / region / country.
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coord.lat}&longitude=${coord.lon}&localityLanguage=en`,
          { signal: ctrl.signal }
        );
        const j = await r.json();
        setPlace({
          city: j.city || j.locality || j.localityInfo?.administrative?.[3]?.name,
          region: j.principalSubdivision,
          country: j.countryName,
          countryCode: j.countryCode,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => ctrl.abort();
  }, [coord]);

  // Build a richer celestial visibility list with alt/az/status/priority.
  useEffect(() => {
    const t = Date.now() / 1000;
    const seed = (coord.lat + coord.lon + t / 3600) | 0;
    const rng = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 233280;
      return x - Math.floor(x);
    };
    const list: SkyObject[] = [];
    if (coord.lat > 20) {
      list.push({ name: "Orion", icon: "⭐", altitude: 45 + rng(1) * 20, azimuth: 150 + rng(2) * 40, status: "Visible", rise: "18:42", set: "04:10", priority: "normal" });
      list.push({ name: "Ursa Major", icon: "⭐", altitude: 38 + rng(3) * 15, azimuth: 20 + rng(4) * 30, status: "Visible", rise: "20:00", set: "06:30", priority: "normal" });
    }
    if (coord.lat < -20) {
      list.push({ name: "Crux", icon: "⭐", altitude: 52 + rng(5) * 12, azimuth: 180, status: "Visible", rise: "19:10", set: "05:25", priority: "normal" });
      list.push({ name: "Centaurus", icon: "⭐", altitude: 40 + rng(6) * 18, azimuth: 195, status: "Rising", rise: "21:00", set: "06:55", priority: "normal" });
    }
    if (coord.lon > 0) {
      list.push({ name: "Jupiter", icon: "🪐", altitude: 30 + rng(7) * 25, azimuth: 120, status: "Visible", rise: "19:30", set: "03:45", distanceKm: "628 M km", priority: "important" });
    } else {
      list.push({ name: "Saturn", icon: "🪐", altitude: 25 + rng(8) * 20, azimuth: 200, status: "Visible", rise: "20:15", set: "04:20", distanceKm: "1.42 B km", priority: "important" });
    }
    // ISS — always notable
    list.push({ name: "ISS", icon: "🛰", altitude: 12 + rng(9) * 60, azimuth: 90 + rng(10) * 180, status: "Rising", rise: "—", set: "+8 min", distanceKm: "408 km", priority: "high" });
    // Occasional meteor shower
    if (rng(11) > 0.6) {
      list.push({ name: "Perseids Meteors", icon: "☄", altitude: 55, azimuth: 45, status: "Visible", rise: "22:00", set: "04:30", priority: "high" });
    }
    setObjects(list);

    // Alert: highest priority of any newly-visible object
    const key = list.map((o) => o.name + o.status).join("|");
    const prev = prevObjectKeysRef.current;
    if (prev && prev !== key && soundOn) {
      const top: Priority = list.some((o) => o.priority === "high")
        ? "high"
        : list.some((o) => o.priority === "important")
          ? "important"
          : "normal";
      playAlert(top);
    }
    prevObjectKeysRef.current = key;
  }, [coord, soundOn]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
      );
      const j = await r.json();
      const hit = j.results?.[0];
      if (hit) setCoord({ lat: hit.latitude, lon: hit.longitude, name: `${hit.name}, ${hit.country_code}` });
    } finally {
      setSearching(false);
    }
  };

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoord({ lat: p.coords.latitude, lon: p.coords.longitude, name: "Your location" }),
      () => {}
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title="Earth Explorer" sub="Pick a location to run a celestial analysis." />

      <div className="mt-6 grid gap-6 lg:grid-cols-[320pm_1fr_320px] items-start">
        <GlassCard className="overflow-hidden p-4 flex items-center justify-center">
  <div
    ref={mountRef}
    className="h-[850px] w-full rounded-2xl"
  />
</GlassCard>

        <div className="space-y-6 sticky top-24">
          <GlassCard>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="Search city or place…"
                  className="w-full rounded-lg border border-border bg-white/5 px-9 py-2 text-sm outline-none focus:border-[color:var(--neon)]"
                />
              </div>
              <button
                onClick={search}
                disabled={searching}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] neon-glow disabled:opacity-50"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : "Go"}
              </button>
              <button
                onClick={detect}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                <Crosshair className="size-4" /> Auto
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Latitude" value={coord.lat.toFixed(4) + "°"} />
              <Stat label="Longitude" value={coord.lon.toFixed(4) + "°"} />
            </div>
            {coord.name && (
              <div className="mt-3 text-xs text-muted-foreground">📍 {coord.name}</div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-display text-base font-bold">Celestial Analysis</h3>
            {loadingW ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : weather ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Temperature" value={`${weather.temp.toFixed(1)}°C`} sub={weather.condition} />
                <Stat label="Cloud Cover" value={`${weather.cloud}%`} />
                <Stat label="Humidity" value={`${weather.humidity}%`} />
                <Stat label="Wind" value={`${weather.wind.toFixed(1)} km/h`} />
                <Stat label="Visibility" value={`${weather.visibility.toFixed(1)} km`} />
                <Stat label="Stargaze Score" value={scoreStars(weather)} sub="0 = poor · 10 = pristine" />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No data.</p>
            )}
          </GlassCard>
        <AnimatePresence>
          <motion.div
            key={`${coord.lat.toFixed(3)}-${coord.lon.toFixed(3)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <GlassCard>
  <div className="mb-3 flex items-center justify-between">
    <h3 className="flex items-center gap-2 font-display text-base font-bold">
      <MapPin className="size-4 text-[color:var(--neon-cyan)]" />
      Location Intel
    </h3>

    <button
      onClick={() => setSoundOn((v) => !v)}
      title={soundOn ? "Disable alert sounds" : "Enable alert sounds"}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
    >
      {soundOn ? <Bell className="size-3" /> : <BellOff className="size-3" />}
      {soundOn ? "Alerts on" : "Alerts off"}
    </button>
  </div>

  <div className="text-sm">
    <div className="font-semibold text-foreground">
      {place.city || "Unknown locality"}
      {place.region ? `, ${place.region}` : ""}
    </div>

    <div className="text-xs text-muted-foreground">
      {place.country ?? "—"} {place.countryCode ? `(${place.countryCode})` : ""}
    </div>

    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <div>
        Lat: <span className="text-foreground">{coord.lat.toFixed(4)}°</span>
      </div>

      <div>
        Lon: <span className="text-foreground">{coord.lon.toFixed(4)}°</span>
      </div>
    </div>
  </div>
</GlassCard>

<GlassCard>
  <h3 className="flex items-center gap-2 font-display text-base font-bold">
    <Radio className="size-4 text-[color:var(--neon-cyan)]" />
    Visible Celestial Objects
  </h3>

  <div className="mt-3 space-y-2">
                {objects.map((o) => {
                  const ring =
                    o.priority === "high"
                      ? "border-[color:var(--neon-cyan)]/60 shadow-[0_0_24px_oklch(0.85_0.18_220/0.35)]"
                      : o.priority === "important"
                        ? "border-[color:var(--neon-violet)]/50"
                        : "border-border";
                  return (
                    <motion.div
                      key={o.name}
                      whileHover={{ scale: 1.015 }}
                      className={`rounded-lg border ${ring} bg-white/5 p-2.5 text-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{o.icon}</span>
                          <span className="font-semibold">{o.name}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            o.status === "Visible"
                              ? "bg-[color:var(--neon-cyan)]/15 text-[color:var(--neon-cyan)]"
                              : o.status === "Rising"
                                ? "bg-[color:var(--neon)]/15 text-[color:var(--neon)]"
                                : "bg-white/5 text-muted-foreground"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <div>Alt: <span className="text-foreground">{o.altitude.toFixed(1)}°</span></div>
                        <div>Az: <span className="text-foreground">{o.azimuth.toFixed(0)}°</span></div>
                        <div>Rise: <span className="text-foreground">{o.rise}</span></div>
                        <div>Set: <span className="text-foreground">{o.set}</span></div>
                        {o.distanceKm && (
                          <div className="col-span-2">Distance: <span className="text-foreground">{o.distanceKm}</span></div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

function scoreStars(w: Weather): string {
  const s = Math.max(0, 10 - w.cloud / 12 - w.humidity / 25 - Math.max(0, 10 - w.visibility) / 2);
  return s.toFixed(1);
}

function codeToText(c: number): string {
  if (c === 0) return "Clear sky";
  if (c < 3) return "Mainly clear";
  if (c < 50) return "Cloudy";
  if (c < 70) return "Rain";
  if (c < 80) return "Snow";
  return "Storm";
}

import { PageHeader } from "@/components/PageHeader";
export { PageHeader };
