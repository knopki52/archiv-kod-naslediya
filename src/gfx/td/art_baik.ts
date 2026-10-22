import type { Art } from './art_common';
import { bayer, castShadow, distToSeg, fbm, hash2, mix, Px, ramp, rng, sh, type Col, type Ramp } from './px';

function cylShade(l: number): number {
  return l > 0.88 ? 4 : l > 0.62 ? 3 : l > 0.3 ? 2 : l > 0.12 ? 1 : 0;
}
export function cyl(p: Px, x0: number, y0: number, w: number, h: number, base: string, lightRight = true): void {
  const R = ramp(base);
  for (let x = 0; x < w; x++) {
    const t = w > 1 ? x / (w - 1) : 0.5;
    p.vl(x0 + x, y0, h, R[cylShade(lightRight ? t : 1 - t)]);
  }
}
function cylRow(p: Px, xl: number, xr: number, y: number, R: Ramp, frost = 0, seed = 0): void {
  const w = xr - xl;
  for (let x = Math.round(xl); x < xr; x++) {
    const t = (x - xl) / Math.max(1, w - 1);
    let c: Col = R[cylShade(t)];
    if (frost && hash2(x, y, seed) < frost) c = mix(c, '#f4fbff', 0.75);
    p.set(x, y, c);
  }
}

export function rocket(): Art & { bot: number } {
  const w = 96, h = 262, p = new Px(w, h), e = new Px(w, h);
  const cx = 48, bot = h - 18;
  const WH = ramp('#e4e2dc'), GR = ramp('#a8a8a6'), DK = '#4a4c56';
  for (let y = 118; y < bot; y++) {
    const t = Math.min(1, (y - 118) / 80), half = 2 + t * 7;
    for (const s of [-1, 1]) {
      const bcx = cx + s * (8 + t * 9);
      cylRow(p, bcx - half, bcx + half, y, ramp('#9a9a98'));
    }
  }
  for (let y = 70; y < bot; y++) {
    let half = 9;
    if (y < 98) half = 7 + ((y - 70) / 28) * 2;
    if (y > bot - 30) half = 9 - ((y - (bot - 30)) / 30) * 1.5;
    cylRow(p, cx - half, cx + half, y, WH, y > 74 && y < 132 ? 0.32 : 0, 3);
  }
  for (let y = 100; y < bot - 6; y++) {
    p.set(cx + 4, y, GR[1]);
    p.set(cx + 5, y, WH[3]);
  }
  for (const y of [98, 132, 160, bot - 30]) {
    p.hl(cx - 9, y, 18, DK);
    p.hl(cx - 9, y + 1, 18, '#8a8c96');
  }
  for (let y = 62; y < 70; y++)
    for (let x = cx - 7; x < cx + 7; x++) {
      const k = (x - cx + 7 + (y - 62)) % 4;
      if (k === 0 || (x - cx + 7 - (y - 62) + 16) % 4 === 0) p.set(x, y, '#3a3c44');
    }
  p.hl(cx - 7, 62, 14, '#6a6c74');
  p.hl(cx - 7, 69, 14, '#6a6c74');
  for (let y = 36; y < 62; y++) cylRow(p, cx - 7, cx + 7, y, WH, y > 44 && y < 58 ? 0.25 : 0, 5);
  p.hl(cx - 7, 44, 14, DK);
  p.hl(cx - 7, 58, 14, DK);
  for (let y = 0; y < 36; y++) {
    const t = y / 22, half = y < 22 ? Math.max(0.6, Math.sin(Math.min(1, t) * Math.PI / 2) * 7) : 7;
    cylRow(p, cx - half, cx + half, y, ramp('#ecebe6'));
  }
  p.vl(cx, 0, 4, '#7a7c84');
  p.rect(cx - 2, 24, 3, 3, '#3a4458');
  p.set(cx - 1, 24, '#9ab4d8');
  p.hl(cx - 7, 30, 14, '#8a8c96');
  const B = (side: number) => {
    for (let y = 108; y < bot; y++) {
      const t = Math.min(1, (y - 108) / 86);
      const half = 1 + Math.pow(t, 0.8) * 8.5;
      const bcx = cx + side * (9 + Math.pow(t, 0.9) * 17);
      cylRow(p, bcx - half, bcx + half, y, WH, y > 114 && y < 168 ? 0.3 : 0, side > 0 ? 7 : 8);
    }
    const bcx = cx + side * 26;
    for (const y of [168, 200, bot - 24]) {
      p.hl(bcx - 9, y, 18, DK);
      p.hl(bcx - 9, y + 1, 18, '#8a8c96');
    }
    p.poly([[bcx + side * 8, bot - 18], [bcx + side * 15, bot - 4], [bcx + side * 8, bot - 2]], GR[2]);
    p.line(bcx + side * 8, bot - 18, bcx + side * 15, bot - 4, GR[4]);
    for (const k of [-5, 0, 5]) {
      p.rect(bcx + k - 2, bot, 4, 6, '#2e2e34');
      p.hl(bcx + k - 3, bot + 5, 6, '#5a5a62');
    }
  };
  B(-1);
  B(1);
  for (const k of [-4, 0, 4]) {
    p.rect(cx + k - 2, bot, 4, 7, '#2e2e34');
    p.hl(cx + k - 3, bot + 6, 6, '#5a5a62');
  }
  p.rect(cx - 3, 104, 2, 10, '#b8363a');
  p.rect(cx + 1, 104, 2, 10, '#2e4a8a');
  p.rect(cx - 30, 176, 2, 8, '#b8363a');
  p.rect(cx + 28, 176, 2, 8, '#b8363a');
  p.outline(0, '#2a2a30');
  return { p, e, bot };
}

