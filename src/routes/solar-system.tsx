import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, Music, Music2, Pause, Play, Maximize2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import texSunUrl from "@/assets/tex-sun.jpg";
import texMercuryUrl from "@/assets/tex-mercury.jpg";
import texVenusUrl from "@/assets/tex-venus.jpg";
import texEarthUrl from "@/assets/tex-earth.jpg";
import texEarthCloudsUrl from "@/assets/tex-earth-clouds.jpg";
import texMarsUrl from "@/assets/tex-mars.jpg";
import texJupiterUrl from "@/assets/tex-jupiter.jpg";
import texSaturnUrl from "@/assets/tex-saturn.jpg";
import texUranusUrl from "@/assets/tex-uranus.jpg";
import texNeptuneUrl from "@/assets/tex-neptune.jpg";
import texSaturnRingsUrl from "@/assets/tex-saturn-rings.jpg";

const TEXTURE_URLS: Record<string, string> = {
  Sun: texSunUrl,
  Mercury: texMercuryUrl,
  Venus: texVenusUrl,
  Earth: texEarthUrl,
  Mars: texMarsUrl,
  Jupiter: texJupiterUrl,
  Saturn: texSaturnUrl,
  Uranus: texUranusUrl,
  Neptune: texNeptuneUrl,
};

export const Route = createFileRoute("/solar-system")({
  head: () => ({
    meta: [
      { title: "Solar System Explorer · Zenith" },
      { name: "description", content: "Fly through an immersive 3D solar system — click any planet to focus, hear ZENI narrate, and explore live telemetry." },
    ],
  }),
  component: SolarPage,
});

type PlanetInfo = {
  description: string;
  mass: string;
  diameter: string;
  gravity: string;
  temperature: string;
  day: string;
  distance: string;
  moons: number;
  atmosphere: string;
  fact: string;
  narration: string;
};

