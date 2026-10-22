import type { Art } from './art_common';
import { bayer, distToSeg, fbm, hash2, mix, Px, ramp, rng, sh, type Col, type Pt, type Rng } from './px';

const SN = ['#9aa8c8', '#bccae0', '#dfe7f4', '#f2f6fc', '#ffffff'] as const;

export function logWall(p: Px, x0: number, y0: number, w: number, h: number, base: string, r: Rng): void {
  const L = ramp(base);
  for (let y = 0; y < h; y++) {
    const ly = y % 7;
    for (let x = 0; x < w; x++) {
      let c = ly === 0 ? L[0] : ly === 1 ? L[3] : ly < 4 ? L[2] : ly < 6 ? L[1] : L[0];
      const n = fbm((x0 + x) / 5, (y0 + y) / 2, 7, 3);
      if (ly > 1 && ly < 6 && n > 0.72) c = sh(c, -0.12);
      if (ly === 2 && hash2(x0 + x, y0 + y, 3) < 0.05) c = L[4];
      p.set(x0 + x, y0 + y, c);
    }
    if (y % 7 === 0) for (let x = 0; x < w; x++) if (hash2(x0 + x, y0 + y, 5) < 0.25) p.set(x0 + x, y0 + y, '#4a4a32');
  }
  for (let i = 0; i < (w * h) / 160; i++) {
    const kx = x0 + Math.floor(r() * w), ky = y0 + 3 + 7 * Math.floor(r() * (h / 7));
    p.set(kx, ky, L[0]);
    p.set(kx + 1, ky, L[1]);
  }
}
export function logEnds(p: Px, x: number, y0: number, h: number, base: string): void {
  const L = ramp(base);
  for (let y = y0; y < y0 + h - 3; y += 7) p.ellipseF(x, y + 3.5, 4, 3.6, (_nx, _ny, r2) => [r2 > 0.7 ? L[0] : r2 > 0.45 ? '#c8a070' : r2 > 0.2 ? '#b08a5a' : '#d8b080']);
}

export interface IzbaOpts {
  wallH?: number;
  roofBack?: number;
  wood?: string;
  windows?: number[];
  door?: boolean;
  doorX?: number;
  doorGlow?: boolean;
  smoke?: boolean;
  dark?: boolean;
  trim?: string;
  sign?: 'bread' | 'scroll' | null;
}
export interface IzbaArt extends Art {
  base: number;
  doorCx: number;
  smokeAt: Pt | null;
  winAt: Pt[];
}

