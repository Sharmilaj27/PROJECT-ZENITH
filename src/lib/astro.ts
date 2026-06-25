/**
 * Astronomy + observation helpers (browser-safe, no deps).
 * Approximations sufficient for visibility/observability UI.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export interface Eq { ra: number; dec: number } // radians
export interface Horiz { az: number; alt: number } // degrees

export function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function gmstHours(date: Date): number {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15;
}

export function eqToHoriz(eq: Eq, latDeg: number, lonDeg: number, date: Date): Horiz {
  const gmst = gmstHours(date);
  const lst = (gmst + lonDeg / 15) * 15 * DEG;
  const H = lst - eq.ra;
  const lat = latDeg * DEG;
  const sinAlt = Math.sin(eq.dec) * Math.sin(lat) + Math.cos(eq.dec) * Math.cos(lat) * Math.cos(H);
  const alt = Math.asin(sinAlt);
  const cosA = (Math.sin(eq.dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  if (Math.sin(H) > 0) A = 2 * Math.PI - A;
  return { az: ((A * RAD) % 360 + 360) % 360, alt: alt * RAD };
}

export function compassDir(az: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(az / 22.5) % 16];
}

function planetPos(name: string, jd: number): { x: number; y: number; z: number } {
  const T = (jd - 2451545.0) / 36525;
  type El = { a: number; e: number; i: number; O: number; w: number; L: number };
  const elements: Record<string, El> = {
    Mercury: { a: 0.38709927, e: 0.20563593, i: 7.00497902, O: 48.33076593, w: 77.45779628, L: 252.25032350 + 149472.67411175 * T },
    Venus:   { a: 0.72333566, e: 0.00677672, i: 3.39467605, O: 76.67984255, w: 131.60246718, L: 181.97909950 + 58517.81538729 * T },
    Earth:   { a: 1.00000261, e: 0.01671123, i: -0.00001531, O: 0.0,        w: 102.93768193, L: 100.46457166 + 35999.37244981 * T },
    Mars:    { a: 1.52371034, e: 0.09339410, i: 1.84969142, O: 49.55953891, w: 336.04084030, L: -4.55343205 + 19140.30268499 * T },
    Jupiter: { a: 5.20288700, e: 0.04838624, i: 1.30439695, O: 100.47390909, w: 14.72847983, L: 34.39644051 + 3034.74612775 * T },
    Saturn:  { a: 9.53667594, e: 0.05386179, i: 2.48599187, O: 113.66242448, w: 92.59887831, L: 49.95424423 + 1222.49362201 * T },
    Uranus:  { a: 19.18916464, e: 0.04725744, i: 0.77263783, O: 74.01692503, w: 170.95427630, L: 313.23810451 + 428.48202785 * T },
    Neptune: { a: 30.06992276, e: 0.00859048, i: 1.77004347, O: 131.78422574, w: 44.96476227, L: -55.12002969 + 218.45945325 * T },
  };
  const e = elements[name];
  const M = ((e.L - e.w) % 360 + 360) % 360 * DEG;
  let E = M;
  for (let k = 0; k < 6; k++) E = E - (E - e.e * Math.sin(E) - M) / (1 - e.e * Math.cos(E));
  const xv = e.a * (Math.cos(E) - e.e);
  const yv = e.a * Math.sqrt(1 - e.e * e.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const O = e.O * DEG, w = (e.w - e.O) * DEG, i = e.i * DEG;
  const x = r * (Math.cos(O) * Math.cos(v + w) - Math.sin(O) * Math.sin(v + w) * Math.cos(i));
  const y = r * (Math.sin(O) * Math.cos(v + w) + Math.cos(O) * Math.sin(v + w) * Math.cos(i));
  const z = r * (Math.sin(v + w) * Math.sin(i));
  return { x, y, z };
}

export function planetRaDec(name: string, date: Date): Eq {
  const jd = julianDate(date);
  const earth = planetPos("Earth", jd);
  const planet = planetPos(name, jd);
  const dx = planet.x - earth.x;
  const dy = planet.y - earth.y;
  const dz = planet.z - earth.z;
  const eps = 23.4393 * DEG;
  const xe = dx;
  const ye = dy * Math.cos(eps) - dz * Math.sin(eps);
  const ze = dy * Math.sin(eps) + dz * Math.cos(eps);
  const ra = Math.atan2(ye, xe);
  const dec = Math.atan2(ze, Math.hypot(xe, ye));
  return { ra: (ra + 2 * Math.PI) % (2 * Math.PI), dec };
}

export function riseSet(eq: Eq, lat: number, lon: number, date: Date): { rise: string; set: string } {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  let prev = eqToHoriz(eq, lat, lon, base).alt;
  let rise = "—", set = "—";
  for (let m = 5; m <= 24 * 60; m += 5) {
    const t = new Date(base.getTime() + m * 60000);
    const alt = eqToHoriz(eq, lat, lon, t).alt;
    if (prev < 0 && alt >= 0 && rise === "—") rise = fmt(t);
    if (prev >= 0 && alt < 0 && set === "—") set = fmt(t);
    prev = alt;
  }
  return { rise, set };
}

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
