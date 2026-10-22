export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function valueNoise(x: number, y: number, scale: number, seed: number): number {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function fbm(x: number, y: number, scale: number, seed: number, octaves = 3): number {
  let amp = 1;
  let sum = 0;
  let norm = 0;
  let s = scale;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x, y, s, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    s = Math.max(1, s / 2);
  }
  return sum / norm;
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER8 = (() => {
  const m: number[][] = [];
  for (let y = 0; y < 8; y++) {
    m.push([]);
    for (let x = 0; x < 8; x++) {
      const b4 = BAYER4[y % 4]![x % 4]!;
      const quad = (y < 4 ? 0 : 2) + (x < 4 ? 0 : 1);
      m[y]!.push(b4 * 4 + [0, 2, 3, 1][quad]!);
    }
  }
  return m;
})();

export function bayer(x: number, y: number, size: 4 | 8 = 4): number {
  if (size === 4) return (BAYER4[y & 3]![x & 3]! + 0.5) / 16;
  return (BAYER8[y & 7]![x & 7]! + 0.5) / 64;
}
