// Lightweight celestial helpers — no external deps.
// Deterministic alt/az approximations good enough for a UI sky map.

export type SatCategory =
  | "Communication"
  | "Navigation"
  | "Weather"
  | "Scientific"
  | "Military"
  | "Space Stations"
  | "Other";

export const SAT_CATEGORIES: SatCategory[] = [
  "Communication",
  "Navigation",
  "Weather",
  "Scientific",
  "Military",
  "Space Stations",
];

export function categorizeSatellite(name: string): SatCategory {
  const n = name.toUpperCase();
  if (/ISS|TIANGONG|ZARYA|CSS/.test(n)) return "Space Stations";
  if (/STARLINK|IRIDIUM|ONEWEB|INTELSAT|INMARSAT|GLOBALSTAR|TELSTAR|SES|EUTELSAT|VIASAT/.test(n))
    return "Communication";
  if (/GPS|NAVSTAR|GALILEO|GLONASS|BEIDOU|QZS|IRNSS/.test(n)) return "Navigation";
  if (/NOAA|GOES|METEOSAT|HIMAWARI|FENGYUN|METOP|DMSP|JPSS/.test(n)) return "Weather";
  if (/HUBBLE|LANDSAT|TERRA|AQUA|SENTINEL|SWOT|ICESAT|MODIS|JWST|CHEOPS/.test(n))
    return "Scientific";
  if (/USA |COSMOS|NROL|MILSTAR|DSP |SBIRS|KH-|LACROSSE|MERIDIAN/.test(n)) return "Military";
  return "Other";
}

export const CATEGORY_COLOR: Record<SatCategory, string> = {
  Communication: "oklch(0.85 0.18 200)",
  Navigation: "oklch(0.78 0.22 260)",
  Weather: "oklch(0.82 0.18 160)",
  Scientific: "oklch(0.78 0.2 320)",
  Military: "oklch(0.7 0.22 30)",
  "Space Stations": "oklch(0.88 0.2 90)",
  Other: "oklch(0.7 0.05 250)",
};

// --- Sky / celestial objects -----------------------------------------------

export type CelestialKind = "Planet" | "Star" | "Constellation" | "ISS" | "DeepSky";

export type CelestialObject = {
  id: string;
  name: string;
  kind: CelestialKind;
  // Right ascension (hours), Declination (degrees) — simplified J2000.
  ra: number;
  dec: number;
  magnitude?: number;
  description?: string;
};

// Small handpicked catalog — enough for a beautiful UI.
export const CELESTIAL_CATALOG: CelestialObject[] = [
  // Planets — approximate mean RA/Dec for visualization; not for ephemeris.
  { id: "venus", name: "Venus", kind: "Planet", ra: 22.5, dec: -10, magnitude: -4.2, description: "Brilliant evening star" },
  { id: "mars", name: "Mars", kind: "Planet", ra: 6.2, dec: 22, magnitude: 0.4, description: "Reddish, steady glow" },
  { id: "jupiter", name: "Jupiter", kind: "Planet", ra: 3.1, dec: 16, magnitude: -2.5, description: "King of planets" },
  { id: "saturn", name: "Saturn", kind: "Planet", ra: 23.0, dec: -8, magnitude: 0.7, description: "Ringed jewel" },
  { id: "mercury", name: "Mercury", kind: "Planet", ra: 20.0, dec: -20, magnitude: 0.2, description: "Elusive innermost world" },
  // Bright stars
  { id: "sirius", name: "Sirius", kind: "Star", ra: 6.75, dec: -16.7, magnitude: -1.46, description: "Brightest star" },
  { id: "canopus", name: "Canopus", kind: "Star", ra: 6.4, dec: -52.7, magnitude: -0.74 },
  { id: "arcturus", name: "Arcturus", kind: "Star", ra: 14.26, dec: 19.2, magnitude: -0.05 },
  { id: "vega", name: "Vega", kind: "Star", ra: 18.62, dec: 38.78, magnitude: 0.03 },
  { id: "capella", name: "Capella", kind: "Star", ra: 5.28, dec: 45.99, magnitude: 0.08 },
  { id: "rigel", name: "Rigel", kind: "Star", ra: 5.24, dec: -8.2, magnitude: 0.13 },
  { id: "betelgeuse", name: "Betelgeuse", kind: "Star", ra: 5.92, dec: 7.41, magnitude: 0.5 },
  { id: "altair", name: "Altair", kind: "Star", ra: 19.85, dec: 8.87, magnitude: 0.77 },
  { id: "deneb", name: "Deneb", kind: "Star", ra: 20.69, dec: 45.28, magnitude: 1.25 },
  // Constellations (representative center point)
  { id: "orion", name: "Orion", kind: "Constellation", ra: 5.5, dec: 0, description: "The Hunter" },
  { id: "ursa-major", name: "Ursa Major", kind: "Constellation", ra: 11, dec: 55, description: "The Great Bear" },
  { id: "cassiopeia", name: "Cassiopeia", kind: "Constellation", ra: 1, dec: 60, description: "The Queen" },
  { id: "scorpius", name: "Scorpius", kind: "Constellation", ra: 16.5, dec: -30, description: "The Scorpion" },
  { id: "lyra", name: "Lyra", kind: "Constellation", ra: 18.8, dec: 36, description: "The Lyre" },
  { id: "cygnus", name: "Cygnus", kind: "Constellation", ra: 20.5, dec: 42, description: "The Swan" },
  // Deep sky
  { id: "m31", name: "Andromeda Galaxy", kind: "DeepSky", ra: 0.71, dec: 41.27, magnitude: 3.4, description: "Nearest large galaxy" },
  { id: "m42", name: "Orion Nebula", kind: "DeepSky", ra: 5.59, dec: -5.39, magnitude: 4.0, description: "Stellar nursery" },
  { id: "m45", name: "Pleiades", kind: "DeepSky", ra: 3.79, dec: 24.1, magnitude: 1.6, description: "Seven Sisters cluster" },
  { id: "m13", name: "Hercules Cluster", kind: "DeepSky", ra: 16.7, dec: 36.46, magnitude: 5.8 },
];