export function izba(w: number, seed: number, o: IzbaOpts = {}): IzbaArt {
  const r = rng(seed);
  const wallH = o.wallH ?? 49, gableH = Math.round(w * 0.36), roofBack = o.roofBack ?? 30;
  const H = roofBack + gableH + wallH + 6, Wd = w + 14;
  const p = new Px(Wd, H), e = new Px(Wd, H);
  const ox = 7, cx = ox + w / 2;
  const gy = roofBack, wy = roofBack + gableH;
  const wood = o.wood ?? '#7a5434';
  const trim = o.trim ?? '#d8c09a';
  for (let y = 0; y < wy + 2; y++)
    for (let x = 0; x < Wd; x++) {
      const leftEdgeX = y >= gy ? cx - ((y - gy) / gableH) * (w / 2 + 5) : cx;
      const rightEdgeX = y >= gy ? cx + ((y - gy) / gableH) * (w / 2 + 5) : cx;
      const inRoof = y < gy ? x >= ox - 5 && x < ox + w + 5 : (x < leftEdgeX + 0.5 && x >= ox - 5) || (x > rightEdgeX - 0.5 && x < ox + w + 5);
      if (!inRoof) continue;
      const leftPlane = x < cx;
      const n = fbm(x / 7, y / 5, seed, 3);
      let c: Col = leftPlane ? (n > 0.6 ? SN[4] : n > 0.3 ? SN[3] : SN[2]) : n > 0.65 ? SN[2] : n > 0.3 ? '#c9d5ea' : SN[1];
      if (y % 6 === 0 && hash2(x >> 3, y, seed) < 0.55) c = leftPlane ? SN[2] : SN[0];
      if (y % 6 === 0 && hash2(x >> 2, y, seed + 1) < 0.12) c = sh(wood, -0.2);
      p.set(x, y, c);
    }
  p.vl(Math.floor(cx), 0, gy + 1, SN[1]);
  p.vl(Math.floor(cx) + 1, 0, gy + 1, SN[4]);
  for (let y = 0; y < wy; y++) {
    p.set(ox - 5, y, '#ffffff');
    p.set(ox - 6, y, sh(wood, -0.2));
    p.set(ox + w + 4, y, '#b8c6de');
    p.set(ox + w + 5, y, sh(wood, -0.5));
  }
  let smokeAt: Pt | null = null;
  if (o.smoke) {
    const sx = Math.floor(cx + w * 0.18), sy = Math.floor(gy * 0.45);
    p.rect(sx, sy, 10, 6, sh(wood, -0.2));
    p.hl(sx, sy, 10, SN[4]);
    p.rect(sx + 2, sy + 2, 6, 3, '#1a1410');
    p.rect(sx - 1, sy - 2, 12, 2, SN[3]);
    smokeAt = [sx + 5, sy];
  }
  for (let y = gy; y < wy; y++) {
    const half = ((y - gy) / gableH) * (w / 2);
    for (let x = Math.ceil(cx - half); x < cx + half; x++) {
      const pl = Math.floor((x - ox) / 5);
      const W2 = ramp(wood);
      let c = (x - ox) % 5 === 0 ? W2[0] : pl % 2 ? W2[2] : sh(wood, 0.08);
      if ((x - ox) % 5 === 1) c = W2[3];
      p.set(x, y, sh(c, -0.12));
    }
  }
  const winAt: Pt[] = [];
  {
    const gw = 10, gh = 8, gx = Math.round(cx - gw / 2), gyy = wy - gh - 6;
    p.rect(gx - 2, gyy - 2, gw + 4, gh + 4, trim);
    p.rect(gx, gyy, gw, gh, '#2a1c14');
    if (!o.dark) {
      e.rect(gx + 1, gyy + 1, gw - 2, gh - 2, '#ffb347', 0.9);
      e.hl(gx + 1, gyy + 1, gw - 2, '#ffe0a0');
    }
    p.vl(Math.round(cx), gyy, gh, '#5a3a24');
    winAt.push([cx, gyy + gh / 2]);
  }
  for (let i = 0; i <= gableH + 3; i++) {
    const y = gy + i - 1;
    const lx = cx - (i / gableH) * (w / 2 + 5), rx = cx + (i / gableH) * (w / 2 + 5);
    for (let k = 0; k < 4; k++) {
      p.set(lx + k, y + k * 0.25, k < 1 ? '#f8fbff' : k === 1 ? '#c8a070' : '#a8804e');
      p.set(rx - k, y + k * 0.25, k < 1 ? '#e8eef8' : k === 1 ? '#a8804e' : '#7a5a34');
    }
    if (i % 4 === 0) {
      p.set(lx + 3, y + 3, '#7a5a34');
      p.set(rx - 3, y + 3, '#5a3a24');
      p.set(lx + 2, y + 4, '#c8a070');
      p.set(rx - 2, y + 4, '#a8804e');
    }
    if (hash2(i, seed, 2) < 0.5) {
      p.set(lx - 1, y, '#ffffff');
      p.set(rx + 1, y, '#e8eef8');
    }
  }
  p.rect(cx - 1, gy - 6, 3, 7, '#8a6038');
  p.rect(cx - 4, gy - 8, 5, 3, '#8a6038');
  p.set(cx - 4, gy - 7, '#3a2414');
  p.hl(cx - 3, gy - 9, 3, '#ffffff');
  logWall(p, ox, wy, w, wallH, wood, r);
  logEnds(p, ox - 1, wy, wallH, wood);
  logEnds(p, ox + w, wy, wallH, wood);
  for (const fx of o.windows ?? [0.22, 0.78]) {
    const ww = 12, wh = 10, x = Math.round(ox + w * fx - ww / 2), y = wy + 14;
    p.rect(x - 3, y - 4, ww + 6, wh + 8, trim);
    p.hl(x - 3, y - 4, ww + 6, sh(trim, 0.3));
    p.rect(x - 4, y - 6, ww + 8, 2, sh(trim, -0.15));
    p.set(x + ww / 2, y - 7, sh(trim, -0.15));
    for (let k = 0; k < ww + 6; k += 3) p.set(x - 3 + k, y + wh + 3, sh(trim, -0.3));
    p.hl(x - 4, y + wh + 2, ww + 8, '#ffffff');
    p.rect(x, y, ww, wh, '#2a1c14');
    if (!o.dark) {
      e.rect(x + 1, y + 1, ww - 2, wh - 2, '#ffaa44', 0.95);
      e.rect(x + 1, y + 1, 4, 3, '#ffe2a8');
    }
    p.vl(x + ww / 2, y, wh, '#4a3020');
    p.hl(x, y + wh / 2, ww, '#4a3020');
    winAt.push([x + ww / 2, y + wh / 2]);
  }
  const dw = 16, dh = 30, dx = Math.round(ox + w * (o.doorX ?? 0.5) - dw / 2), dy = wy + wallH - dh;
  if (o.door !== false) {
    p.rect(dx - 2, dy - 3, dw + 4, dh + 3, '#5a3a22');
    p.hl(dx - 2, dy - 3, dw + 4, '#8a6038');
    const D = ramp('#6a4426');
    for (let x = 0; x < dw; x++) for (let y = 0; y < dh; y++) p.set(dx + x, dy + y, x % 4 === 0 ? D[0] : x % 4 === 1 ? D[3] : D[2]);
    p.hl(dx, dy + 6, dw, '#3a3a40');
    p.hl(dx, dy + dh - 8, dw, '#3a3a40');
    p.set(dx + dw - 4, dy + 15, '#c8c8d0');
    if (o.doorGlow) e.rect(dx + 1, dy + dh - 2, dw - 2, 2, '#ffaa44', 0.8);
    p.rect(dx - 4, wy + wallH, dw + 8, 3, '#8a6a44');
    p.hl(dx - 4, wy + wallH, dw + 8, '#c8a070');
  }
  if (o.sign) {
    const sx = Math.round(dx + dw + 6), sy = wy + 8;
    p.vl(sx + 6, sy - 4, 4, '#3a2a1a');
    p.rect(sx, sy, 13, 10, '#8a6a44');
    p.hl(sx, sy, 13, '#c8a070');
    if (o.sign === 'bread') {
      p.ellipse(sx + 6.5, sy + 5, 4, 2.6, '#d8a050');
      p.hl(sx + 4, sy + 4, 5, '#f0c880');
    } else {
      p.rect(sx + 3, sy + 2, 7, 6, '#efe8dc');
      p.hl(sx + 4, sy + 4, 5, '#3a3a34');
      p.hl(sx + 4, sy + 6, 4, '#3a3a34');
    }
  }
  for (let x = ox - 4; x < ox + w + 4; x++) {
    const hh = 2 + Math.round(fbm(x / 6, seed, 4, 2) * 5);
    for (let y = 0; y < hh; y++) p.set(x, wy + wallH - y + 3, y === hh - 1 ? '#ffffff' : '#e2eaf6');
  }
  for (const x0 of [ox - 2, ox + w - 6])
    for (let i = 0; i < 7; i++)
      if (hash2(i, x0, seed) < 0.7) {
        const len = 2 + Math.floor(hash2(x0, i, 1) * 4);
        p.vl(x0 + i, wy, len, '#d8f0ff');
        p.set(x0 + i, wy + len, '#a8d0ff');
      }
  return { p, e, base: wy + wallH + 3, doorCx: dx + dw / 2, smokeAt, winAt };
}

export function logPavement(p: Px, x0: number, y0: number, w: number, h: number, seed: number): void {
  const L = ramp('#6a4a30');
  const prof = [0, 3, 3, 2, 2, 2, 1, 0];
  for (let x = x0; x < x0 + w; x++) {
    const li = Math.floor((x - x0) / 8), lx = (x - x0) % 8;
    const tone = (hash2(li, 0, seed) - 0.5) * 0.16;
    for (let y = y0; y < y0 + h; y++) {
      let c = sh(L[prof[lx]!]!, tone);
      if (lx > 1 && lx < 6 && hash2(li, Math.floor(y / 3), seed) < 0.08) c = sh(c, -0.2);
      const mid = Math.abs(y - (y0 + h / 2)) / (h / 2);
      if (mid < 0.55 && fbm(x / 9, y / 4, seed, 2) > 0.5) c = mix(c, '#8a8278', 0.35);
      p.set(x, y, c);
      const edge = Math.min(y - y0, y0 + h - 1 - y);
      const s = fbm(x / 7, y / 5, seed + 9, 3);
      if (lx === 0 && s > 0.45) p.set(x, y, '#e8eef8');
      if (edge < 4 && s > 0.35 + edge * 0.08) p.set(x, y, edge < 2 ? '#f4f8ff' : '#dfe7f4');
    }
  }
  p.rect(x0, y0 - 2, w, 2, L[1]);
  p.hl(x0, y0 - 2, w, L[3]);
  p.rect(x0, y0 + h, w, 2, L[0]);
  for (let x = x0; x < x0 + w; x++) {
    if (hash2(x, 1, seed) < 0.7) p.set(x, y0 - 3, '#f4f8ff');
    p.set(x, y0 + h + 2, '#9aa8c4', 0.6);
  }
}