export function latticeBeam(p: Px, x0: number, y0: number, x1: number, y1: number, th: number, base = '#5a5448'): void {
  const M = ramp(base);
  const len = Math.hypot(x1 - x0, y1 - y0), nx = (-(y1 - y0) / len) * th / 2, ny = ((x1 - x0) / len) * th / 2;
  p.line(x0 + nx, y0 + ny, x1 + nx, y1 + ny, M[3]);
  p.line(x0 - nx, y0 - ny, x1 - nx, y1 - ny, M[1]);
  const step = th * 1.2;
  for (let i = 0; i + step <= len; i += step) {
    const a = i / len, b = (i + step) / len;
    const ax = x0 + (x1 - x0) * a, ay = y0 + (y1 - y0) * a, bx = x0 + (x1 - x0) * b, by = y0 + (y1 - y0) * b;
    p.line(ax + nx, ay + ny, bx - nx, by - ny, M[2]);
    p.line(ax - nx, ay - ny, ax + nx, ay + ny, M[0]);
  }
}

export function lattice(w: number, h: number, base = '#5a5448', platforms: number[] = []): Px {
  const p = new Px(w + 8, h), M = ramp(base);
  const o = 4;
  p.vl(o, 0, h, M[3]);
  p.vl(o + 1, 0, h, M[2]);
  p.vl(o + w - 2, 0, h, M[1]);
  p.vl(o + w - 1, 0, h, M[0]);
  for (let y = 0; y < h; y += w) {
    p.hl(o, y, w, M[2]);
    p.line(o + 1, y, o + w - 2, y + w, M[1]);
    p.line(o + w - 2, y, o + 1, y + w, M[0]);
  }
  for (const py of platforms) {
    p.rect(0, py, w + 8, 3, M[3]);
    p.hl(0, py, w + 8, M[4]);
    p.hl(0, py - 4, w + 8, M[1]);
    for (let x = 0; x < w + 8; x += 3) p.vl(x, py - 4, 4, M[1]);
  }
  p.outline(0, '#1e1c18');
  return p;
}

export function floodTower(h: number): Art {
  const p = new Px(34, h), e = new Px(34, h);
  p.blit(lattice(10, h - 20, '#5a5650'), 8, 20);
  p.rect(1, 2, 32, 16, '#3a3a40');
  p.hl(1, 2, 32, '#6a6a72');
  p.rect(3, 4, 28, 12, '#1a1a20');
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const x = 4 + c * 7, y = 5 + r * 6;
      p.rect(x, y, 5, 4, '#e8e4d0');
      e.rect(x, y, 5, 4, '#fff6dc', 0.9);
      e.set(x + 1, y + 1, '#ffffff');
    }
  p.outline(0, '#18181c');
  return { p, e };
}

export function tanker(): Px {
  const p = new Px(78, 40), G = ramp('#4e5a46');
  const R = ramp('#c8ccd0');
  for (let y = 4; y < 24; y++) {
    const t = (y - 4) / 19;
    p.hl(4, y, 50, R[[3, 4, 3, 2, 2, 2, 1, 1, 0][Math.floor(t * 8.99)]!]);
  }
  p.ellipseF(4, 14, 4, 10, (nx) => [nx < 0 ? '#9aa0a6' : '#c8ccd0']);
  p.ellipseF(54, 14, 3, 10, () => ['#e8ecf0']);
  for (const x of [18, 36]) p.vl(x, 4, 20, '#6a7078');
  p.rect(26, 1, 8, 3, '#8a9098');
  p.hl(4, 8, 50, '#ffffff');
  p.rect(2, 24, 56, 6, '#2a2a2e');
  p.rect(58, 6, 18, 12, G[3]);
  p.hl(58, 6, 18, G[4]);
  p.rect(58, 18, 20, 12, G[2]);
  p.rect(60, 19, 14, 5, '#2a3440');
  p.hl(60, 19, 14, '#7a9ab8');
  for (const x of [8, 22, 40, 64]) {
    p.ellipse(x + 4, 33, 5, 4.6, '#18181c');
    p.ellipse(x + 4, 33, 2, 2, '#5a5a60');
  }
  p.outline(0, '#18181a');
  return p;
}
export function bus(): Px {
  const p = new Px(70, 38);
  const BL = ramp('#4a6a9a'), CR = ramp('#e8dcc0');
  p.rect(2, 4, 66, 14, CR[3]);
  p.hl(4, 3, 62, CR[4]);
  p.rect(0, 18, 70, 6, CR[2]);
  for (let x = 6; x < 64; x += 11) {
    p.rect(x, 18, 8, 5, '#2a3440');
    p.hl(x, 18, 8, '#8aa8c8');
  }
  p.rect(0, 24, 70, 8, BL[2]);
  p.hl(0, 24, 70, BL[3]);
  p.hl(0, 31, 70, BL[0]);
  p.rect(62, 18, 8, 14, BL[2]);
  p.rect(63, 19, 6, 6, '#2a3440');
  p.rect(64, 27, 4, 2, '#fff4c8');
  for (const x of [10, 54]) {
    p.ellipse(x, 32, 5, 4.6, '#18181c');
    p.ellipse(x, 32, 2, 2, '#5a5a60');
  }
  p.outline(0, '#18181a');
  return p;
}
export function oldTruck(): Px {
  const p = new Px(64, 40), G = ramp('#5a6a48'), D = ramp('#3a3c36');
  p.rect(0, 6, 40, 20, G[2]);
  p.hl(0, 6, 40, G[4]);
  p.rect(2, 8, 36, 14, G[1]);
  for (let x = 4; x < 38; x += 6) p.vl(x, 8, 14, G[0]);
  p.rect(5, 9, 10, 8, '#8a6a3a');
  p.hl(5, 9, 10, '#b08a50');
  p.line(5, 9, 15, 17, '#6a4a2a');
  p.ellipse(26, 14, 6, 4, '#2a2a2a');
  p.ellipse(26, 14, 3, 2, G[1]);
  p.ring(26, 14, 5, 3.3, '#4a4a4a', 1, 1);
  p.rect(0, 26, 40, 6, G[1]);
  p.hl(0, 26, 40, G[3]);
  p.rect(42, 4, 18, 14, G[3]);
  p.hl(42, 4, 18, G[4]);
  p.rect(42, 18, 20, 12, G[2]);
  p.rect(44, 20, 14, 5, '#2a3440');
  p.hl(44, 20, 14, '#6a8aa8');
  p.rect(60, 18, 4, 10, G[1]);
  p.rect(61, 25, 3, 2, '#fff4c8');
  for (const x of [6, 28, 50]) {
    p.ellipse(x + 4, 33, 5, 4.5, D[0]);
    p.ellipse(x + 4, 33, 2, 2, D[3]);
  }
  p.outline(0, '#1e1e1a');
  return p;
}