// Constellation line patterns drawn on a normalized 100x60 canvas.
export type ConstellationPattern = {
  id: string;
  name: string;
  stars: [number, number][];
  lines: [number, number][];
};

export const CONSTELLATION_PATTERNS: ConstellationPattern[] = [
  {
    id: "orion",
    name: "Orion",
    stars: [
      [20, 10], [80, 14], [38, 28], [62, 30], [50, 32],
      [42, 32], [58, 32], [30, 52], [70, 50],
    ],
    lines: [
      [0, 2], [1, 3], [2, 4], [3, 4], [5, 4], [6, 4],
      [2, 7], [3, 8], [5, 7], [6, 8],
    ],
  },
  {
    id: "ursa-major",
    name: "Ursa Major",
    stars: [
      [10, 30], [22, 28], [34, 26], [46, 28], [56, 22], [70, 18], [84, 24],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    stars: [[10, 35], [28, 18], [50, 30], [72, 14], [90, 32]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: "scorpius",
    name: "Scorpius",
    stars: [
      [10, 18], [22, 22], [34, 24], [46, 30], [56, 40], [62, 50], [54, 56], [42, 54], [30, 50],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  {
    id: "lyra",
    name: "Lyra",
    stars: [[50, 10], [40, 26], [60, 26], [44, 48], [58, 48]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]],
  },
  {
    id: "cygnus",
    name: "Cygnus",
    stars: [[50, 10], [50, 30], [50, 52], [22, 30], [78, 30]],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
];

// --- Coordinate conversion -------------------------------------------------
// Approximate Greenwich Mean Sidereal Time (hours).
function gmstHours(date: Date): number {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const D = JD - 2451545.0;
  let gmst = 18.697374558 + 24.06570982441908 * D;
  gmst = ((gmst % 24) + 24) % 24;
  return gmst;
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

function rad2deg(r: number) {
  return (r * 180) / Math.PI;
}

// Convert RA(h)/Dec(deg) → altitude/azimuth (deg) at lat/lon and date.
export function raDecToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date,
): { alt: number; az: number } {
  const gmst = gmstHours(date);
  const lst = ((gmst + lonDeg / 15) % 24 + 24) % 24;
  const haDeg = (lst - raHours) * 15;
  const ha = deg2rad(haDeg);
  const dec = deg2rad(decDeg);
  const lat = deg2rad(latDeg);
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
  return { alt: rad2deg(alt), az: rad2deg(az) };
}

export function compassDirection(az: number): "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  const idx = Math.round((((az % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
}

export function bestViewingTime(
  obj: CelestialObject,
  lat: number,
  lon: number,
  base = new Date(),
): string {
  let best = -90;
  let bestDate = new Date(base);
  for (let h = 0; h < 24; h++) {
    const d = new Date(base);
    d.setHours(base.getHours() + h, 0, 0, 0);
    const { alt } = raDecToAltAz(obj.ra, obj.dec, lat, lon, d);
    if (alt > best) {
      best = alt;
      bestDate = d;
    }
  }
  return bestDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