export function well(): Px {
  const p = new Px(96, 96);
  const W = ramp('#6a4a30');
  p.rect(70, 30, 4, 60, W[1]);
  p.vl(70, 30, 60, W[3]);
  p.rect(66, 28, 12, 3, W[2]);
  p.line(10, 4, 92, 46, W[2]);
  p.line(10, 5, 92, 47, W[1]);
  p.line(11, 3, 92, 45, W[3]);
  p.rect(86, 42, 8, 8, '#5a5048');
  p.line(12, 6, 12, 42, '#3a2a1a');
  p.rect(9, 42, 7, 7, W[2]);
  p.hl(9, 42, 7, '#3a3a40');
  p.hl(9, 46, 7, '#3a3a40');
  const bx = 16, by = 56, bw = 34;
  p.rect(bx, by, bw, 14, '#20181a');
  p.ellipse(bx + bw / 2, by + 7, 12, 4, '#2a3448');
  p.hl(bx + 10, by + 6, 6, '#6a7a9a');
  p.rect(bx - 2, by - 2, bw + 4, 3, W[3]);
  p.rect(bx - 2, by + 12, bw + 4, 3, W[2]);
  p.vl(bx - 2, by - 2, 16, W[2]);
  p.vl(bx + bw + 1, by - 2, 16, W[1]);
  for (let y = by + 15; y < by + 34; y++) {
    const ly = (y - by - 15) % 6;
    for (let x = bx - 2; x < bx + bw + 2; x++) p.set(x, y, ly === 0 ? W[0] : ly === 1 ? W[3] : ly < 4 ? W[2] : W[1]);
  }
  for (let x = bx - 3; x < bx + bw + 3; x++) {
    p.set(x, by - 3, '#ffffff');
    p.set(x, by - 2, '#e8eef8');
  }
  for (let x = bx - 4; x < bx + bw + 4; x++) {
    const hh = 1 + Math.round(fbm(x / 5, 3, 3, 2) * 4);
    for (let y = 0; y < hh; y++) p.set(x, by + 34 - y, '#eef3fa');
  }
  p.outline(0, '#2a1c14', 200);
  return p;
}

export function spruce(h: number, seed: number): Px {
  const w = Math.round(h * 0.62), p = new Px(w, h + 6);
  const G = ramp('#2e5a48'), r = rng(seed);
  const cx = w / 2;
  p.rect(cx - 2, h - 8, 4, 12, '#4a3020');
  p.vl(cx - 2, h - 8, 12, '#6a4a30');
  const tiers = Math.round(h / 12);
  for (let t = 0; t < tiers; t++) {
    const ty = 2 + t * ((h - 12) / tiers), tw = (w / 2) * (0.3 + 0.7 * ((t + 1) / tiers)), th = (h - 12) / tiers + 6;
    p.poly([[cx, ty], [cx + tw, ty + th], [cx - tw, ty + th]], G[1]);
    p.poly([[cx, ty], [cx - tw * 0.2, ty + th], [cx - tw, ty + th]], G[2]);
    for (let x = Math.round(cx - tw); x < cx + tw * 0.6; x++) {
      const yy = ty + th - 1 - Math.round(Math.abs(x - cx) * 0.15);
      if (r() < 0.8) {
        p.set(x, yy - 1, '#f4f8ff');
        p.set(x, yy, '#dfe8f4');
      }
    }
    for (let i = 0; i < tw; i++) p.set(cx - tw * r(), ty + th * r(), '#f4f8ff');
    p.set(cx + tw - 1, ty + th, G[0]);
  }
  p.outline(0, '#18302a', 200);
  return p;
}

export function stall(): Art {
  const p = new Px(84, 64), e = new Px(84, 64);
  const W = ramp('#6a4a30'), CL = ramp('#b8a888');
  for (const x of [4, 78]) {
    p.rect(x, 12, 3, 46, W[1]);
    p.vl(x, 12, 46, W[3]);
  }
  p.poly([[0, 4], [84, 4], [80, 18], [4, 18]], CL[2]);
  for (let x = 0; x < 84; x += 12) p.vl(x + 2, 6, 11, CL[1]);
  for (let x = 0; x < 84; x++) {
    p.set(x, 4, '#ffffff');
    p.set(x, 5, x % 3 ? '#f0f4fa' : '#ffffff');
    if (hash2(x, 1, 2) < 0.6) p.set(x, 6, '#ffffff');
  }
  for (let x = 4; x < 80; x += 4) {
    p.set(x, 18, CL[0]);
    p.set(x + 1, 19, CL[0]);
  }
  p.rect(2, 36, 80, 6, W[3]);
  p.hl(2, 36, 80, W[4]);
  p.rect(2, 42, 80, 14, W[1]);
  for (let x = 2; x < 82; x += 7) p.vl(x, 42, 14, W[0]);
  for (let i = 0; i < 5; i++) {
    const x = 8 + i * 9;
    p.ellipseF(x, 34, 4, 2.6, (_nx, ny) => [ny < -0.2 ? '#e8b060' : '#b87830']);
    p.set(x - 1, 33, '#f8d890');
  }
  for (let i = 0; i < 3; i++) {
    const x = 56 + i * 8;
    p.ellipseF(x, 32, 3.2, 4, (nx) => [nx < -0.3 ? '#c87a4a' : '#8a4a2a']);
    p.hl(x - 2, 28, 4, '#5a2a1a');
  }
  p.rect(30, 26, 18, 8, '#6a5040');
  for (let x = 30; x < 48; x += 2) p.set(x, 26, '#8a7058');
  for (const [x, c] of [[14, '#8a6a4a'], [22, '#c8b090'], [62, '#6a5040']] as const) {
    p.poly([[x, 20], [x + 5, 20], [x + 6, 30], [x + 2, 33], [x - 1, 30]], c);
    p.vl(x + 2, 21, 10, sh(c, -0.25));
  }
  p.outline(0, '#2a1c14', 200);
  return { p, e };
}

