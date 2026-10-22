import type { Art } from './art_common';
import { hash2, Px, ramp, rng, type Col } from './px';

export function snowMound(w: number, h: number, seed: number): Px {
  const p = new Px(w, h);
  const R = ramp('#dce6f6');
  p.ellipse(w / 2, h - 3, w / 2 - 1, 3, '#7d90b8', 0.45);
  p.ellipseF(w / 2, h * 0.58, w / 2 - 1, h * 0.42, (nx, ny) => [ny < -0.35 ? '#ffffff' : nx > 0.35 ? R[1] : ny > 0.35 ? R[1] : R[3]]);
  for (let i = 0; i < w * 0.7; i++) {
    const x = Math.floor(hash2(i, 1, seed) * w), y = Math.floor(h * 0.25 + hash2(i, 2, seed) * h * 0.5);
    if (p.alpha(x, y) > 0) p.set(x, y, hash2(i, 3, seed) < 0.5 ? '#ffffff' : '#c3d2ec');
  }
  return p;
}

export function sage(seed: number, dry = '#8a8a52'): Px {
  const p = new Px(26, 16), r = rng(seed), R = ramp(dry);
  p.ellipse(13, 13, 11, 2.6, '#000000', 0.25);
  for (let i = 0; i < 9; i++) {
    const cx = 5 + r() * 16, cy = 5 + r() * 6, rr = 3 + r() * 3;
    p.ellipseF(cx, cy, rr, rr * 0.8, (nx, ny) => [ny < -0.2 ? R[3] : nx > 0.3 ? R[1] : R[2]]);
  }
  for (let i = 0; i < 20; i++) p.set(4 + r() * 18, 3 + r() * 9, r() < 0.5 ? R[4] : R[0]);
  p.outline(0, '#2c2812', 140);
  return p;
}

export function rocks(seed: number, base = '#8a7e6c'): Px {
  const p = new Px(28, 16), r = rng(seed), R = ramp(base);
  p.ellipse(14, 13, 12, 2.6, '#000000', 0.28);
  for (let i = 0; i < 4; i++) {
    const cx = 6 + r() * 16, cy = 6 + r() * 5, rr = 3 + r() * 3.4;
    p.ellipseF(cx, cy, rr, rr * 0.75, (nx, ny) => [ny < -0.25 ? R[4] : nx > 0.35 ? R[1] : nx < -0.4 ? R[3] : R[2]]);
  }
  p.outline(0, '#1c1814', 170);
  return p;
}

export function streetLantern(h = 44, snow = false): Art {
  const w = 20;
  const p = new Px(w, h), e = new Px(w, h);
  p.ellipse(w / 2, h - 2, 6, 1.8, '#000000', 0.35);
  for (let y = 12; y < h - 2; y++) {
    p.set(9, y, '#3a2a20');
    p.set(10, y, '#6a4c34');
    p.set(11, y, '#4a3626');
  }
  p.rect(7, h - 5, 6, 3, '#4a3626');
  p.rect(6, 4, 8, 9, '#2a2018');
  p.rect(7, 5, 6, 7, '#ffcf70');
  p.hl(5, 3, 10, '#4a3626');
  p.hl(7, 2, 6, '#2a2018');
  p.hl(9, 1, 2, '#2a2018');
  if (snow) p.hl(6, 2, 8, '#f4f8ff');
  p.outline(0, '#140c08', 200);
  e.rect(7, 5, 6, 7, '#ffd890');
  e.rect(8, 6, 4, 5, '#fff2c8');
  return { p, e };
}

export function beaconPole(h = 56): Art {
  const w = 14;
  const p = new Px(w, h), e = new Px(w, h);
  p.ellipse(w / 2, h - 2, 5, 1.6, '#000000', 0.3);
  for (let y = 6; y < h - 2; y++) {
    p.set(6, y, '#3a3e46');
    p.set(7, y, '#7a808c');
  }
  p.rect(4, 2, 6, 5, '#2c3038');
  p.rect(5, 3, 4, 3, '#ff5a40');
  p.outline(0, '#0c0e12', 200);
  e.rect(5, 3, 4, 3, '#ff8a70');
  e.set(6, 4, '#ffffff');
  return { p, e };
}

export function icePatch(w: number, h: number, seed: number): Px {
  const p = new Px(w, h);
  p.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, '#9fb8dc', 0.9);
  p.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 2, '#c4d8f2', 0.9);
  for (let i = 0; i < 12; i++) {
    const x = hash2(i, 1, seed) * (w - 6) + 3, y = hash2(i, 2, seed) * (h - 4) + 2;
    p.line(x, y, x + 3, y - 1, '#ffffff', 0.8);
  }
  return p;
}

export function wheelRut(w: number, col: Col = '#6a5a40', a = 0.35): Px {
  const p = new Px(w, 6);
  for (let x = 0; x < w; x++) {
    const y = 1 + Math.sin(x / 9) * 0.6;
    p.set(x, y + 0, col, a);
    p.set(x, y + 3, col, a);
    if (hash2(x, 1, 5) < 0.2) p.set(x, y + 1.5, col, a * 0.5);
  }
  return p;
}

export function weeds(seed: number, col = '#b89c4c'): Px {
  const p = new Px(14, 12), r = rng(seed), R = ramp(col);
  for (let i = 0; i < 9; i++) {
    const x = 2 + r() * 10, len = 4 + r() * 6;
    p.line(x, 11, x + (r() - 0.5) * 5, 11 - len, r() < 0.5 ? R[3] : R[1]);
  }
  return p;
}
