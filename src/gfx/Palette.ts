export type Packed = number;

export function parseColor(c: string | number): Packed {
  if (typeof c === 'number') return c >>> 0;
  let h = c.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (h.length === 4) h = h.split('').map((x) => x + x).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return pack(r, g, b, a);
}

export function pack(r: number, g: number, b: number, a = 255): Packed {
  return (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
}

export function unpack(c: Packed): [number, number, number, number] {
  return [c & 255, (c >>> 8) & 255, (c >>> 16) & 255, (c >>> 24) & 255];
}

export function toHex(c: Packed): string {
  const [r, g, b] = unpack(c);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function lerpColor(a: Packed, b: Packed, t: number): Packed {
  const [ar, ag, ab, aa] = unpack(a);
  const [br, bg, bb, ba] = unpack(b);
  return pack(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t, aa + (ba - aa) * t);
}

export function shade(c: string | number, amount: number): string {
  const p = parseColor(c);
  const target = amount >= 0 ? pack(255, 255, 255) : pack(0, 0, 0);
  return toHex(lerpColor(p, target, Math.abs(amount)));
}

export function ramp(base: string, steps = 4): string[] {
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    out.push(shade(base, -0.45 + t * 0.7));
  }
  return out;
}

export interface Ramp {
  shadow: string;
  base: string;
  light: string;
  high: string;
}

export function makeRamp(base: string): Ramp {
  return { shadow: shade(base, -0.38), base, light: shade(base, 0.18), high: shade(base, 0.4) };
}

export const OUTLINE = '#14101f';

export const PAL = {
  archive: { bg: '#0d0b1e', bg2: '#1a1438', cyan: '#5fe3ff', violet: '#8a5cff', gold: '#ffd36b', floor: '#2a2150' },
  nov: {
    skyTop: '#9fb8d8', skyBot: '#e8f1ff', snow: '#e8f1ff', snowShade: '#bcd0ea', shadow: '#6d7fa5',
    wood: '#7a5232', woodDark: '#5a3b25', window: '#ffb347', fire: '#ff7a2f', smoke: '#cfd8e6',
  },
  len: {
    bg: '#151b26', bg2: '#232d3d', stone: '#4a5568', stone2: '#6c7a8c', stove: '#e8893a', candle: '#ffcf70', breath: '#e8eef5',
  },
  baik: {
    steppe: '#c9a15b', steppeDark: '#a8803d', skyTop: '#6fa8d8', skyBot: '#f2e6c4', concrete: '#8d8f94',
    panelG: '#7dffb0', panelY: '#ffd23f', dust: '#d9c29a',
  },
  core: { bg: '#05040a', light: '#fff4cf', gold: '#d9b24c' },
} as const;