export function firewood(): Px {
  const p = new Px(40, 22);
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 6 - row; i++) {
      const x = 4 + i * 6 + row * 3, y = 14 - row * 5;
      p.ellipseF(x, y, 3, 2.8, (_nx, _ny, r2) => [r2 > 0.6 ? '#5a3a22' : r2 > 0.3 ? '#c8a070' : '#a8804e']);
    }
  for (let x = 0; x < 40; x++) if (hash2(x, 3, 3) < 0.7) p.set(x, 3 + Math.round(hash2(x, 1, 1) * 2), '#ffffff');
  p.outline(0, '#2a1c14', 200);
  return p;
}

export function sledge(): Px {
  const p = new Px(58, 40);
  const W = ramp('#7a5434');
  p.rect(2, 12, 40, 16, W[2]);
  p.hl(2, 12, 40, W[3]);
  p.rect(4, 14, 36, 10, W[1]);
  for (let i = 0; i < 3; i++) {
    p.ellipseF(10 + i * 11, 16, 5, 4, (_nx, ny) => [ny < -0.2 ? '#d8c8a0' : '#b8a878']);
    p.hl(8 + i * 11, 14, 4, '#e8dcb8');
  }
  p.line(0, 30, 44, 30, W[1]);
  p.line(0, 32, 44, 32, W[0]);
  p.line(44, 30, 50, 24, W[1]);
  for (const x of [8, 22, 36]) p.vl(x, 28, 4, W[0]);
  p.line(44, 18, 56, 24, '#5a3a22');
  p.line(44, 22, 56, 28, '#5a3a22');
  p.outline(0, '#1a1008', 200);
  return p;
}

export function fence(w: number): Px {
  const p = new Px(w, 22), W = ramp('#7a6040');
  for (let x = 0; x < w; x += 14) {
    p.rect(x, 0, 3, 22, W[1]);
    p.vl(x, 0, 22, W[3]);
    p.rect(x - 1, 0, 5, 2, '#ffffff');
  }
  for (let y = 6; y < 20; y += 3)
    for (let x = 0; x < w; x++) {
      const wv = Math.round(Math.sin(x / 2 + y) * 0.8);
      p.set(x, y + wv, (Math.floor(x / 7) + y) % 2 ? W[2] : W[0]);
    }
  for (let x = 0; x < w; x++) p.set(x, 4 + (x % 5 === 0 ? 1 : 0), '#f4f8ff');
  p.outline(0, '#2a1c14', 200);
  return p;
}

export function crow(f = 0): Px {
  const p = new Px(9, 7);
  p.ellipse(4, 4, 3, 2, '#1a1a24');
  p.ellipse(6.5, 2.5, 1.6, 1.4, '#1a1a24');
  p.set(8, 2, '#4a4a54');
  p.set(7, 2, '#ffffff');
  p.vl(3, 6, 1, '#3a3a40');
  if (f) p.line(0, 1, 3, 3, '#1a1a24');
  return p;
}
export function birchBarkRolls(): Px {
  const p = new Px(22, 14);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 5, y = 6 + (i % 2) * 2;
    p.rect(x, y - 4, 4, 8, '#efe8dc');
    p.ellipse(x + 2, y - 4, 2, 1.3, '#c8a878');
    p.ring(x + 2, y - 4, 1.3, 0.8, '#8a6a4a', 1, 1);
    for (let k = 0; k < 3; k++) p.hl(x, y - 2 + k * 2, 3, '#3a3a34');
  }
  p.outline(0, '#2a1c14', 200);
  return p;
}
export function hay(): Px {
  const p = new Px(26, 16);
  p.ellipseF(13, 10, 12, 6, (nx, ny) => [ny < -0.3 ? '#f4f8ff' : nx < 0 ? '#d8b860' : '#b8983e']);
  for (let i = 0; i < 20; i++) p.line(2 + i, 8 + (i % 3), 3 + i, 12, '#a8883a', 0.6);
  p.outline(0, '#3a2a10', 200);
  return p;
}
export function dog(f = 0): Px {
  const p = new Px(16, 11), c = '#8a6a4a';
  p.ellipse(7, 5, 5, 2.6, c);
  p.ellipse(12, 3, 2.4, 2.2, c);
  p.set(14, 3, '#2a1a10');
  p.set(12, 2, '#1a1010');
  p.set(11, 0, c);
  p.line(2, 4, 0, f ? 2 : 1, c);
  for (const x of [4, 6, 9, 10]) p.vl(x, 7, 4, '#6a4a30');
  p.outline(0, '#2a1a10', 200);
  return p;
}
export function churchDome(): Px {
  const p = new Px(56, 74);
  const W = ramp('#7a5a3a');
  p.rect(16, 36, 24, 38, W[2]);
  for (let x = 16; x < 40; x += 4) p.vl(x, 36, 38, W[1]);
  p.vl(16, 36, 38, W[3]);
  p.ellipseF(28, 26, 14, 14, (nx, ny) => {
    const scale = (Math.floor((nx + 1) * 6) + Math.floor((ny + 1) * 6)) % 2;
    return [ny < -0.3 && nx < 0.1 ? '#f4f8ff' : scale ? '#8a8a8a' : '#a8a8a8'];
  });
  p.poly([[20, 16], [36, 16], [28, 4]], '#9a9a9a');
  for (let x = 22; x < 34; x++) p.set(x, 14, '#ffffff');
  p.vl(28, 0, 6, '#c8a050');
  p.hl(26, 2, 5, '#c8a050');
  p.rect(12, 34, 32, 3, '#ffffff');
  p.outline(0, '#2a1c14', 200);
  return p;
}
export function barrel(c = '#6a4a30'): Px {
  const p = new Px(12, 14), R = ramp(c);
  p.ellipse(6, 2.5, 5, 2, R[3]);
  p.ellipse(6, 2.5, 3.5, 1.2, R[1]);
  for (let y = 3; y < 12; y++) for (let x = 1; x < 11; x++) p.set(x, y, x < 3 ? R[3] : x > 8 ? R[1] : R[2]);
  p.hl(1, 5, 10, '#3a3a40');
  p.hl(1, 9, 10, '#3a3a40');
  p.ellipse(6, 12, 5, 1.6, R[1]);
  for (let x = 1; x < 11; x++) if (hash2(x, 2, 7) < 0.7) p.set(x, 1 + (x % 2), '#ffffff');
  p.outline(0, '#2a1c14', 200);
  return p;
}