export function grassTufts(p: Px, x0: number, y0: number, w: number, h: number, seed: number, dens = 0.012): void {
  const r = rng(seed);
  for (let i = 0; i < w * h * dens; i++) {
    const x = Math.round(x0 + r() * w), y = Math.round(y0 + r() * h);
    if (p.alpha(x, y) === 0) continue;
    if (fbm(x / 26, y / 16, seed + 5, 3) < 0.48 && r() < 0.85) continue;
    const c = r() < 0.4 ? '#8a7a3a' : r() < 0.5 ? '#a8904c' : r() < 0.5 ? '#c8b07a' : '#7a8248';
    const kind = Math.floor(r() * 4);
    if (kind === 0) {
      p.line(x, y, x - 1, y - 3, c);
      p.line(x + 1, y, x + 2, y - 2, c);
      p.set(x, y - 2, sh(c, 0.3));
    } else if (kind === 1) {
      p.set(x, y, c);
      p.set(x, y - 1, c);
      p.set(x + 1, y - 2, sh(c, 0.3));
    } else if (kind === 2) {
      p.hl(x - 1, y, 3, sh(c, -0.2));
      p.set(x, y - 1, c);
      p.set(x - 1, y - 2, sh(c, 0.25));
      p.set(x + 1, y - 2, c);
    } else {
      p.ellipse(x, y - 1, 2, 1.4, mix(c, '#6a7a48', 0.5));
      p.set(x - 1, y - 2, sh(c, 0.3));
    }
    p.set(x, y + 1, '#6a5228', 0.45);
  }
}

export function bunkerEntrance(): Art {
  const w = 176, h = 92, p = new Px(w, h), e = new Px(w, h);
  p.ellipseF(88, 60, 86, 34, (nx, ny) => {
    const n = fbm((nx + 1) * 16, (ny + 1) * 9, 7, 3);
    const l = -ny * 0.8 + nx * 0.35;
    let c: Col = l > 0.5 ? '#d2b67a' : l > 0.15 ? '#bea064' : l > -0.25 ? '#a68a52' : '#8a7040';
    if (n < 0.35) c = mix(c, '#7a8a48', 0.35);
    if (ny > 0.75) c = '#6e5a32';
    return [c];
  });
  for (let a = 0; a < Math.PI; a += 0.004) {
    const x = 88 + Math.cos(a) * 86, y = 60 + Math.sin(a) * 34;
    p.set(x, y, '#5e4a28');
    p.set(x, y - 1, '#7a6236');
  }
  grassTufts(p, 10, 28, 156, 56, 11, 0.05);
  for (let i = 0; i < 14; i++) {
    const x = 20 + hash2(i, 4, 4) * 136, y = 40 + hash2(i, 5, 5) * 40;
    if (p.alpha(x, y)) {
      p.ellipse(x, y, 2, 1.4, '#8a8478');
      p.set(x - 1, y - 1, '#b8b2a4');
    }
  }
  const px = 58, py = 34;
  p.rect(px, py, 58, 44, '#8a8a86');
  p.hl(px, py, 58, '#c0c0ba');
  p.vl(px, py, 44, '#a8a8a2');
  p.vl(px + 57, py, 44, '#5a5a56');
  for (let i = 0; i < 4; i++) p.hl(px + 2, py + 8 + i * 9, 54, '#7a7a76', 0.5);
  p.rect(px + 8, py + 10, 42, 34, '#2a2c2e');
  const D = ramp('#5a6450');
  p.rect(px + 11, py + 12, 36, 30, D[2]);
  p.vl(px + 11, py + 12, 30, D[3]);
  p.vl(px + 46, py + 12, 30, D[0]);
  p.hl(px + 11, py + 12, 36, D[4]);
  p.vl(px + 29, py + 12, 30, D[0]);
  for (const [dx, dy] of [[14, 15], [42, 15], [14, 38], [42, 38], [25, 26], [33, 26]] as const) {
    p.set(px + dx, py + dy, D[4]);
    p.set(px + dx + 1, py + dy + 1, D[0]);
  }
  p.ellipse(px + 26, py + 28, 3, 3, D[1]);
  p.ring(px + 26, py + 28, 3, 3, D[4], 1, 1);
  p.line(px + 23, py + 28, px + 29, py + 28, D[0]);
  p.rect(px + 25, py + 3, 8, 4, '#3a3a3e');
  e.rect(px + 26, py + 6, 6, 1, '#fff2c0');
  for (let i = 0; i < 4; i++) {
    p.rect(px + 6 - i * 2, py + 44 + i * 3, 46 + i * 4, 3, i % 2 ? '#9a9a94' : '#8a8a84');
    p.hl(px + 6 - i * 2, py + 44 + i * 3, 46 + i * 4, '#b8b8b2');
  }
  p.line(px + 2, py + 40, px - 6, py + 57, '#5a5c62');
  p.line(px + 56, py + 40, px + 64, py + 57, '#5a5c62');
  for (const [x, hh] of [[132, 30], [142, 22]] as const) {
    p.rect(x, 22 - hh + 20, 4, hh, '#5a5c60');
    p.vl(x, 22 - hh + 20, hh, '#8a8c90');
    p.rect(x - 2, 20 - hh + 20, 8, 4, '#3a3c40');
    p.set(x - 1, 21 - hh + 20, '#a8dcff');
  }
  p.rect(28, 22, 10, 12, '#6a6c70');
  p.hl(27, 22, 12, '#9a9ca0');
  p.rect(30, 24, 6, 2, '#2a2c30');
  p.vl(160, 0, 34, '#4a4a4a');
  p.hl(154, 4, 12, '#4a4a4a');
  p.hl(156, 9, 8, '#4a4a4a');
  p.set(160, 0, '#ff5a4a');
  e.set(160, 0, '#ff7a6a');
  return { p, e };
}