const PLANET_INFO: Record<string, PlanetInfo> = {
  Sun: {
    description: "A G-type main-sequence star holding 99.86% of the solar system's mass.",
    mass: "1.989 × 10³⁰ kg", diameter: "1,391,400 km", gravity: "274 m/s²", temperature: "5,500 °C surface",
    day: "~25 days", distance: "—", moons: 0, atmosphere: "Hydrogen, Helium",
    fact: "The Sun's core reaches 15 million °C — fusing 600 million tons of hydrogen every second.",
    narration: "Behold the Sun — a colossal furnace of plasma at the heart of our system, fusing hydrogen into helium for over four billion years.",
  },
  Mercury: {
    description: "The smallest planet and closest to the Sun, with extreme temperature swings.",
    mass: "3.30 × 10²³ kg", diameter: "4,879 km", gravity: "3.7 m/s²", temperature: "-173 to 427 °C",
    day: "59 Earth days", distance: "57.9 million km", moons: 0, atmosphere: "Trace — Oxygen, Sodium",
    fact: "A year on Mercury is just 88 Earth days, yet a single day-night cycle lasts 176.",
    narration: "Greetings explorer. Mercury is the closest planet to the Sun — a scorched, cratered world of extremes.",
  },
  Venus: {
    description: "Earth's twin in size — but a runaway greenhouse with crushing pressure.",
    mass: "4.87 × 10²⁴ kg", diameter: "12,104 km", gravity: "8.87 m/s²", temperature: "465 °C",
    day: "243 Earth days", distance: "108.2 million km", moons: 0, atmosphere: "96% CO₂, sulfuric acid clouds",
    fact: "Venus rotates backwards — and its day is longer than its year.",
    narration: "Venus — Earth's veiled twin, wrapped in toxic clouds and the hottest surface in the solar system.",
  },
  Earth: {
    description: "The only known world hosting life — a vibrant blue marble.",
    mass: "5.97 × 10²⁴ kg", diameter: "12,742 km", gravity: "9.81 m/s²", temperature: "-88 to 58 °C",
    day: "24 hours", distance: "149.6 million km", moons: 1, atmosphere: "78% N₂, 21% O₂",
    fact: "Earth is the only planet not named after a god or goddess.",
    narration: "Earth — the only known planet that supports life. A fragile oasis of water, air, and wonder.",
  },
  Mars: {
    description: "The Red Planet — once warm and wet, now a frozen desert.",
    mass: "6.42 × 10²³ kg", diameter: "6,779 km", gravity: "3.71 m/s²", temperature: "-87 to -5 °C",
    day: "24.6 hours", distance: "227.9 million km", moons: 2, atmosphere: "95% CO₂, thin",
    fact: "Olympus Mons on Mars is 22 km tall — three times Everest.",
    narration: "Mars is called the Red Planet, and may have once contained vast oceans of liquid water.",
  },
  Jupiter: {
    description: "King of planets — a gas giant with a 350-year-old storm.",
    mass: "1.90 × 10²⁷ kg", diameter: "139,820 km", gravity: "24.79 m/s²", temperature: "-108 °C cloud tops",
    day: "9.9 hours", distance: "778.5 million km", moons: 95, atmosphere: "Hydrogen, Helium",
    fact: "Jupiter's Great Red Spot is a storm wider than Earth.",
    narration: "Jupiter — a swirling gas giant so massive it could swallow all the other planets twice over.",
  },
  Saturn: {
    description: "The jewel of the solar system, ringed in ice and rock.",
    mass: "5.68 × 10²⁶ kg", diameter: "116,460 km", gravity: "10.44 m/s²", temperature: "-138 °C",
    day: "10.7 hours", distance: "1.43 billion km", moons: 146, atmosphere: "Hydrogen, Helium",
    fact: "Saturn is so low in density it would float in water.",
    narration: "Saturn is famous for its magnificent rings and one hundred and forty six moons orbiting in cosmic dance.",
  },
  Uranus: {
    description: "An ice giant rotating on its side — pale cyan and serene.",
    mass: "8.68 × 10²⁵ kg", diameter: "50,724 km", gravity: "8.69 m/s²", temperature: "-195 °C",
    day: "17 hours", distance: "2.87 billion km", moons: 27, atmosphere: "H₂, He, Methane",
    fact: "Uranus rotates on its side — likely from an ancient impact.",
    narration: "Uranus — the tilted ice giant, rolling through space on its side like a celestial bowling ball.",
  },
  Neptune: {
    description: "The windy ice giant of the outer dark — deep azure blue.",
    mass: "1.02 × 10²⁶ kg", diameter: "49,244 km", gravity: "11.15 m/s²", temperature: "-201 °C",
    day: "16 hours", distance: "4.50 billion km", moons: 14, atmosphere: "H₂, He, Methane",
    fact: "Neptune's supersonic winds reach 2,100 km/h — the fastest in the solar system.",
    narration: "Neptune is the windiest planet in our solar system, with storms tearing through its azure clouds.",
  },
};

type Def = {
  name: string; color: number; size: number; dist: number; speed: number; spin: number;
  ring?: boolean; emissive?: number;
};

const DEFS: Def[] = [
  { name: "Sun",     color: 0xffcc55, size: 4.6, dist: 0,  speed: 0,      spin: 0.004, emissive: 0xffaa22 },
  { name: "Mercury", color: 0xb5b5b5, size: 0.55, dist: 8,  speed: 0.020,  spin: 0.020 },
  { name: "Venus",   color: 0xeccc8e, size: 0.95, dist: 11, speed: 0.015,  spin: 0.015 },
  { name: "Earth",   color: 0x4fb0ff, size: 1.0,  dist: 14.5, speed: 0.012, spin: 0.025 },
  { name: "Mars",    color: 0xd97a4a, size: 0.75, dist: 18, speed: 0.010,  spin: 0.024 },
  { name: "Jupiter", color: 0xd9b48a, size: 2.6,  dist: 24, speed: 0.0065, spin: 0.030 },
  { name: "Saturn",  color: 0xe8d39b, size: 2.2,  dist: 31, speed: 0.0050, spin: 0.028, ring: true },
  { name: "Uranus",  color: 0x9fe6e8, size: 1.5,  dist: 37, speed: 0.0038, spin: 0.022 },
  { name: "Neptune", color: 0x5b7cff, size: 1.45, dist: 43, speed: 0.0030, spin: 0.022 },
];