export const NOVSQ = { W: 1280, H: 420, BASE: 176, ST0: 270, ST1: 298 } as const;

export function novSquareGround(paths: Pt[][]): Px {
  const { W, H, ST0, ST1 } = NOVSQ;
  const A = new Px(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 46, y / 26, 4, 4), m = fbm(x / 10, y / 6, 8, 3);
      let c = mix('#d0dcee', '#f4f8ff', Math.min(1, Math.max(0, (n - 0.3) * 2.2)));
      if (m < 0.36) c = mix(c, '#b4c4e0', 0.45);
      if (m > 0.7 && bayer(x, y) < 0.4) c = mix(c, '#ffffff', 0.6);
      A.set(x, y, c);
      if (hash2(x, y, 3) < 0.0025) A.set(x, y, '#ffffff');
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let best = 99;
      for (const pl of paths) for (let i = 0; i + 1 < pl.length; i++) best = Math.min(best, distToSeg(x, y, pl[i]![0], pl[i]![1], pl[i + 1]![0], pl[i + 1]![1]));
      if (best > 16) continue;
      const n = fbm(x / 6, y / 4, 13, 2);
      const wdt = 8 + n * 5;
      if (best < wdt) {
        const k = 1 - best / wdt;
        const c = k > 0.55 ? mix('#aab6c8', '#9c968f', n - 0.3) : '#bfcadc';
        if (k > 0.2 || bayer(x, y) < k * 4) A.set(x, y, c, k > 0.55 ? 1 : 0.8);
      }
    }
  logPavement(A, 0, ST0, W, ST1 - ST0, 5);
  for (let i = 0; i < 2; i++) for (let x = 0; x < W; x++) A.set(x, ST1 + 10 + i * 4 + Math.sin(x / 40) * 2, '#9aa8c4', 0.55);
  return A;
}

export function snowShadow(A: Px, x: number, y: number, w: number, rows = 8, a = 0.34): void {
  for (let yy = 0; yy < rows; yy++) A.rect(x, y + yy, w, 1, '#5a6a9a', a * (1 - yy / rows));
}

export const ROOM = { W: 640, H: 360, X0: 96, X1: 544, WALL_TOP: 40, FLOOR_Y: 132, FLOOR_B: 318 } as const;

export function novRoom(seed: number, wood = '#6a4a30', floorC = '#8a6a48', rug = true): Px {
  const { W, H, X0, X1, WALL_TOP, FLOOR_Y, FLOOR_B } = ROOM;
  const A = new Px(W, H), r = rng(seed);
  A.rect(0, 0, W, H, '#0a0706');
  A.rect(X0 - 12, WALL_TOP - 8, X1 - X0 + 24, 8, sh(wood, -0.35));
  A.hl(X0 - 12, WALL_TOP - 8, X1 - X0 + 24, sh(wood, 0.25));
  logWall(A, X0, WALL_TOP, X1 - X0, FLOOR_Y - WALL_TOP, wood, r);
  A.dither(X0, WALL_TOP, X1 - X0, 14, '#000000', 0.5, 0.55);
  A.rect(X0, WALL_TOP, X1 - X0, 3, sh(wood, -0.5));
  const F = ramp(floorC);
  for (let y = FLOOR_Y; y < FLOOR_B; y++)
    for (let x = X0; x < X1; x++) {
      const board = Math.floor((y - FLOOR_Y) / 10);
      const off = (board * 37) % 90;
      const seam = (x + off) % 90 === 0;
      const ly = (y - FLOOR_Y) % 10;
      let c = ly === 0 ? F[0] : ly === 1 ? F[3] : ly === 9 ? F[1] : F[2];
      c = sh(c, (hash2(board, Math.floor((x + off) / 90), seed) - 0.5) * 0.16);
      if (seam) c = F[0];
      const n = fbm(x / 16, y / 4, seed, 3);
      if (n > 0.66 && ly > 1) c = sh(c, -0.08);
      if (n < 0.3 && ly > 1) c = sh(c, 0.05);
      if (hash2(x, y, seed) < 0.006) c = F[1];
      A.set(x, y, c);
    }
  for (let y = 0; y < 14; y++) A.rect(X0, FLOOR_Y + y, X1 - X0, 1, '#000000', 0.45 * (1 - y / 14));
  if (rug) {
    const rx0 = 250, rx1 = 390, ry0 = 236, ry1 = 300;
    const cols = ['#a83a3a', '#e8dcc0', '#3a5a8a', '#e8dcc0', '#c89040', '#e8dcc0'];
    for (let y = ry0; y < ry1; y++)
      for (let x = rx0; x < rx1; x++) {
        const band = Math.floor((x - rx0) / 6) % cols.length;
        let c = sh(cols[band]!, (y % 2) * -0.06);
        if (y === ry0 || y === ry1 - 1) c = sh(c, -0.3);
        A.set(x, y, c);
      }
    for (let x = rx0; x < rx1; x += 2) {
      A.vl(x, ry0 - 3, 3, '#d8ccb0');
      A.vl(x, ry1, 3, '#d8ccb0');
    }
  }
  for (const x0 of [X0 - 12, X1]) {
    A.rect(x0, WALL_TOP, 12, FLOOR_B - WALL_TOP + 12, sh(wood, -0.4));
    for (let y = WALL_TOP; y < FLOOR_B + 8; y += 7) A.ellipseF(x0 + 6, y + 3.5, 5.5, 3.4, (_nx, _ny, r2) => [r2 > 0.6 ? sh(wood, -0.55) : r2 > 0.3 ? '#a8804e' : '#c8a070']);
  }
  const DX = W / 2;
  A.rect(X0 - 12, FLOOR_B, X1 - X0 + 24, 12, sh(wood, -0.45));
  A.hl(X0 - 12, FLOOR_B, X1 - X0 + 24, sh(wood, 0.1));
  A.rect(DX - 20, FLOOR_B, 40, 30, '#dfe8f4');
  for (let y = FLOOR_B; y < FLOOR_B + 30; y++) for (let x = DX - 20; x < DX + 20; x++) if (fbm(x / 6, y / 4, 9, 2) > 0.55) A.set(x, y, '#ffffff');
  A.rect(DX - 20, FLOOR_B, 40, 3, '#8a6a44');
  A.hl(DX - 20, FLOOR_B, 40, '#c8a070');
  A.vl(DX - 21, FLOOR_B, 30, sh(wood, 0.1));
  A.vl(DX + 20, FLOOR_B, 30, sh(wood, -0.6));
  return A;
}