export function rails(p: Px, x0: number, y0: number, x1: number, y1: number): void {
  const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (let i = 0; i < len; i += 5) {
    const x = x0 + (x1 - x0) * (i / len), y = y0 + (y1 - y0) * (i / len);
    p.line(x - nx * 10, y - ny * 10, x + nx * 10, y + ny * 10, '#5a4630');
    p.line(x - nx * 10 + 1, y - ny * 10 + 1, x + nx * 10 + 1, y + ny * 10 + 1, '#3a2c1e');
  }
  for (let i = 0; i < len; i += 2) {
    const x = x0 + (x1 - x0) * (i / len), y = y0 + (y1 - y0) * (i / len);
    p.set(x + nx * 12 + hash2(i, 1, 1) * 3, y + ny * 12, '#8a8278', 0.6);
    p.set(x - nx * 12 - hash2(i, 2, 1) * 3, y - ny * 12, '#8a8278', 0.6);
  }
  for (const s of [-6, 6]) {
    p.line(x0 + nx * s, y0 + ny * s, x1 + nx * s, y1 + ny * s, '#b8bac2');
    p.line(x0 + nx * s, y0 + ny * s + 1, x1 + nx * s, y1 + ny * s + 1, '#4a4c54');
  }
}
export function erector(len: number): Px {
  const p = new Px(len, 26), M = ramp('#6a6a5a');
  latticeBeam(p, 2, 8, len - 2, 8, 10, '#6a6a5a');
  p.rect(len - 22, 2, 20, 14, M[2]);
  p.hl(len - 22, 2, 20, M[4]);
  p.rect(len - 18, 5, 12, 6, M[0]);
  for (let x = 10; x < len - 10; x += 36) {
    p.rect(x, 16, 18, 6, '#3a3a3e');
    p.ellipse(x + 4, 22, 3, 3, '#1a1a1e');
    p.ellipse(x + 14, 22, 3, 3, '#1a1a1e');
  }
  p.outline(0, '#1e1e1a');
  return p;
}
export function powerPole(h: number): Px {
  const p = new Px(22, h), W = ramp('#6a5038');
  p.rect(10, 0, 3, h, W[2]);
  p.vl(10, 0, h, W[3]);
  p.vl(12, 0, h, W[0]);
  p.rect(1, 6, 20, 3, W[2]);
  p.hl(1, 6, 20, W[3]);
  for (const x of [2, 10, 19]) {
    p.rect(x, 3, 2, 3, '#e8e8f0');
    p.set(x, 3, '#ffffff');
  }
  p.outline(0, '#24180e');
  return p;
}
export function crate(w = 14, h = 12): Px {
  const p = new Px(w, h), W = ramp('#8a6a3a');
  p.rect(0, 0, w, 4, W[3]);
  p.hl(0, 0, w, W[4]);
  p.rect(0, 4, w, h - 4, W[2]);
  p.vl(w - 1, 4, h - 4, W[0]);
  p.line(1, 5, w - 2, h - 2, W[1]);
  p.hl(0, 4, w, W[1]);
  p.outline(0, '#2a1a0e');
  return p;
}
export function barrel(c = '#5a6a7a'): Px {
  const p = new Px(10, 13), R = ramp(c);
  p.ellipse(5, 2.5, 4.5, 2, R[3]);
  p.ellipse(5, 2.5, 2.5, 1, R[1]);
  cyl(p, 1, 3, 9, 8, c);
  p.ellipse(5, 11, 4.5, 1.8, R[1]);
  p.hl(1, 5, 9, R[0]);
  p.hl(1, 9, 9, R[0]);
  p.outline(0, '#18181c');
  return p;
}
export function tumbleweed(): Px {
  const p = new Px(10, 9);
  for (let i = 0; i < 26; i++) {
    const a = i * 0.9, r1 = 2 + (i % 4);
    p.line(5, 4.5, 5 + Math.cos(a) * r1, 4.5 + Math.sin(a) * r1 * 0.8, i % 2 ? '#8a7040' : '#a8884e');
  }
  return p;
}
export function signPost(): Px {
  const p = new Px(16, 22);
  p.rect(7, 8, 2, 14, '#5a4a3a');
  p.rect(0, 0, 16, 9, '#3a5a3a');
  p.rect(1, 1, 14, 7, '#e8e0c8');
  p.hl(3, 3, 10, '#8a2a2a');
  p.hl(3, 5, 8, '#3a3a3a');
  p.outline(0, '#1a1a14');
  return p;
}
export function camel(): Px {
  const p = new Px(20, 14), c = '#7a5a3a', d = '#5a4028';
  p.ellipse(9, 6, 6, 3, c);
  p.ellipse(7, 3, 2, 2, c);
  p.ellipse(11, 3, 2, 2, c);
  p.line(15, 5, 18, 1, c);
  p.rect(17, 0, 3, 2, c);
  for (const x of [5, 7, 11, 13]) p.vl(x, 8, 5, d);
  p.outline(0, '#3a2a18');
  return p;
}
export function trailer(): Px {
  const p = new Px(40, 26), W = ramp('#8a8070');
  p.rect(0, 0, 40, 6, W[3]);
  p.hl(0, 0, 40, W[4]);
  p.rect(0, 6, 40, 16, W[2]);
  p.hl(0, 6, 40, W[1]);
  for (let x = 2; x < 40; x += 4) p.vl(x, 7, 15, W[1]);
  p.rect(6, 10, 8, 6, '#2a3440');
  p.hl(6, 10, 8, '#8aa8c8');
  p.rect(24, 9, 8, 13, '#5a4a3a');
  p.set(30, 15, '#c8c0a0');
  p.rect(2, 22, 6, 4, '#2a2a2a');
  p.rect(32, 22, 6, 4, '#2a2a2a');
  p.outline(0, '#24201a');
  return p;
}

export const BPAD = { W: 1280, H: 420, HZ: 46, SX: -0.85, SY: -0.42, RCX: 980, RBOT: 300 } as const;