// Outer-most orbit + body extent used to frame the whole system in overview mode
const SYSTEM_RADIUS = 46; // Neptune dist (43) + body/halo margin

function computeOverviewDist(fovDeg: number, aspect: number) {
  const fov = (fovDeg * Math.PI) / 180;
  const vertical = SYSTEM_RADIUS / Math.tan(fov / 2);
  const horizontal = SYSTEM_RADIUS / (Math.tan(fov / 2) * Math.max(aspect, 0.0001));
  return Math.max(vertical, horizontal) * 1.15 + 10;
}

function SolarPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string>("Earth");
  const [hovered, setHovered] = useState<string | null>(null);
  const [narrate, setNarrate] = useState(true);
  const [ambient, setAmbient] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [overview, setOverview] = useState(true); // default: show entire system
  const [labelPos, setLabelPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  // Refs for imperative scene control
  const selectedRef = useRef(selected);
  const pausedRef = useRef(paused);
  const overviewRef = useRef(overview);
  const focusTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const focusDistRef = useRef(150);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planetMapRef = useRef<Map<string, { mesh: THREE.Mesh; pivot: THREE.Object3D; halo: THREE.Mesh; particles?: THREE.Points; baseSize: number; speed: number }>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientOscRef = useRef<OscillatorNode[]>([]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { overviewRef.current = overview; }, [overview]);

  // ---------- Three.js scene ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 3000);
    cameraRef.current = camera;
    focusDistRef.current = computeOverviewDist(50, W / H);
    camera.position.set(0, focusDistRef.current * 0.45, focusDistRef.current);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    // Lighting — NASA-style realistic day/night with visible dark side.
    //   AmbientLight (0.45) softly lifts the night side so no planet ever
    //     renders as a pure black silhouette.
    //   DirectionalLight at the Sun (1.8) is the primary key light, giving
    //     each planet a clear lit hemisphere and gentle terminator.
    //   PointLight at the Sun keeps physically-correct falloff for the
    //     inner-system glow on dust/rings.
    //   HemisphereLight adds cool sky / warm ground tint for shading depth.
    //   A faint camera-side fill guarantees surface detail from any angle.
    scene.add(new THREE.AmbientLight(0xc8d4ff, 1.5));
    const hemi = new THREE.HemisphereLight(0xbfd2ff, 0x1a2238, 0.35);
    scene.add(hemi);
    const sunKey = new THREE.DirectionalLight(0xfff4d6, 1.8);
    sunKey.position.set(0, 0, 0); // emitted from the Sun's location
    scene.add(sunKey);
    const sunLight = new THREE.PointLight(0xffffff, 3.5, 0, 1);
    scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x8fb6ff, 0.25);
    fill.position.set(0, 30, 80);
    scene.add(fill);

    // Texture loader (shared)
    const texLoader = new THREE.TextureLoader();
    const loadTex = (url: string) => {
      const t = texLoader.load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };

    // Nebula background (radial-gradient sprite)
    const nebulaCanvas = document.createElement("canvas");
    nebulaCanvas.width = nebulaCanvas.height = 512;
    const nctx = nebulaCanvas.getContext("2d")!;
    const grad = nctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, "rgba(140,90,255,0.55)");
    grad.addColorStop(0.4, "rgba(60,80,200,0.25)");
    grad.addColorStop(1, "rgba(5,5,20,0)");
    nctx.fillStyle = grad;
    nctx.fillRect(0, 0, 512, 512);
    const nebulaTex = new THREE.CanvasTexture(nebulaCanvas);
    const nebulaMat = new THREE.SpriteMaterial({ map: nebulaTex, transparent: true, opacity: 0.7, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Sprite(nebulaMat);
      s.position.set((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 400, -300 - Math.random() * 400);
      const sc = 400 + Math.random() * 400;
      s.scale.set(sc, sc, 1);
      scene.add(s);
    }

    // Star field
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3500;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 300 + Math.random() * 900;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(p) * Math.cos(t);
      positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      positions[i * 3 + 2] = r * Math.cos(p);
      sizes[i] = Math.random() * 1.5 + 0.3;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.0, sizeAttenuation: true, transparent: true, opacity: 0.9 })
    );
    scene.add(stars);

    // Sun glow sprite
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 256;
    const gctx = glowCanvas.getContext("2d")!;
    const g = gctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, "rgba(255,220,120,0.9)");
    g.addColorStop(0.3, "rgba(255,160,60,0.45)");
    g.addColorStop(1, "rgba(255,100,30,0)");
    gctx.fillStyle = g; gctx.fillRect(0, 0, 256, 256);
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
    sunGlow.scale.set(5.5, 5.5, 1);
    scene.add(sunGlow);

    // Particle sprite for selection
    const partCanvas = document.createElement("canvas");
    partCanvas.width = partCanvas.height = 64;
    const pctx = partCanvas.getContext("2d")!;
    const pg = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    pg.addColorStop(0, "rgba(120,220,255,1)");
    pg.addColorStop(0.5, "rgba(120,180,255,0.5)");
    pg.addColorStop(1, "rgba(120,180,255,0)");
    pctx.fillStyle = pg; pctx.fillRect(0, 0, 64, 64);
    const particleTex = new THREE.CanvasTexture(partCanvas);

    // Halo material (per-planet neon ring sprite)
    function makeHalo(color: number, size: number) {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const x = c.getContext("2d")!;
      const r = x.createRadialGradient(128, 128, size * 18, 128, 128, 128);
      const col = new THREE.Color(color);
      x.fillStyle = "rgba(0,0,0,0)";
      x.fillRect(0, 0, 256, 256);
      r.addColorStop(0, `rgba(${(col.r*255)|0},${(col.g*255)|0},${(col.b*255)|0},0)`);
      r.addColorStop(0.55, `rgba(120,200,255,0.7)`);
      r.addColorStop(1, `rgba(120,200,255,0)`);
      x.fillStyle = r; x.fillRect(0, 0, 256, 256);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      sp.scale.set(size * 6, size * 6, 1);
      return sp;
    }

    // Build planets
    const planets: { def: Def; mesh: THREE.Mesh; pivot: THREE.Object3D; halo: THREE.Sprite; particles: THREE.Points; baseSize: number; speed: number }[] = [];
    DEFS.forEach((d) => {
      const pivot = new THREE.Object3D();
      pivot.rotation.x = (Math.random() - 0.5) * 0.05;
      scene.add(pivot);

      const texUrl = TEXTURE_URLS[d.name];
      const map = texUrl ? loadTex(texUrl) : null;
      // Use MeshBasicMaterial across the board so every planet is fully lit
      // from all angles — no terminator / dark hemisphere ever.
      const mat = new THREE.MeshBasicMaterial({
        map: map ?? undefined,
        color: map ? 0xffffff : d.color,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.size, 64, 64), mat);
      mesh.position.x = d.dist;
      mesh.userData.name = d.name;
      pivot.add(mesh);

      if (d.ring) {
        const ringTex = loadTex(texSaturnRingsUrl);
        ringTex.wrapS = ringTex.wrapT = THREE.ClampToEdgeWrapping;
        const ringGeo = new THREE.RingGeometry(d.size + 0.6, d.size + 2.6, 128, 1);
        // Remap UVs radially so the strip texture wraps as concentric rings
        const pos = ringGeo.attributes.position as THREE.BufferAttribute;
        const uv = ringGeo.attributes.uv as THREE.BufferAttribute;
        const innerR = d.size + 0.6;
        const outerR = d.size + 2.6;
        for (let i = 0; i < pos.count; i++) {
          const r = Math.hypot(pos.getX(i), pos.getY(i));
          uv.setXY(i, (r - innerR) / (outerR - innerR), 0.5);
        }
        uv.needsUpdate = true;
        const ring = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false, alphaTest: 0.02 })
        );
        ring.rotation.x = Math.PI / 2 - 0.18;
        mesh.add(ring);
      }

      // Earth: cloud shell + atmospheric glow
      if (d.name === "Earth") {
        const cloudsTex = loadTex(texEarthCloudsUrl);
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(d.size * 1.015, 64, 64),
          new THREE.MeshBasicMaterial({
            map: cloudsTex,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        clouds.userData.spin = 0.0015;
        mesh.add(clouds);
        // Atmosphere shell (backside, additive)
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(d.size * 1.08, 48, 48),
          new THREE.MeshBasicMaterial({
            color: 0x4aa8ff,
            transparent: true,
            opacity: 0.18,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        mesh.add(atmo);
      }

      // Atmospheric rim glow for Venus, Uranus, Neptune (Earth has its own above).
      if (d.name === "Venus" || d.name === "Uranus" || d.name === "Neptune") {
        const rimColor =
          d.name === "Venus" ? 0xffd58a :
          d.name === "Uranus" ? 0x9fe9e4 :
          0x4a7bff;
        const rim = new THREE.Mesh(
          new THREE.SphereGeometry(d.size * 1.07, 48, 48),
          new THREE.MeshBasicMaterial({
            color: rimColor,
            transparent: true,
            opacity: 0.16,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        mesh.add(rim);
      }

      // Sun: self-illuminate fully (no shadow side)
      if (d.name === "Sun") {
        // The Sun is a star: never casts/receives shadow and ignores scene lights.
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const sunCorona = new THREE.Mesh(
          new THREE.SphereGeometry(d.size * 1.12, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xffb84a, transparent: true, opacity: 0.25, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        sunCorona.castShadow = false;
        sunCorona.receiveShadow = false;
        mesh.add(sunCorona);
      }

      if (d.dist > 0) {
        const orbit = new THREE.Mesh(
          new THREE.RingGeometry(d.dist - 0.02, d.dist + 0.02, 160),
          new THREE.MeshBasicMaterial({ color: 0x6f9fff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
        );
        orbit.rotation.x = -Math.PI / 2;
        scene.add(orbit);
      }

      // Halo + particles attached to mesh.
      // The Sun skips both — its blue halo + cyan particles were tinting
      // one hemisphere and reading as a "dark side" against the white glow.
      const halo = makeHalo(d.color, d.size);
      if (d.name !== "Sun") mesh.add(halo);

      const N = d.name === "Sun" ? 0 : 80;
      const pPos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = d.size * (1.6 + Math.random() * 0.8);
        pPos[i*3] = Math.cos(a) * r;
        pPos[i*3+1] = (Math.random() - 0.5) * d.size * 0.6;
        pPos[i*3+2] = Math.sin(a) * r;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ map: particleTex, size: d.size * 0.55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x88c8ff })
      );
      if (d.name !== "Sun") mesh.add(particles);

      pivot.rotation.y = Math.random() * Math.PI * 2;
      planets.push({ def: d, mesh, pivot, halo, particles, baseSize: d.size, speed: d.speed });
      planetMapRef.current.set(d.name, { mesh, pivot, halo: halo as unknown as THREE.Mesh, particles, baseSize: d.size, speed: d.speed });
    });

    // Shooting stars
    type Shoot = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; max: number };
    const shoots: Shoot[] = [];
    const spawnShoot = () => {
      const geo = new THREE.SphereGeometry(0.25, 8, 8);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfeaff }));
      m.position.set((Math.random() - 0.5) * 200, 40 + Math.random() * 60, -100 - Math.random() * 50);
      const vel = new THREE.Vector3(-2 - Math.random() * 1, -1.5 - Math.random(), 1.5);
      scene.add(m);
      shoots.push({ mesh: m, vel, life: 0, max: 90 });
    };

    // Raycaster — click + hover
    const ray = new THREE.Raycaster();
    const v2 = new THREE.Vector2();
    const meshes = planets.map((p) => p.mesh);

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      v2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      v2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
      ray.setFromCamera(v2, camera);
      const hits = ray.intersectObjects(meshes);
      if (hits.length) {
        const name = hits[0].object.userData.name as string;
        setSelected(name);
        setOverview(false);
        playSelectSound();
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    const onPointerMoveHover = (e: PointerEvent) => {
      if (drag) return;
      updatePointer(e.clientX, e.clientY);
      ray.setFromCamera(v2, camera);
      const hits = ray.intersectObjects(meshes);
      if (hits.length) {
        const name = hits[0].object.userData.name as string;
        setHovered(name);
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHovered(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    // Drag orbit + touch + pinch
    let drag = false, lx = 0, ly = 0;
    let yaw = 0, pitch = 0.38;
    const onDown = (e: PointerEvent) => { drag = true; lx = e.clientX; ly = e.clientY; renderer.domElement.style.cursor = "grabbing"; };
    const onMove = (e: PointerEvent) => {
      onPointerMoveHover(e);
      if (!drag) return;
      yaw -= (e.clientX - lx) * 0.005;
      pitch += (e.clientY - ly) * 0.005;
      pitch = Math.max(0.05, Math.min(1.35, pitch));
      lx = e.clientX; ly = e.clientY;
    };
    const onUp = () => { drag = false; renderer.domElement.style.cursor = "grab"; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      focusDistRef.current = Math.max(6, Math.min(400, focusDistRef.current + e.deltaY * 0.12));
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // Pinch
    const touches = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let pinchStartDist = focusDistRef.current;
    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) touches.set(e.touches[i].identifier, { x: e.touches[i].clientX, y: e.touches[i].clientY });
      if (touches.size === 2) {
        const [a, b] = Array.from(touches.values());
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartDist = focusDistRef.current;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const a = e.touches[0], b = e.touches[1];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const ratio = pinchStart / Math.max(d, 1);
        focusDistRef.current = Math.max(6, Math.min(400, pinchStartDist * ratio));
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) touches.delete(e.changedTouches[i].identifier);
    };
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);

    // Animation loop
    const tmpVec = new THREE.Vector3();
    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      if (frame % 240 === 0 && Math.random() < 0.7) spawnShoot();

      const selName = selectedRef.current;
      const isPaused = pausedRef.current;
      const isOverview = overviewRef.current;

      planets.forEach((p) => {
        const isSel = !isOverview && p.def.name === selName;
        // Orbit (pause selected when focused, or all when paused)
        if (!isPaused && !(isSel && p.def.name !== "Sun")) {
          p.pivot.rotation.y += p.speed;
        }
        p.mesh.rotation.y += p.def.spin;

        // Scale + halo interp
        const targetScale = isSel ? 1.45 : (hoveredRef.current === p.def.name ? 1.12 : 1);
        const cur = p.mesh.scale.x;
        const next = cur + (targetScale - cur) * 0.12;
        p.mesh.scale.setScalar(next);

        const haloMat = p.halo.material as THREE.SpriteMaterial;
        const targetOpacity = isSel ? 0.9 : 0;
        haloMat.opacity += (targetOpacity - haloMat.opacity) * 0.1;
        const pulse = isSel ? 1 + Math.sin(frame * 0.08) * 0.08 : 1;
        p.halo.scale.setScalar(p.baseSize * 6 * pulse);

        const partMat = p.particles.material as THREE.PointsMaterial;
        const partTarget = isSel ? 1 : 0;
        partMat.opacity += (partTarget - partMat.opacity) * 0.08;
        p.particles.rotation.y += 0.01;
      });

      // Sun pulse
      const sunMesh = planetMapRef.current.get("Sun")!.mesh;
      sunGlow.position.copy(sunMesh.position);
      sunGlow.scale.setScalar(5.5 + Math.sin(frame * 0.03) * 0.4);

      // Camera focus target: origin in overview, selected planet otherwise
      if (isOverview) {
        focusTargetRef.current.lerp(tmpVec.set(0, 0, 0), 0.08);
        setLabelPos((prev) => (prev.visible ? { x: prev.x, y: prev.y, visible: false } : prev));
      } else {
        const sel = planetMapRef.current.get(selName);
        if (sel) {
          sel.mesh.getWorldPosition(tmpVec);
          focusTargetRef.current.lerp(tmpVec, 0.08);

          // project to screen for floating label
          const proj = tmpVec.clone().project(camera);
          const rect = renderer.domElement.getBoundingClientRect();
          const sx = (proj.x * 0.5 + 0.5) * rect.width;
          const sy = (-proj.y * 0.5 + 0.5) * rect.height - sel.baseSize * 22;
          const visible = proj.z < 1;
          setLabelPos({ x: sx, y: sy, visible });
        }
      }


      const dist = focusDistRef.current;
      const center = focusTargetRef.current;
      const cx = center.x + Math.sin(yaw) * Math.cos(pitch) * dist;
      const cy = center.y + Math.sin(pitch) * dist;
      const cz = center.z + Math.cos(yaw) * Math.cos(pitch) * dist;
      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.06);
      camera.lookAt(center);

      // Shooting stars
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.mesh.position.add(s.vel);
        s.life++;
        const a = 1 - s.life / s.max;
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, a);
        (s.mesh.material as THREE.MeshBasicMaterial).transparent = true;
        if (s.life >= s.max) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          (s.mesh.material as THREE.Material).dispose();
          shoots.splice(i, 1);
        }
      }

      stars.rotation.y += 0.00015;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      W = mount.clientWidth; H = mount.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      if (overviewRef.current) {
        focusDistRef.current = computeOverviewDist(50, W / H);
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      planetMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track hover via ref for animation loop
  const hoveredRef = useRef<string | null>(null);
  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  // ---------- Audio: select sound ----------
  function ensureAudio() {
    if (!audioCtxRef.current) {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }
  function playSelectSound() {
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  }

  // ---------- Ambient pad ----------
  useEffect(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ambient) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2);
      gain.connect(ctx.destination);
      const freqs = [110, 165, 220, 277];
      const oscs = freqs.map((f) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 0.08 + Math.random() * 0.1;
        lfoG.gain.value = 1.5;
        lfo.connect(lfoG).connect(o.frequency);
        lfo.start();
        o.connect(gain);
        o.start();
        return o;
      });
      ambientGainRef.current = gain;
      ambientOscRef.current = oscs;
      return () => {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(() => {
          oscs.forEach((o) => { try { o.stop(); } catch { /* ignore */ } });
          gain.disconnect();
        }, 700);
      };
    }
  }, [ambient]);

  // ---------- Narration + typewriter ----------
  const info = PLANET_INFO[selected];
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const text = info.narration;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [selected, info.narration]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    if (!narrate) return;
    const u = new SpeechSynthesisUtterance(info.narration + " " + info.fact);
    u.rate = 0.98; u.pitch = 1.02;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    return () => { window.speechSynthesis.cancel(); };
  }, [selected, narrate, info.narration, info.fact]);

  // Reset camera distance when picking a planet (focus mode) or fit-all in overview
  useEffect(() => {
    if (overview) {
      const cam = cameraRef.current;
      const aspect = cam ? cam.aspect : 1;
      focusDistRef.current = computeOverviewDist(50, aspect);
      return;
    }
    const def = DEFS.find((d) => d.name === selected);
    if (!def) return;
    focusDistRef.current = Math.max(8, def.size * 6 + 8);
  }, [selected, overview]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title="Solar System Explorer" sub="Tap a planet to focus · Drag to orbit · Pinch / scroll to zoom · Use ⤢ to view all" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="relative overflow-hidden p-0">
          <div ref={mountRef} className="h-[68vh] min-h-[420px] w-full sm:h-[72vh] sm:min-h-[520px] lg:h-[78vh]" />

          {/* Floating planet label */}
          <AnimatePresence>
            {labelPos.visible && (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full border border-[color:var(--neon)]/60 bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--neon-cyan)] backdrop-blur"
                style={{ left: labelPos.x, top: labelPos.y, textShadow: "0 0 12px oklch(0.85 0.18 230 / 0.8)" }}
              >
                {selected}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay controls */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => setOverview(true)}
              className={`grid size-9 place-items-center rounded-lg border bg-black/40 backdrop-blur hover:bg-white/10 ${overview ? "border-[color:var(--neon)]" : "border-border"}`}
              aria-label="Show entire solar system"
              title="View all"
            >
              <Maximize2 className={`size-4 ${overview ? "text-[color:var(--neon-cyan)]" : "text-muted-foreground"}`} />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-black/40 backdrop-blur hover:bg-white/10"
              aria-label={paused ? "Resume orbits" : "Pause orbits"}
              title={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="size-4 text-[color:var(--neon-cyan)]" /> : <Pause className="size-4 text-[color:var(--neon-cyan)]" />}
            </button>
            <button
              onClick={() => setAmbient((a) => !a)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-black/40 backdrop-blur hover:bg-white/10"
              aria-label="Toggle ambient music"
              title="Ambient music"
            >
              {ambient ? <Music className="size-4 text-[color:var(--neon-cyan)]" /> : <Music2 className="size-4 text-muted-foreground" />}
            </button>
            <button
              onClick={() => { setNarrate((n) => !n); if (narrate) stopSpeaking(); }}
              className="grid size-9 place-items-center rounded-lg border border-border bg-black/40 backdrop-blur hover:bg-white/10"
              aria-label="Toggle narration"
              title="Narration"
            >
              {narrate ? <Volume2 className="size-4 text-[color:var(--neon-cyan)]" /> : <VolumeX className="size-4 text-muted-foreground" />}
            </button>
          </div>

          {/* ZENI typewriter overlay */}
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md">
            <div className="glass-strong rounded-xl border border-[color:var(--neon)]/30 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">
                <span className={`size-1.5 rounded-full ${speaking ? "bg-[color:var(--neon-cyan)] animate-pulse" : "bg-muted-foreground/50"}`} />
                ZENI · {speaking ? "Transmitting" : "Standby"}
              </div>
              <p className="text-foreground/90">
                {typed}
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[color:var(--neon-cyan)] align-middle" />
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <GlassCard>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-cyan)]">Selected Body</div>
                <h3 className="font-display text-3xl font-black neon-text">{selected}</h3>
                <p className="mt-2 text-sm text-foreground/80">{info.description}</p>

                <dl className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
                  <Row k="Mass" v={info.mass} />
                  <Row k="Diameter" v={info.diameter} />
                  <Row k="Gravity" v={info.gravity} />
                  <Row k="Temperature" v={info.temperature} />
                  <Row k="Day" v={info.day} />
                  <Row k="Distance from Sun" v={info.distance} />
                  <Row k="Moons" v={String(info.moons)} />
                  <Row k="Atmosphere" v={info.atmosphere} />
                </dl>

                <div className="mt-4 rounded-lg border border-[color:var(--neon)]/30 bg-[color:var(--neon)]/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--neon-cyan)]">Did You Know</div>
                  <p className="mt-1 text-sm text-foreground/90">{info.fact}</p>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          <GlassCard>
            <h3 className="font-display text-base font-bold">Quick Travel</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DEFS.map((d) => (
                <motion.button
                  key={d.name}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelected(d.name); setOverview(false); playSelectSound(); }}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                    selected === d.name
                      ? "border-[color:var(--neon)] bg-white/10 text-[color:var(--neon-cyan)] shadow-[0_0_18px_oklch(0.7_0.2_230/0.4)]"
                      : "border-border bg-white/[0.03] hover:bg-white/5"
                  }`}
                >
                  {d.name}
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-white/5 p-2"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{k}</div>
      <div className="truncate font-medium">{v}</div>
    </motion.div>
  );
}