export function rushnyk(): Px {
  const p = new Px(14, 34);
  p.rect(0, 0, 14, 2, '#5a3a22');
  p.rect(2, 2, 10, 30, '#f2ece0');
  for (let y = 6; y < 30; y += 6) {
    p.hl(3, y, 8, '#b83a3a');
    for (let x = 4; x < 10; x += 2) p.set(x, y + 2, '#b83a3a');
    p.set(7, y + 3, '#b83a3a');
  }
  for (let x = 2; x < 12; x += 2) p.vl(x, 32, 2, '#e8dcc8');
  p.outline(0, '#2a1c14', 200);
  return p;
}
export function herbs(): Px {
  const p = new Px(26, 22);
  p.hl(0, 1, 26, '#5a3a22');
  for (let i = 0; i < 4; i++) {
    const x = 3 + i * 6;
    p.vl(x, 1, 4, '#8a7a5a');
    for (let k = 0; k < 10; k++) p.set(x - 2 + hash2(i, k, 1) * 5, 5 + k * 1.5, ['#6a8a4a', '#8aa05a', '#a8a060'][k % 3]!);
  }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function tub(): Px {
  const p = new Px(26, 18), W = ramp('#8a6040');
  p.ellipse(13, 5, 12, 4, W[3]);
  p.ellipse(13, 5, 10, 3, '#4a6080');
  p.hl(8, 4, 6, '#9ab8d8');
  for (let y = 6; y < 16; y++) for (let x = 2; x < 24; x++) p.set(x, y, x < 5 ? W[3] : x > 20 ? W[1] : W[2]);
  p.hl(2, 9, 22, '#3a3a40');
  p.hl(2, 13, 22, '#3a3a40');
  p.ellipse(13, 16, 11, 1.6, W[1]);
  p.outline(0, '#1a1008', 200);
  return p;
}
export function spinningWheel(): Px {
  const p = new Px(28, 34), W = ramp('#7a5434');
  p.ring(18, 12, 9, 9, W[2], 1, 1.5);
  for (let a = 0; a < 6; a++) p.line(18, 12, 18 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, W[1]);
  p.rect(2, 22, 22, 4, W[3]);
  p.vl(4, 10, 14, W[1]);
  p.ellipse(4, 9, 3, 3, '#e8dcc0');
  for (const x of [4, 20]) p.vl(x, 26, 8, W[0]);
  p.outline(0, '#1a1008', 200);
  return p;
}
export function broom(): Px {
  const p = new Px(8, 34);
  p.line(4, 0, 4, 22, '#8a6a44');
  p.poly([[1, 22], [7, 22], [8, 33], [0, 33]], '#c8a860');
  for (let x = 1; x < 8; x += 2) p.vl(x, 24, 9, '#a88a48');
  p.outline(0, '#1a1008', 200);
  return p;
}

export function micaWindow(): Art {
  const p = new Px(26, 22), e = new Px(26, 22);
  p.rect(0, 0, 26, 22, '#c8a878');
  p.hl(0, 0, 26, '#e8c898');
  p.rect(3, 3, 20, 15, '#2a1c14');
  for (let y = 4; y < 17; y++) for (let x = 4; x < 22; x++) e.set(x, y, (x + y) % 6 < 3 ? '#d8e4f4' : '#b8c8e0', 0.55);
  for (let x = 4; x < 22; x += 6) p.vl(x, 3, 15, '#5a4030');
  for (let y = 3; y < 18; y += 5) p.hl(3, y, 20, '#5a4030');
  p.rect(-1, 19, 28, 3, '#8a6a44');
  p.outline(0, '#1a1008', 200);
  return { p, e };
}

export function russianStove(frame = 0, w = 64): Art {
  const h = 78, p = new Px(w, h), e = new Px(w, h);
  const P = ramp('#d8d0c0');
  p.rect(0, 0, w, 22, P[3]);
  p.hl(0, 0, w, P[4]);
  for (let i = 0; i < 30; i++) p.set(hash2(i, 1, 2) * w, hash2(i, 2, 2) * 20, P[2]);
  p.rect(0, 22, w, h - 22, P[2]);
  p.vl(0, 22, h - 22, P[3]);
  p.vl(w - 1, 22, h - 22, P[1]);
  for (let y = 26; y < h; y += 9) p.hl(1, y, w - 2, sh('#d8d0c0', -0.08));
  const mx = Math.round(w / 2 - 12), my = 40;
  p.rect(mx - 2, my - 2, 28, 22, P[1]);
  for (let y = 0; y < 18; y++) {
    const half = y < 8 ? Math.round(Math.sqrt(64 - (8 - y) * (8 - y)) * 1.5) : 12;
    p.hl(mx + 12 - half, my + y, half * 2, '#1a0c06');
  }
  const r = rng(frame + 3);
  for (let i = 0; i < 26; i++) {
    const x = mx + 4 + r() * 16, y = my + 8 + r() * 9;
    e.set(x, y, ['#ff7a2f', '#ffb347', '#fff0b0'][Math.floor(r() * 3)]!);
  }
  e.rect(mx + 5, my + 13, 14, 4, '#ff9a40');
  e.rect(mx + 8, my + 15, 8, 2, '#fff0b0');
  p.rect(4, 4, 20, 12, '#8a3a3a');
  for (let x = 4; x < 24; x += 3) p.vl(x, 4, 12, '#a85050');
  for (const x of [38, 48]) {
    p.ellipseF(x, 12, 4, 4.5, (nx) => [nx < -0.3 ? '#c87a4a' : '#8a4a2a']);
    p.hl(x - 2, 8, 4, '#5a2a1a');
  }
  p.outline(0, '#2a1c14', 200);
  return { p, e };
}

export function bench(w: number): Px {
  const p = new Px(w, 14), W = ramp('#7a5434');
  p.rect(0, 0, w, 5, W[3]);
  p.hl(0, 0, w, W[4]);
  p.rect(0, 5, w, 3, W[1]);
  for (const x of [2, w - 5]) p.rect(x, 8, 3, 6, W[0]);
  p.outline(0, '#1a1008', 200);
  return p;
}
export function plankTable(w: number, h = 22, items: 'food' | 'bark' | 'dough' | 'none' = 'none'): Art {
  const p = new Px(w, h + 12), e = new Px(w, h + 12), W = ramp('#8a6040');
  p.rect(0, 0, w, h, W[3]);
  p.hl(0, 0, w, W[4]);
  for (let y = 4; y < h; y += 5) p.hl(1, y, w - 2, W[2]);
  p.rect(0, h, w, 5, W[1]);
  p.hl(0, h + 4, w, W[0]);
  for (const x of [2, w - 6]) p.rect(x, h + 5, 4, 7, W[0]);
  if (items === 'food') {
    p.ellipse(14, 8, 7, 4, '#d8d0c0');
    p.ellipse(14, 7, 5, 2.5, '#c89050');
    p.ellipseF(w - 16, 9, 6, 3.6, (_nx, ny) => [ny < -0.2 ? '#e8b060' : '#b87830']);
    p.rect(w / 2 - 3, 5, 6, 8, '#6a4a3a');
    p.hl(w / 2 - 3, 5, 6, '#8a6a5a');
  }
  if (items === 'bark') {
    const r = rng(7);
    for (let i = 0; i < 6; i++) {
      const x = 6 + r() * (w - 26), y = 2 + r() * (h - 12);
      p.poly([[x, y], [x + 14, y + 1], [x + 15, y + 8], [x + 1, y + 7]], '#efe4cc');
      p.line(x + 2, y + 3, x + 12, y + 3, '#7a5a3a', 0.8);
      p.line(x + 2, y + 5, x + 10, y + 5, '#7a5a3a', 0.6);
    }
    p.rect(w - 14, 4, 2, 10, '#c8c8d0');
    p.set(w - 14, 3, '#ffffff');
    p.rect(w - 10, 6, 2, 9, '#a8a8b0');
  }
  if (items === 'dough') {
    p.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 4, '#a8804e');
    p.ellipse(w / 2, h / 2 - 1, w / 2 - 9, h / 2 - 7, '#f0e4c8');
    p.ellipse(w / 2 - 4, h / 2 - 2, 5, 3, '#fff6e0');
  }
  p.outline(0, '#1a1008', 200);
  return { p, e };
}
export function chest(open = false): Px {
  const p = new Px(36, 28), W = ramp('#8a5a30'), M = '#5a5a62';
  if (open) {
    p.rect(1, 0, 34, 8, W[1]);
    p.hl(1, 0, 34, W[3]);
  }
  p.rect(0, open ? 8 : 0, 36, open ? 6 : 10, W[3]);
  p.hl(0, open ? 8 : 0, 36, W[4]);
  p.rect(0, 10, 36, 16, W[2]);
  p.hl(0, 10, 36, W[1]);
  p.vl(0, 10, 16, W[3]);
  p.vl(35, 10, 16, W[0]);
  for (const x of [6, 29]) {
    p.vl(x, 0, 26, M);
    p.vl(x + 1, 0, 26, '#8a8a92');
  }
  p.rect(16, 12, 4, 5, '#c8a050');
  p.set(17, 14, '#3a2a1a');
  p.ring(12, 18, 3, 3, W[0], 1, 1);
  p.ring(24, 18, 3, 3, W[0], 1, 1);
  p.outline(0, '#1a1008', 200);
  return p;
}
export function potShelf(w: number): Px {
  const p = new Px(w, 30), W = ramp('#6a4a30');
  for (const y of [10, 26]) {
    p.rect(0, y, w, 3, W[3]);
    p.hl(0, y + 2, w, W[0]);
  }
  const r = rng(w);
  for (const y of [10, 26])
    for (let x = 3; x < w - 6; x += 7 + Math.floor(r() * 3)) {
      const c = ['#a85a3a', '#8a6a4a', '#c8b090', '#6a5a4a'][Math.floor(r() * 4)]!;
      p.ellipseF(x + 3, y - 4, 3, 4, (nx) => [nx < -0.3 ? sh(c, 0.3) : nx > 0.4 ? sh(c, -0.3) : c]);
      p.hl(x + 1, y - 8, 4, sh(c, -0.4));
    }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function iconCorner(): Art {
  const p = new Px(22, 26), e = new Px(22, 26);
  p.rect(0, 0, 22, 4, '#6a4a30');
  p.rect(3, 4, 16, 20, '#5a3a20');
  p.rect(4, 5, 14, 18, '#c8a050');
  p.rect(6, 7, 10, 14, '#7a3a2a');
  p.ellipse(11, 11, 3, 3, '#e8c8a0');
  p.ring(11, 11, 4, 4, '#ffd36b', 1, 1);
  e.rect(10, 24, 2, 2, '#ff9a40');
  e.set(10, 23, '#fff0b0');
  return { p, e };
}
export function loom(): Px {
  const p = new Px(36, 46), W = ramp('#7a5434');
  for (const x of [2, 32]) {
    p.rect(x, 0, 3, 46, W[2]);
    p.vl(x, 0, 46, W[3]);
  }
  p.rect(2, 2, 33, 3, W[3]);
  p.rect(2, 36, 33, 3, W[1]);
  for (let x = 6; x < 31; x += 2) p.vl(x, 5, 31, '#d8ccb0');
  for (let y = 22; y < 36; y++) for (let x = 6; x < 31; x++) if ((x + y) % 3 === 0) p.set(x, y, '#8a3a3a');
  p.outline(0, '#1a1008', 200);
  return p;
}
export function cradle(): Px {
  const p = new Px(22, 30);
  p.vl(11, 0, 12, '#5a3a22');
  p.ellipseF(11, 20, 10, 7, (nx, ny) => [ny < -0.3 ? '#a8804e' : nx > 0.4 ? '#6a4a30' : '#8a6040']);
  p.ellipse(11, 18, 7, 4, '#d8ccb0');
  p.outline(0, '#1a1008', 200);
  return p;
}
export function bakeryOven(frame = 0): Art {
  const w = 96, h = 92, p = new Px(w, h), e = new Px(w, h);
  const B = ramp('#a86a4a'), P = ramp('#d0c4b0');
  p.rect(0, 0, w, 30, P[3]);
  p.hl(0, 0, w, P[4]);
  for (let i = 0; i < 40; i++) p.set(hash2(i, 3, 1) * w, hash2(i, 4, 1) * 28, P[2]);
  p.ellipse(w / 2, 14, 30, 10, '#c0b4a0');
  for (let y = 30; y < h; y++)
    for (let x = 0; x < w; x++) {
      const by = Math.floor((y - 30) / 6), bx = Math.floor((x + (by % 2) * 6) / 12);
      const edge = (y - 30) % 6 === 0 || (x + (by % 2) * 6) % 12 === 0;
      p.set(x, y, edge ? B[0] : sh(B[2], (hash2(bx, by, 3) - 0.5) * 0.18));
    }
  p.vl(0, 30, h - 30, B[3]);
  p.vl(w - 1, 30, h - 30, B[0]);
  const mx = w / 2 - 18, my = 46;
  for (let y = 0; y < 30; y++) {
    const half = y < 12 ? Math.round(Math.sqrt(144 - (12 - y) * (12 - y)) * 1.5) : 18;
    p.hl(mx + 18 - half - 2, my + y - 2, half * 2 + 4, '#3a2418');
    p.hl(mx + 18 - half, my + y, half * 2, '#1a0c06');
  }
  const r = rng(frame * 7 + 1);
  for (let i = 0; i < 60; i++) {
    const x = mx + 4 + r() * 28, y = my + 12 + r() * 16;
    e.set(x, y, ['#ff7a2f', '#ffb347', '#fff0b0', '#ff5a1f'][Math.floor(r() * 4)]!);
  }
  e.rect(mx + 6, my + 22, 24, 6, '#ff9a40');
  e.rect(mx + 10, my + 25, 16, 3, '#fff0b0');
  for (let i = 0; i < 6; i++) e.set(mx + 6 + r() * 24, my + 6 + r() * 10, '#ffcf70', 0.7);
  p.rect(mx - 4, my + 30, 44, 4, B[1]);
  p.hl(mx - 4, my + 30, 44, B[3]);
  p.outline(0, '#1a1008', 200);
  return { p, e };
}
export function breadRack(): Px {
  const p = new Px(52, 46), W = ramp('#7a5434');
  for (const x of [1, 48]) p.rect(x, 0, 3, 46, W[2]);
  for (const y of [12, 26, 40]) {
    p.rect(1, y, 50, 3, W[3]);
    for (let x = 6; x < 46; x += 10) {
      p.ellipseF(x, y - 3, 5, 3, (_nx, ny) => [ny < -0.2 ? '#f0c070' : '#b87830']);
      p.set(x - 2, y - 5, '#f8e0a0');
    }
  }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function flourSacks(): Px {
  const p = new Px(34, 24);
  for (const [x, y] of [[8, 14], [22, 15], [15, 8]] as const) {
    p.ellipseF(x, y, 8, 8, (nx, ny) => [ny < -0.4 ? '#f4efe4' : nx > 0.4 ? '#c8bca4' : '#e4dccc']);
    p.hl(x - 3, y - 7, 6, '#8a7a5a');
  }
  for (let i = 0; i < 12; i++) p.set(hash2(i, 9, 9) * 34, 20 + hash2(i, 8, 9) * 4, '#ffffff', 0.7);
  p.outline(0, '#3a3020', 200);
  return p;
}
export function logsPile(): Px {
  const p = new Px(34, 22);
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4 - row; i++) {
      const x = 5 + i * 8 + row * 4, y = 16 - row * 6;
      p.rect(x - 4, y - 3, 8, 6, '#7a5232');
      p.ellipseF(x + 4, y, 3, 3, (_nx, _ny, r2) => [r2 > 0.6 ? '#5a3a22' : r2 > 0.3 ? '#c8a070' : '#a8804e']);
    }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function scrollRack(w: number): Px {
  const p = new Px(w, 56), W = ramp('#5a3a22');
  p.rect(0, 0, w, 56, W[1]);
  p.vl(0, 0, 56, W[3]);
  p.vl(w - 1, 0, 56, W[0]);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < Math.floor((w - 4) / 8); col++) {
      const x = 3 + col * 8, y = 3 + row * 13;
      p.rect(x, y, 7, 11, '#20140c');
      if (hash2(col, row, 4) < 0.8) {
        p.ellipse(x + 3.5, y + 5.5, 3, 3, '#efe4cc');
        p.ring(x + 3.5, y + 5.5, 2, 2, '#c8b890', 1, 1);
        p.set(x + 3, y + 5, '#8a7a5a');
      }
    }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function waxTablets(): Px {
  const p = new Px(22, 14);
  for (const [x, y] of [[1, 2], [9, 5]] as const) {
    p.rect(x, y, 11, 8, '#8a6040');
    p.rect(x + 1, y + 1, 9, 6, '#3a3020');
    p.line(x + 2, y + 3, x + 8, y + 3, '#c8b070');
    p.line(x + 2, y + 5, x + 6, y + 5, '#c8b070');
  }
  p.outline(0, '#1a1008', 200);
  return p;
}
export function oilLamp(): Art {
  const p = new Px(10, 8), e = new Px(10, 8);
  p.ellipse(5, 6, 4, 2, '#8a6a3a');
  p.hl(2, 5, 6, '#c8a050');
  e.ellipse(7, 2, 1.4, 2.4, '#ffcf70');
  e.set(7, 1, '#fff6d0');
  return { p, e };
}

export function cat(frame = 0, fur = '#c8803a'): Px {
  const p = new Px(22, 14), F = ramp(fur);
  const b = frame ? 0.6 : 0;
  p.ellipse(11, 11, 10, 2.5, '#000000', 0.35);
  p.ellipseF(11, 7, 8.5 + b, 5 + b * 0.5, (nx, ny) => [ny < -0.3 ? F[3] : nx > 0.4 ? F[1] : F[2]]);
  for (let k = 0; k < 4; k++) p.line(6 + k * 3, 3, 7 + k * 3, 6, F[0], 0.7);
  p.ellipseF(5, 8, 3.6, 3, (nx, ny) => [ny < 0 ? F[3] : F[2]]);
  p.poly([[2, 6], [3, 3], [5, 5]], F[2]);
  p.poly([[6, 5], [7, 3], [8, 6]], F[2]);
  p.set(3, 4, '#e8a0a0');
  p.hl(3, 8, 2, F[0]);
  p.hl(6, 8, 2, F[0]);
  for (let a = 0.2; a < 2.4; a += 0.08) p.set(11 + Math.cos(a) * 9, 8 + Math.sin(a) * 4.5, a > 2 ? '#f4e8d8' : F[1]);
  p.outline(0, '#1a1008', 200);
  return p;
}