export interface ShadowCaster {
  spr: Px;
  x: number;
  y: number;
  base: number;
  a?: number;
}

export function padGround(casters: ShadowCaster[]): Art {
  const { W, H, HZ, SX, SY, RCX, RBOT } = BPAD;
  const A = new Px(W, H), E = new Px(W, H), r = rng(41);
  for (let y = 0; y < HZ; y++)
    for (let x = 0; x < W; x++) {
      const t = y / HZ;
      let c = t < 0.5 ? mix('#5e8ccc', '#a9c0dc', t * 2) : mix('#a9c0dc', '#f7d9a6', (t - 0.5) * 2);
      const d = Math.hypot((x - 1180) / 1.6, y - HZ);
      if (d < 220) c = mix(c, '#ffe6b8', Math.pow(1 - d / 220, 2) * 0.85);
      A.set(x, y, c);
    }
  for (let i = 0; i < 16; i++) {
    const cx = r() * W, cy = 6 + r() * 28, cw = 30 + r() * 80;
    for (let x = -cw; x < cw; x++) {
      const k = 1 - Math.abs(x) / cw;
      A.hl(cx + x, cy, 1, mix('#f6e2d0', '#e8a890', r() * 0.4), 0.55 * k);
      if (k > 0.4) A.set(cx + x, cy + 1, '#c89aa0', 0.3 * k);
    }
  }
  E.ellipse(1186, HZ - 2, 9, 7, '#fff6d8');
  E.ellipse(1186, HZ - 2, 18, 12, '#ffd890', 0.35);
  const far = '#9a8a78';
  A.rect(80, HZ - 9, 120, 9, far);
  A.rect(96, HZ - 13, 70, 4, far);
  A.hl(80, HZ - 9, 120, '#b8a890');
  A.rect(300, HZ - 16, 3, 16, far);
  A.ellipse(301.5, HZ - 18, 6, 3.5, far);
  for (let x = 360; x < 560; x += 14) {
    A.vl(x, HZ - 6, 6, far);
    A.hl(x - 2, HZ - 6, 5, far);
  }
  A.rect(640, HZ - 22, 3, 22, far);
  A.rect(634, HZ - 22, 15, 2, far);
  A.rect(220, HZ - 4, 50, 4, far);
  A.rect(760, HZ - 5, 80, 5, far);
  A.rect(900, HZ - 3, 60, 3, far);
  for (let y = HZ; y < H; y++)
    for (let x = 0; x < W; x++) {
      const depth = (y - HZ) / (H - HZ);
      const sx = 6 + depth * 6, sy = 3 + depth * 4;
      const n = fbm(x / 90, y / (30 + depth * 30), 9, 4), m = fbm(x / sx, y / sy, 10, 2);
      let c = mix('#b08646', '#d4ae68', Math.min(1, Math.max(0, (n - 0.3) * 1.6)));
      if (m > 0.68) c = mix(c, '#e2c690', 0.35);
      else if (m < 0.3 && bayer(x, y) < 0.5) c = mix(c, '#94703a', 0.4);
      if (fbm(x / 20, y / 12, 21, 3) > 0.66) c = mix(c, '#8e8a52', 0.3);
      c = mix(c, '#e8d4b0', Math.pow(1 - depth, 3) * 0.6);
      A.set(x, y, c);
    }
  for (let i = 0; i < 40; i++) {
    let x = r() * W, y = HZ + 30 + r() * (H - HZ - 30);
    for (let k = 0; k < 18; k++) {
      A.set(x, y, '#7a5a2a', 0.55);
      x += r() * 3 - 1;
      y += r() * 2 - 0.7;
    }
  }
  grassTufts(A, 0, HZ + 20, W, H - HZ - 20, 3, 0.02);
  const road = [[0, 340], [300, 318], [560, 302], [720, 292]] as const;
  for (let y = HZ; y < H; y++)
    for (let x = 0; x < 760; x++) {
      let best = 99;
      for (let i = 0; i + 1 < road.length; i++) best = Math.min(best, distToSeg(x, y, road[i]![0], road[i]![1], road[i + 1]![0], road[i + 1]![1]));
      if (best < 13) {
        let c: Col = mix('#7a766e', '#8e8a80', fbm(x / 4, y / 3, 4, 2));
        if (best > 10) c = mix(c, '#b08646', 0.5);
        if (Math.abs(best - 5) < 0.6 && hash2(x, y, 1) < 0.5) c = '#6a665e';
        A.set(x, y, c);
      }
    }
  rails(A, 0, 412, 760, 344);
  const CX0 = 700, CX1 = 1280, CY0 = 140, CY1 = 380;
  for (let y = CY0; y < CY1; y++)
    for (let x = CX0; x < CX1; x++) {
      const ix = x - CX0, iy = y - CY0, sx = Math.floor(ix / 32), sy = Math.floor(iy / 20);
      let c: Col = sh('#9e9c94', (hash2(sx, sy, 4) - 0.5) * 0.12);
      const n = fbm(x / 7, y / 5, 12, 3);
      if (n > 0.66) c = sh(c, -0.08);
      if (n < 0.28) c = sh(c, 0.07);
      if (fbm(x / 16, y / 10, 30, 3) > 0.7) c = mix(c, '#6a6458', 0.3);
      if (ix % 32 === 0 || iy % 20 === 0) c = '#6e6c66';
      else if (ix % 32 === 1 || iy % 20 === 1) c = sh(c, 0.1);
      const edge = Math.min(ix, iy, CY1 - y);
      if (edge < 16 && fbm(x / 5, y / 5, 2, 2) > 0.3 + edge / 26) c = mix(c, '#c49c58', 0.75);
      A.set(x, y, c);
    }
  for (let x = CX0 + 16; x < CX1; x += 10) A.rect(x, CY1 - 14, 6, 2, '#e8d070', 0.85);
  for (let y = CY0 + 20; y < CY1 - 20; y += 10) A.rect(CX0 + 14, y, 2, 6, '#e8d070', 0.7);
  for (const [x, y] of [[760, 180], [1200, 330], [790, 330], [1140, 170]] as const) {
    A.rect(x, y, 14, 10, '#5a5a56');
    A.hl(x, y, 14, '#8a8a84');
    A.rect(x + 2, y + 2, 10, 6, '#7a7a74');
    A.set(x + 6, y + 4, '#3a3a36');
  }
  A.rect(RCX - 60, RBOT - 2, 120, 40, '#3a3630');
  for (let y = 0; y < 36; y++) A.hl(RCX - 56, RBOT + y, 112, mix('#2a2620', '#0c0a08', y / 36));
  A.hl(RCX - 60, RBOT - 2, 120, '#c0beb6');
  A.hl(RCX - 60, RBOT + 37, 120, '#cfcdc6');
  for (let x = RCX - 60; x < RCX + 60; x += 6) A.vl(x, RBOT + 32, 6, '#5a5c62');
  A.hl(RCX - 60, RBOT + 32, 120, '#6a6c72');
  for (const [dy, c] of [[0, '#2a2620'], [3, '#3a342a']] as const) {
    let x = 700, y = 250 + dy;
    for (let k = 0; k < 520; k++) {
      A.set(x, y, c);
      x -= 1;
      y += Math.sin(k / 16) * 0.35 + 0.004;
    }
  }
  for (let x = 0; x < 680; x += 18) {
    const y = 132 - x * 0.04;
    A.rect(x, y - 9, 2, 9, '#6a5038');
    A.set(x, y - 10, '#8a6a48');
  }
  for (const dy of [6, 3]) for (let x = 0; x < 680; x++) if (hash2(x, dy, 2) < 0.8) A.set(x, 132 - x * 0.04 - dy + Math.sin(x / 9) * 0.6, '#4a3a2a', 0.7);
  for (const c of casters) castShadow(A, c.spr, c.x, c.y, c.base, SX, SY, '#3a2410', c.a ?? 0.34, (_gx, gy) => gy > HZ + 2);
  const poles = [[60, 334], [200, 322], [340, 312], [480, 304], [620, 296]] as const;
  for (let i = 0; i + 1 < poles.length; i++)
    for (const k of [-8, 0, 8]) {
      const [ax, ay] = poles[i]!, [bx, by] = poles[i + 1]!;
      for (let t = 0; t <= 1; t += 0.006) {
        const x = ax + k + (bx - ax) * t, y = ay - 50 + (by - ay) * t + Math.sin(t * Math.PI) * 6;
        A.set(x, y, '#2a2420', 0.8);
      }
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ang = Math.atan2(y - HZ, x - 1186), band = Math.sin(ang * 26) * 0.5 + 0.5;
      const d = Math.hypot(x - 1186, y - HZ);
      if (bayer(x, y) < 0.5 && band > 0.7) E.set(x, y, '#ffe8c0', 0.05 * (1 - Math.min(1, d / 900)));
    }
  return { p: A, e: E };
}

export const BROOM = { W: 640, H: 360, X0: 64, X1: 576, WALL_TOP: 30, FLOOR_Y: 140, FLOOR_B: 322 } as const;

export function bunkerRoom(seed: number): Px {
  const { W, H, X0, X1, WALL_TOP, FLOOR_Y, FLOOR_B } = BROOM;
  const A = new Px(W, H);
  A.rect(0, 0, W, H, '#08090a');
  for (let y = WALL_TOP; y < FLOOR_Y; y++)
    for (let x = X0; x < X1; x++) {
      const n = fbm(x / 24, y / 16, seed, 3);
      let c: Col = y < FLOOR_Y - 46 ? mix('#c8c0a8', '#b8b098', n) : mix('#4a6a5a', '#3e5e4e', n);
      if (y === FLOOR_Y - 46) c = '#2e4a3c';
      if (y === FLOOR_Y - 45) c = '#6a8a7a';
      if (hash2(x, y, seed) < 0.004) c = sh(c, -0.2);
      A.set(x, y, c);
    }
  A.rect(X0 - 10, WALL_TOP - 8, X1 - X0 + 20, 8, '#5a5a56');
  A.hl(X0 - 10, WALL_TOP - 8, X1 - X0 + 20, '#8a8a84');
  for (const [y, c] of [[WALL_TOP + 4, '#6a6e72'], [WALL_TOP + 10, '#5a6458']] as const) {
    A.rect(X0, y, X1 - X0, 4, c);
    A.hl(X0, y, X1 - X0, sh(c, 0.3));
    for (let x = X0 + 30; x < X1; x += 90) A.rect(x, y - 1, 3, 6, sh(c, -0.3));
  }
  for (let y = FLOOR_Y; y < FLOOR_B; y++)
    for (let x = X0; x < X1; x++) {
      const tx = Math.floor((x - X0) / 24), ty = Math.floor((y - FLOOR_Y) / 16);
      let c: Col = sh((tx + ty) % 2 ? '#6a6458' : '#5e584e', (hash2(tx, ty, seed) - 0.5) * 0.1);
      if ((x - X0) % 24 === 0 || (y - FLOOR_Y) % 16 === 0) c = '#3e3a34';
      if (fbm(x / 30, y / 18, seed + 3, 3) > 0.66) A.set(x, y, mix(c, '#4a4438', 0.3));
      else A.set(x, y, c);
    }
  for (let y = 0; y < 14; y++) A.rect(X0, FLOOR_Y + y, X1 - X0, 1, '#000000', 0.45 * (1 - y / 14));
  for (const x0 of [X0 - 10, X1]) A.rect(x0, WALL_TOP, 10, FLOOR_B - WALL_TOP + 10, '#4a4a46');
  A.rect(X0 - 10, FLOOR_B, X1 - X0 + 20, 10, '#3a3a36');
  A.hl(X0 - 10, FLOOR_B, X1 - X0 + 20, '#6a6a64');
  for (let x = X0 + 10; x < X1 - 10; x++) {
    A.set(x, FLOOR_B - 12, '#2a2a28');
    A.set(x, FLOOR_B - 10, '#3a3430');
  }
  return A;
}

export function controlDesk(w: number, seed: number, frame = 0): Art {
  const h = 56, p = new Px(w, h), e = new Px(w, h), r = rng(seed);
  const M = ramp('#7a8a7e');
  p.rect(0, 0, w, 26, M[2]);
  p.hl(0, 0, w, M[4]);
  p.hl(0, 25, w, M[0]);
  p.rect(0, 26, w, 10, M[3]);
  p.hl(0, 26, w, M[4]);
  p.rect(0, 36, w, 20, M[1]);
  p.hl(0, 55, w, M[0]);
  for (let x = 8; x < w - 8; x += 40) {
    p.rect(x, 40, 30, 12, M[2]);
    p.hl(x, 40, 30, M[3]);
    p.rect(x + 13, 45, 4, 2, '#c8c8c0');
  }
  for (let x = 10; x < w - 14; x += 34) {
    p.ellipse(x + 6, 9, 6, 6, '#1a1e1a');
    p.ellipse(x + 6, 9, 5, 5, '#e8e4d0');
    const a = -2.2 + r() * 1.6 + (frame % 2) * 0.05;
    p.line(x + 6, 9, x + 6 + Math.cos(a) * 4, 9 + Math.sin(a) * 4, '#1a1a1a');
    p.set(x + 6, 9, '#b8363a');
  }
  for (let x = 4; x < w - 4; x += 5) {
    const y = 19 + (Math.floor(x / 5) % 2) * 2;
    p.rect(x, y, 3, 2, '#1a1a18');
    const on = hash2(x, frame, seed) < 0.55;
    const col = hash2(x, 7, seed) < 0.7 ? '#7dffb0' : hash2(x, 8, seed) < 0.6 ? '#ffd23f' : '#ff6a4a';
    if (on) e.rect(x, y, 3, 2, col);
  }
  for (let x = 6; x < w - 6; x += 7) {
    p.rect(x, 29, 2, 3, '#3a3a38');
    p.set(x, 28, '#d8d8d0');
  }
  p.outline(0, '#141614');
  return { p, e };
}

export function blastDoor(): Art {
  const p = new Px(48, 78), e = new Px(48, 78);
  const M = ramp('#5a6450');
  p.rect(0, 0, 48, 78, '#4a4a46');
  p.hl(0, 0, 48, '#7a7a74');
  p.rect(4, 4, 40, 74, '#1e2020');
  p.rect(6, 6, 36, 72, M[2]);
  p.vl(6, 6, 72, M[3]);
  p.vl(41, 6, 72, M[0]);
  p.hl(6, 6, 36, M[4]);
  p.ellipse(24, 38, 8, 8, M[1]);
  p.ring(24, 38, 8, 8, M[4], 1, 1);
  for (let a = 0; a < 4; a++) p.line(24, 38, 24 + Math.cos(a * Math.PI / 2 + 0.4) * 7, 38 + Math.sin(a * Math.PI / 2 + 0.4) * 7, M[0]);
  for (const [x, y] of [[9, 9], [38, 9], [9, 72], [38, 72]] as const) p.set(x, y, M[4]);
  p.rect(18, 0, 12, 3, '#3a3a3e');
  e.rect(20, 1, 8, 1, '#ffd23f', 0.9);
  return { p, e };
}
export function journalDesk(open: boolean, protocol: boolean): Art {
  const w = 96, p = new Px(w, 40), e = new Px(w, 40), W = ramp('#6a5038');
  p.rect(0, 0, w, 18, W[3]);
  p.hl(0, 0, w, W[4]);
  p.rect(0, 18, w, 8, W[1]);
  p.hl(0, 25, w, W[0]);
  for (const x of [2, w - 6]) p.rect(x, 26, 4, 14, W[0]);
  if (open) {
    p.poly([[46, 3], [62, 2], [62, 14], [46, 15]], '#ece4d0');
    p.poly([[62, 2], [78, 3], [78, 15], [62, 14]], '#e0d8c4');
    p.vl(62, 2, 12, '#8a7a60');
    for (let k = 0; k < 4; k++) {
      p.hl(48, 5 + k * 2, 12, '#3a4a7a');
      p.hl(64, 5 + k * 2, 11, '#3a4a7a');
    }
  } else {
    p.rect(48, 3, 28, 12, '#3a4a3a');
    p.hl(48, 3, 28, '#5a6a5a');
    p.rect(60, 7, 6, 3, '#c8b070');
  }
  if (protocol) {
    p.rect(10, 4, 22, 13, '#f4f0e4');
    p.hl(13, 6, 16, '#8a2a2a');
    for (let k = 0; k < 3; k++) p.hl(13, 9 + k * 2, 15, '#6a6a6a');
  }
  p.rect(84, 6, 6, 8, '#2a2a2a');
  p.hl(83, 5, 8, '#4a4a4a');
  e.set(86, 8, '#ff5a4a', 0.8);
  p.outline(0, '#141210');
  return { p, e };
}
export function periscope(): Px {
  const p = new Px(20, 60);
  p.rect(8, 0, 5, 50, '#4a4e48');
  p.vl(8, 0, 50, '#7a7e78');
  p.rect(4, 30, 13, 10, '#3a3e38');
  p.rect(2, 34, 4, 3, '#2a2a2a');
  p.rect(15, 34, 4, 3, '#2a2a2a');
  p.ellipse(10, 54, 8, 3, '#3a3e38');
  p.outline(0, '#141614');
  return p;
}
export function wallClockB(): Art {
  const p = new Px(20, 20), e = new Px(20, 20);
  p.ellipse(10, 10, 9, 9, '#2a2a2a');
  p.ellipse(10, 10, 8, 8, '#f0ece0');
  for (let i = 0; i < 12; i++) p.set(10 + Math.cos(i * Math.PI / 6) * 7, 10 + Math.sin(i * Math.PI / 6) * 7, '#3a3a3a');
  p.line(10, 10, 10 + Math.cos(-Math.PI / 2 + 0.55) * 6, 10 + Math.sin(-Math.PI / 2 + 0.55) * 6, '#1a1a1a');
  p.line(10, 10, 10 + Math.cos(-Math.PI / 2 + 4.85) * 4, 10 + Math.sin(-Math.PI / 2 + 4.85) * 4, '#1a1a1a');
  p.set(10, 10, '#b8363a');
  return { p, e };
}
export function rocketSchema(): Px {
  const p = new Px(52, 44);
  p.rect(0, 0, 52, 44, '#3a4a5a');
  p.rect(2, 2, 48, 40, '#dfe6ec');
  const c = '#3a5a8a';
  p.vl(26, 6, 30, c);
  p.line(26, 6, 23, 10, c);
  p.line(26, 6, 29, 10, c);
  p.rect(23, 10, 7, 24, c);
  p.rect(24, 11, 5, 22, '#dfe6ec');
  p.line(23, 20, 16, 34, c);
  p.line(30, 20, 37, 34, c);
  p.hl(14, 36, 26, c);
  for (let k = 0; k < 4; k++) p.hl(6, 8 + k * 6, 10, '#8a9aaa');
  p.outline(0, '#141614');
  return p;
}
export function ceilingLamp(): Art {
  const p = new Px(28, 8), e = new Px(28, 8);
  p.rect(0, 0, 28, 3, '#5a5a56');
  p.rect(2, 3, 24, 4, '#e8e4d0');
  e.rect(3, 4, 22, 3, '#fff6dc');
  return { p, e };
}
export function chairB(): Px {
  const p = new Px(16, 22), M = ramp('#5a6a5a');
  p.rect(2, 0, 12, 10, M[2]);
  p.hl(2, 0, 12, M[3]);
  p.rect(1, 10, 14, 5, M[3]);
  p.vl(2, 15, 7, '#2a2a2a');
  p.vl(13, 15, 7, '#2a2a2a');
  p.outline(0, '#141614');
  return p;
}
export function radioRack(seed: number, frame = 0): Art {
  const w = 52, h = 96, p = new Px(w, h), e = new Px(w, h), r = rng(seed);
  const M = ramp('#6a7266');
  p.rect(0, 0, w, h, M[2]);
  p.vl(0, 0, h, M[3]);
  p.vl(w - 1, 0, h, M[0]);
  p.hl(0, 0, w, M[4]);
  for (let y = 4; y < h - 8; y += 18) {
    p.rect(3, y, w - 6, 16, M[1]);
    p.hl(3, y, w - 6, M[3]);
    const kind = Math.floor(r() * 3);
    if (kind === 0) {
      p.rect(6, y + 3, 18, 10, '#1a1e1a');
      p.rect(7, y + 4, 16, 8, '#e8e0b8');
      const a = -2.4 + r() * 1.5 + (frame % 2) * 0.12;
      p.line(15, y + 11, 15 + Math.cos(a) * 6, y + 11 + Math.sin(a) * 6, '#1a1a1a');
      for (let k = 0; k < 4; k++) {
        p.ellipse(30 + k * 5, y + 8, 2, 2, '#2a2a2a');
        p.set(30 + k * 5, y + 7, '#9a9a9a');
      }
    } else if (kind === 1) {
      for (let k = 0; k < 8; k++) {
        p.rect(6 + k * 5, y + 5, 3, 3, '#1a1a18');
        if (hash2(k, frame + y, seed) < 0.6) e.rect(6 + k * 5, y + 5, 3, 3, k % 3 ? '#7dffb0' : '#ffd23f');
      }
      p.hl(6, y + 11, 38, '#3a3a38');
    } else {
      p.rect(6, y + 3, 26, 10, '#0e1a12');
      for (let x = 0; x < 24; x++) e.set(7 + x, y + 8 + Math.round(Math.sin((x + frame * 3) * 0.7) * 3 * (hash2(x, y, seed) * 0.5 + 0.5)), '#7dffb0', 0.9);
      p.ellipse(40, y + 8, 4, 4, '#2a2a2a');
      p.set(40, y + 6, '#9a9a9a');
    }
  }
  p.rect(4, h - 6, w - 8, 6, M[0]);
  p.outline(0, '#141614');
  return { p, e };
}
export function operatorDesk(): Art {
  const w = 110, p = new Px(w, 52), e = new Px(w, 52), M = ramp('#6a5a44');
  p.rect(0, 14, w, 16, M[3]);
  p.hl(0, 14, w, M[4]);
  p.rect(0, 30, w, 10, M[1]);
  for (const x of [2, w - 6]) p.rect(x, 40, 4, 12, M[0]);
  p.rect(20, 0, 70, 16, '#4a5a4e');
  p.hl(20, 0, 70, '#7a8a7e');
  for (let k = 0; k < 10; k++) {
    p.ellipse(26 + k * 6.5, 6, 2, 2, '#1a1a1a');
    e.set(26 + k * 6.5, 11, k % 4 === 0 ? '#ffd23f' : '#7dffb0', 0.9);
  }
  p.ring(12, 20, 5, 3, '#2a2a30', 1, 1.4);
  p.rect(6, 20, 3, 3, '#3a3a40');
  p.rect(15, 20, 3, 3, '#3a3a40');
  p.vl(98, 4, 12, '#3a3a3a');
  p.ellipse(98, 4, 3, 2, '#2a2a2a');
  p.rect(70, 20, 12, 4, '#3a3a38');
  p.rect(74, 18, 6, 2, '#c8a050');
  p.outline(0, '#141210');
  return { p, e };
}
export function teletype(): Px {
  const p = new Px(34, 30);
  p.rect(0, 10, 34, 16, '#5a6252');
  p.hl(0, 10, 34, '#7a8272');
  p.rect(4, 0, 26, 12, '#f0ece0');
  for (let k = 0; k < 4; k++) p.hl(6, 2 + k * 2, 18, '#6a6a6a');
  for (let k = 0; k < 4; k++) p.hl(4, 14 + k * 3, 26, '#2a2a28');
  p.rect(2, 26, 3, 4, '#2a2a2a');
  p.rect(29, 26, 3, 4, '#2a2a2a');
  p.outline(0, '#141614');
  return p;
}
