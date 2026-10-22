import { bayer, blurPx, fbm, hash2, mix, Px, ramp, rng, sh, type Col, type Pt, type Rng } from './px';

const GLYPHS: readonly (readonly Pt[])[][] = [
  [[[0, 6], [2, 0], [4, 6]], [[1, 4], [3, 4]]],
  [[[4, 0], [0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]]],
  [[[0, 6], [0, 0], [3, 0], [4, 1], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
  [[[0, 6], [0, 0], [4, 0]]],
  [[[1, 0], [1, 5], [0, 6]], [[1, 0], [3, 0], [3, 5]], [[0, 5], [4, 5], [4, 6]]],
  [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  [[[0, 0], [0, 6], [4, 0], [4, 6]]],
  [[[0, 0], [0, 6]], [[4, 0], [0, 3], [4, 6]]],
  [[[0, 6], [2, 0], [4, 6]]],
  [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  [[[2, 0], [0, 1], [0, 5], [2, 6], [4, 5], [4, 1], [2, 0]]],
  [[[0, 6], [0, 0], [4, 0], [4, 6]]],
  [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]],
  [[[4, 0], [1, 0], [0, 1], [0, 5], [1, 6], [4, 6]]],
  [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  [[[0, 0], [2, 3]], [[4, 0], [1, 6]]],
  [[[0, 0], [1, 0], [1, 6], [3, 6], [4, 5], [3, 3], [1, 3]]],
  [[[1, 6], [1, 0]], [[0, 1], [2, 1]], [[1, 3], [3, 3], [4, 4], [3, 6], [1, 6]]],
  [[[0, 0], [0, 6], [4, 6]], [[2, 0], [2, 6]], [[4, 0], [4, 6]]],
];

function scratchRow(p: Px, x0: number, y0: number, w: number, r: Rng, ink: Col, light: Col | undefined, sc = 1, a = 1): number {
  let x = x0;
  while (x < x0 + w - 5 * sc) {
    const g = GLYPHS[Math.floor(r() * GLYPHS.length)]!;
    const slant = (r() - 0.5) * 0.6;
    for (const stroke of g)
      for (let i = 0; i < stroke.length - 1; i++) {
        const [ax, ay] = stroke[i]!, [bx, by] = stroke[i + 1]!;
        const X0 = x + ax * sc + (6 - ay) * slant * 0.3, Y0 = y0 + ay * sc, X1 = x + bx * sc + (6 - by) * slant * 0.3, Y1 = y0 + by * sc;
        p.line(X0, Y0, X1, Y1, ink, a);
        if (light) p.line(X0 + 1, Y0 + 1, X1 + 1, Y1 + 1, light, a * 0.6);
      }
    x += 5 * sc + 1 + Math.floor(r() * 2);
    if (r() < 0.12) x += 3 * sc;
  }
  return x;
}

function birchSheet(p: Px, x0: number, y0: number, w: number, h: number, seed: number, curl = true): void {
  const r = rng(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = x0 + x, gy = y0 + y;
      const edge = Math.min(x, w - 1 - x, y, h - 1 - y);
      const wob = fbm(gx / 6, gy / 40, seed, 3) * 4;
      if (edge + wob < 2.5) continue;
      const n = fbm(gx / 40, gy / 3.2, seed + 1, 4);
      let c: Col = mix('#d9a36a', '#f0c88e', n);
      if (fbm(gx / 90, gy / 50, seed + 2, 3) > 0.62) c = mix(c, '#c4844e', 0.4);
      if (hash2(gy, Math.floor(gx / 9), seed) > 0.9) c = sh(c, 0.06);
      if (curl && (y < 7 || y > h - 8)) {
        const t = y < 7 ? 1 - y / 7 : (y - (h - 8)) / 7;
        c = mix(c, y < 7 ? '#f6efe2' : '#7a4a26', t * 0.85);
        if (y < 7 && hash2(gx, gy, 3) > 0.9 && t > 0.4) c = '#3a2a22';
      }
      if (edge + wob < 4) c = sh(c, -0.18);
      p.set(gx, gy, c);
    }
  for (let i = 0; i < (w * h) / 90; i++) {
    const x = x0 + 6 + r() * (w - 12), y = y0 + 8 + r() * (h - 16), L = 3 + r() * 9;
    p.hl(x, y, L, '#8a5530', 0.55);
    p.hl(x + 1, y + 1, L - 2, '#f8d8a8', 0.35);
  }
}

function parchment(p: Px, x0: number, y0: number, w: number, h: number, seed: number, base: Col, dark: Col): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = x0 + x, gy = y0 + y;
      const edge = Math.min(x, w - 1 - x, y, h - 1 - y);
      const wob = fbm(gx / 5, gy / 5, seed, 3) * 5;
      if (edge + wob < 2.5) continue;
      const n = fbm(gx / 30, gy / 24, seed + 3, 4);
      let c: Col = mix(base, dark, n * 0.55);
      const vig = Math.max(0, 1 - (edge + wob) / 22);
      c = mix(c, dark, vig * 0.65);
      if (edge + wob < 4) c = sh(dark, -0.15);
      if (bayer(gx, gy) < (hash2(gx >> 2, gy >> 2, seed) - 0.75) * 0.6) c = sh(c, -0.05);
      p.set(gx, gy, c);
    }
}

function speck(p: Px, x0: number, y0: number, w: number, h: number, seed: number, cols: readonly Col[], n: number, a = 0.6): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h;
    if (p.alpha(x, y) > 0) p.set(x, y, cols[Math.floor(r() * cols.length)], a * (0.4 + r() * 0.6));
  }
}

function deskBg(p: Px, seed: number, wood: Col): void {
  const W = ramp(wood);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const n = fbm(x / 70, y / 4, seed, 4);
      let c: Col = mix(W[1], W[2], n);
      if (y % 30 === 0) c = W[0];
      if (fbm(x / 30, y / 14, seed + 5, 3) > 0.7) c = mix(c, W[0], 0.3);
      p.set(x, y, c);
    }
}

export const LW = 320, LH = 180;

export type LoupeArtKind = 'leaf' | 'bark_forged' | 'diary' | 'pass' | 'boots';

export interface LoupeArtOut {
  px: Px;
  texts: { s: string; x: number; y: number; size: number; color: string; font: string; alpha?: number; rot?: number; detailOnly?: boolean; baseOnly?: boolean }[];
}

export function loupeArt(kind: LoupeArtKind): LoupeArtOut {
  switch (kind) {
    case 'leaf':
      return leafArt();
    case 'bark_forged':
      return barkForgedArt();
    case 'diary':
      return diaryArt();
    case 'pass':
      return passArt();
    case 'boots':
      return bootsArt();
  }
}

function leafArt(): LoupeArtOut {
  const p = new Px(LW, LH);
  deskBg(p, 3, '#3a2a4a');
  p.rect(30, 22, 270, 150, '#000000', 0.35);
  parchment(p, 24, 14, 270, 152, 7, '#efe4c6', '#b49a68');
  const r = rng(5);
  for (let y = 34; y < 132; y += 12) scratchRow(p, 44, y, 230 - ((y / 12) % 3) * 22, r, '#6a5a3e', undefined, 1, 0.55);
  for (let y = 138; y < 156; y++) for (let x = 188; x < 272; x++) if (hash2(x, y, 4) > 0.25) p.set(x, y, mix('#d8c8a0', '#c4b088', hash2(x >> 1, y, 2)), 0.9);
  for (let i = 0; i < 9; i++) {
    const y = 20 + Math.floor(r() * 140), h = 1 + Math.floor(r() * 3), off = Math.floor((r() - 0.5) * 10);
    const strip = p.crop(24, y, 270, h);
    p.blit(strip, 24 + off, y);
    p.rect(24, y, 270, h, '#5fe3ff', 0.18);
  }
  for (let y = 0; y < LH; y += 3) p.hl(0, y, LW, '#5fe3ff', 0.05);
  return { px: p, texts: [{ s: '~ ? ~', x: 214, y: 152, size: 11, color: '#8a7a58', font: 'Caveat', detailOnly: true }] };
}

function barkForgedArt(): LoupeArtOut {
  const p = new Px(LW, LH);
  deskBg(p, 11, '#5a3a24');
  p.rect(18, 18, 292, 152, '#000000', 0.4);
  birchSheet(p, 12, 10, 296, 152, 21);
  const r = rng(22);
  for (let k = 0; k < 7; k++) {
    const y = 28 + k * 16;
    const wEnd = 280 - (k % 3) * 18;
    const rr = rng(100 + k);
    const tmp = new Px(LW, LH);
    scratchRow(tmp, 34, y, wEnd - 34, rr, '#140c10', undefined, 1.15);
    p.blit(tmp, 0, 0);
    p.blit(tmp, 1, 0);
    for (let x = 34; x < wEnd; x += 7) if (hash2(x, k, 5) > 0.6) p.set(x + 1, y + 1, '#ffffff', 0.5);
  }
  p.ellipse(105, 80, 8, 4, '#0a0608', 0.95);
  p.ellipse(100, 77, 3, 1, '#ffffff', 0.7);
  p.hl(96, 75, 14, '#ffffff', 0.45);
  p.hl(150, 59, 18, '#ffffff', 0.35);
  p.hl(60, 107, 12, '#ffffff', 0.35);
  for (let y = 104; y < 118; y++) for (let x = 182; x < 254; x++) p.set(x, y, mix('#e8b880', '#f0c88e', fbm(x / 30, y / 3, 21, 3)));
  return {
    px: p,
    texts: [{ s: 'пожалуйста', x: 186, y: 115, size: 14, color: '#120a0c', font: 'Caveat' }],
  };
}

function diaryArt(): LoupeArtOut {
  const p = new Px(LW, LH);
  deskBg(p, 31, '#3a3a4a');
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const e = Math.min(x, LW - 1 - x, y, LH - 1 - y);
    if (e < 18 && fbm(x / 6, y / 6, 4, 3) > 0.35 + e / 30) p.set(x, y, '#d8e4f0', 0.55);
  }
  p.rect(20, 14, 286, 160, '#000000', 0.4);
  for (let y = 10; y < 168; y++)
    for (let x = 14; x < 302; x++) {
      const n = fbm(x / 40, y / 30, 31, 3);
      let c: Col = mix('#e2ddca', '#c9c2a8', n * 0.6);
      if ((y - 22) % 13 === 0 && y > 20) c = mix(c, '#8aa0c0', 0.45);
      if (x === 38) c = mix(c, '#b07888', 0.45);
      p.set(x, y, c);
    }
  p.ellipse(268, 140, 18, 12, '#a89870', 0.18);
  p.ellipse(270, 141, 14, 9, '#a89870', 0.12);
  p.poly([[302, 10], [302, 30], [282, 10]], '#9a9480');
  p.poly([[282, 10], [302, 30], [284, 28]], '#f0ecdc');
  for (let y = 16; y < 166; y += 22) { p.vl(18, y, 6, '#5a5a6a'); p.set(17, y + 3, '#2a2a3a'); }
  return {
    px: p,
    texts: [
      { s: '22 декабря. Какой чудесный день!', x: 44, y: 50, size: 11, color: '#28306a', font: 'Caveat' },
      { s: 'Получили 500 граммов хлеба,', x: 44, y: 63, size: 11, color: '#28306a', font: 'Caveat' },
      { s: 'на обед суп с мясом.', x: 44, y: 76, size: 11, color: '#28306a', font: 'Caveat' },
      { s: 'Умылась тёплой водой из крана.', x: 44, y: 102, size: 11, color: '#28306a', font: 'Caveat' },
      { s: 'Блокада снята!', x: 44, y: 141, size: 12, color: '#28306a', font: 'Caveat' },
    ],
  };
}

function passArt(): LoupeArtOut {
  const p = new Px(LW, LH);
  deskBg(p, 41, '#4a4a3e');
  speck(p, 0, 0, LW, LH, 3, ['#c8a868', '#a88848'], 1200, 0.5);
  p.rect(22, 18, 284, 152, '#000000', 0.45);
  for (let y = 12; y < 164; y++)
    for (let x = 16; x < 300; x++) {
      const n = fbm(x / 30, y / 20, 41, 3);
      let c: Col = mix('#ddd8c4', '#c4bea6', n * 0.7);
      const e = Math.min(x - 16, 299 - x, y - 12, 163 - y);
      if (e < 2) c = '#9a9480';
      p.set(x, y, c);
    }
  p.gradV(16, 12, 284, 22, ['#2d3f6a', '#24345a']);
  p.hl(16, 34, 284, '#1a2440');
  for (let x = 16; x < 300; x++) for (const k of [0, 1]) p.set(x, 40 + k * 120 + Math.round(Math.sin(x / 4 + k) * 2), '#9aa8c8', 0.6);
  p.rect(26, 50, 62, 84, '#8d8f94');
  p.gradV(28, 52, 58, 80, ['#b4b6ba', '#7a7c82']);
  p.ellipseF(57, 82, 13, 15, () => ['#5a5c62']);
  p.ellipseF(57, 120, 24, 14, () => ['#3a3c44']);
  p.rect(53, 94, 8, 10, '#5a5c62');
  for (const [x, y] of [[26, 50], [86, 50], [26, 132], [86, 132]] as const) p.rect(x - 1, y - 1, 3, 3, '#3a3a3a');
  p.ring(84, 128, 18, 18, '#6a4a9a', 0.7, 1.5);
  p.ring(84, 128, 13, 13, '#6a4a9a', 0.5, 1);
  for (let a = 0; a < Math.PI * 2; a += 0.35) p.set(84 + Math.cos(a) * 15.5, 128 + Math.sin(a) * 15.5, '#6a4a9a', 0.6);
  for (const y of [64, 84, 104, 128]) for (let x = 108; x < 290; x += 2) p.set(x, y, '#8a8676');
  return {
    px: p,
    texts: [
      { s: 'ПРОПУСК № 0417', x: 26, y: 27, size: 11, color: '#e8f1ff', font: 'PT Sans' },
      { s: 'ИНСПЕКТОР Л.', x: 110, y: 61, size: 12, color: '#1b1a2e', font: 'PT Sans' },
      { s: 'Комиссия по оформлению отчёта', x: 110, y: 81, size: 9, color: '#3a3a44', font: 'PT Sans' },
      { s: 'Допуск: площадка № 1', x: 110, y: 101, size: 9, color: '#3a3a44', font: 'PT Sans' },
      { s: 'Выдан:', x: 110, y: 124, size: 11, color: '#1b1a2e', font: 'PT Sans' },
      { s: '13.0?.1961', x: 160, y: 124, size: 12, color: '#1b1a2e', font: 'PT Sans', baseOnly: true },
      { s: '13.04.1961', x: 160, y: 124, size: 12, color: '#7a1830', font: 'PT Sans', detailOnly: true },
    ],
  };
}

function bootsArt(): LoupeArtOut {
  const p = new Px(LW, LH);
  for (let y = 0; y < LH; y++)
    for (let x = 0; x < LW; x++) {
      const n = fbm(x / 26, y / 18, 61, 4);
      let c: Col = mix('#b8904e', '#d8b878', n);
      if (fbm(x / 8, y / 8, 62, 2) > 0.72) c = sh(c, -0.08);
      p.set(x, y, c);
    }
  const r = rng(61);
  for (let i = 0; i < 9; i++) {
    let x = r() * LW, y = r() * LH;
    for (let k = 0; k < 30; k++) { x += r() * 3 - 1; y += r() * 2 - 1; p.set(x, y, '#8a6a38', 0.6); }
  }
  for (const [x, y] of [[30, 30], [52, 54], [262, 40], [284, 70], [40, 140], [270, 150]] as const) {
    p.ellipseF(x, y, 7, 12, (_nx, ny) => [ny < 0.3 && ny > 0.1 ? '#c8a868' : '#9a7840', 0.6]);
    for (let k = -10; k < 10; k += 3) p.hl(x - 5, y + k, 10, '#8a6a38', 0.35);
  }
  for (const [bx, flip] of [[118, 1], [202, -1]] as const) {
    castBoot(p, bx, 118, flip);
  }
  speck(p, 80, 60, 180, 110, 9, ['#e8d0a0', '#f4e4c0'], 220, 0.7);
  return { px: p, texts: [{ s: 'ни пылинки', x: 132, y: 172, size: 11, color: '#2a1a0a', font: 'Caveat', detailOnly: true }] };
}

function castBoot(p: Px, cx: number, cy: number, flip: number): void {
  p.ellipse(cx + 8 * flip, cy + 14, 32, 9, '#3a2a10', 0.4);
  const sp = new Px(64, 116);
  const lit = (t: number): Col => {
    const k = Math.cos((t - 0.28) * Math.PI);
    if (Math.abs(t - 0.24) < 0.04) return '#f4f8ff';
    if (Math.abs(t - 0.3) < 0.03) return '#8a90a8';
    return mix('#050408', '#3a3848', Math.max(0, k) * 0.8);
  };
  for (let y = 18; y < 78; y++) for (let x = 14; x < 50; x++) sp.set(x, y, lit((x - 14) / 36));
  sp.ellipseF(32, 18, 18, 7, (nx, ny) => [ny < 0 ? lit((nx + 1) / 2) : '#020204']);
  sp.ellipseF(32, 19, 14, 4, () => ['#000000']);
  sp.ellipseF(32, 90, 22, 20, (nx, ny) => {
    const t = (nx + 1) / 2;
    let c = lit(t);
    if (ny < -0.6) c = mix(c, '#000000', 0.5);
    return [c];
  });
  sp.ellipse(26, 84, 6, 3, '#ffffff', 0.85);
  sp.hl(22, 96, 6, '#ffffff', 0.5);
  sp.ellipseF(32, 104, 24, 7, (_nx, ny) => [ny > 0 ? '#2a1e14' : '#120c0a']);
  for (let x = 10; x < 54; x += 3) sp.set(x, 104, '#5a4a3a');
  for (let k = 0; k < 5; k++) {
    const y = 50 + k * 6;
    sp.line(25, y, 39, y + 3, '#1a1820');
    sp.line(25, y + 3, 39, y, '#1a1820');
    sp.set(24, y, '#b8bcc8'); sp.set(40, y, '#b8bcc8');
  }
  sp.outline(0, '#000000');
  p.blit(sp, cx - 32, cy - 96, { flip: flip < 0 });
}

export function cardArt(kind: 'bark' | 'metronome' | 'vostok'): Px {
  const W = 200, H = 72;
  const p = new Px(W, H);
  if (kind === 'bark') {
    deskBg(p, 5, '#4a3424');
    birchSheet(p, 6, 6, 188, 60, 12);
    const r = rng(14);
    scratchRow(p, 18, 16, 96, r, '#5a3218', '#ffe0b0');
    scratchRow(p, 18, 28, 80, r, '#5a3218', '#ffe0b0');
    scratchRow(p, 18, 40, 92, r, '#5a3218', '#ffe0b0');
    const ink: Col = '#5a3218';
    const s = (x0: number, y0: number, x1: number, y1: number) => { p.line(x0, y0, x1, y1, ink); p.line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, '#ffe0b0', 0.5); };
    s(128, 40, 156, 40); s(128, 40, 124, 34); s(124, 34, 121, 36); s(156, 40, 160, 46);
    s(132, 40, 130, 54); s(138, 40, 140, 54); s(148, 40, 146, 54); s(154, 40, 156, 54);
    s(142, 40, 142, 24); p.ring(142, 20, 3, 3, ink); s(142, 28, 150, 32); s(142, 28, 134, 30);
    s(134, 30, 170, 12);
    s(166, 18, 176, 22); s(170, 12, 176, 22);
    s(170, 52, 182, 52); p.ring(185, 51, 2, 2, ink);
    return p;
  }
  if (kind === 'metronome') {
    p.gradV(0, 0, W, H, ['#1a2238', '#2a3654', '#3a4a68']);
    for (let i = 0; i < 40; i++) p.set(hash2(i, 1, 2) * W, hash2(i, 2, 2) * 30, '#c8d4ec', 0.5);
    const r = rng(3);
    let x = 0;
    while (x < W) {
      const w = 14 + r() * 26, h = 18 + r() * 26;
      p.rect(x, H - h, w, h, '#121828');
      for (let k = 0; k < 4; k++) if (r() > 0.75) p.rect(x + 3 + r() * (w - 6), H - h + 4 + r() * (h - 10), 2, 3, '#ffcf7a', 0.55);
      x += w;
    }
    p.line(40, H, 90, 0, '#c8d4ec', 0.15);
    p.line(41, H, 92, 0, '#c8d4ec', 0.1);
    p.line(170, H, 130, 0, '#c8d4ec', 0.12);
    p.rect(0, 0, 8, H, '#2a2018'); p.rect(W - 8, 0, 8, H, '#2a2018');
    p.line(8, 0, W - 8, H, '#e8e0cc', 0.6); p.line(8, H, W - 8, 0, '#e8e0cc', 0.6);
    p.line(9, 0, W - 7, H, '#e8e0cc', 0.4); p.line(9, H, W - 7, 0, '#e8e0cc', 0.4);
    p.ellipseF(46, 34, 20, 20, (nx, ny, r2) => [r2 > 0.8 ? '#0a0a0e' : mix('#2a2a30', '#141418', (nx + ny + 2) / 4)]);
    p.ring(46, 34, 12, 12, '#3a3a44');
    p.rect(44, 32, 5, 5, '#5a5a66');
    p.poly([[150, 62], [176, 62], [168, 16], [158, 16]], '#6a4a2a');
    p.poly([[152, 62], [174, 62], [167, 20], [159, 20]], '#8a6a3a');
    p.line(163, 56, 171, 22, '#d8d0b8');
    p.rect(167, 34, 5, 4, '#c8b888');
    p.outline(0, '#06060a');
    return p;
  }
  p.gradV(0, 0, W, H, ['#1a2a5a', '#4a5a9a', '#c88a8a', '#ffcf8a']);
  for (let i = 0; i < 30; i++) p.set(hash2(i, 5, 1) * W, hash2(i, 6, 1) * 22, '#ffffff', 0.6);
  for (let x = 0; x < W; x++) {
    const h = 6 + Math.round(fbm(x / 30, 0, 4, 2) * 4);
    p.vl(x, H - h, h, mix('#5a4a3a', '#7a6a4a', hash2(x, 1, 3)));
  }
  const cx = 100;
  p.rect(cx - 4, 10, 8, 46, '#e8ecf0');
  p.vl(cx - 4, 10, 46, '#ffffff');
  p.vl(cx + 3, 10, 46, '#a8b0bc');
  p.poly([[cx - 4, 10], [cx, 2], [cx + 4, 10]], '#d8dce4');
  for (const d of [-1, 1]) p.poly([[cx + d * 4, 30], [cx + d * 12, 50], [cx + d * 12, 58], [cx + d * 4, 56]], '#c8ccd4');
  p.rect(cx - 4, 24, 8, 2, '#5a6a8a');
  for (const d of [-1, 1]) {
    p.line(cx + d * 24, H - 6, cx + d * 8, 18, '#5a5a62');
    p.line(cx + d * 30, H - 6, cx + d * 9, 26, '#4a4a52');
    for (let y = 22; y < H - 6; y += 6) p.line(cx + d * 8 + d * ((y - 18) / 2.8), y, cx + d * 9 + d * ((y - 26) / 2.2), y + 4, '#4a4a52', 0.7);
  }
  const fl = new Px(W, H);
  fl.ellipseF(cx, 64, 10, 10, (_nx, _ny, r2) => [mix('#ffffff', '#ffb347', r2), 1 - r2 * 0.5]);
  for (let i = 0; i < 18; i++) fl.ellipseF(cx + (hash2(i, 1, 7) - 0.5) * 120, 64 + hash2(i, 2, 7) * 6, 8 + hash2(i, 3, 7) * 8, 5, () => ['#f4ece4', 0.7]);
  p.blit(fl, 0, 0);
  p.blit(blurPx(fl, 4, 2, 0.6), 0, 0);
  return p;
}

export function choiceArt(epoch: 1 | 2 | 3, which: 'truth' | 'agree'): Px {
  const W = 192, H = 108;
  const p = new Px(W, H);
  if (which === 'agree') {
    p.gradV(0, 0, W, H, ['#fff6d8', '#f4dc98', '#e6c36a']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) % 24 < 2) p.set(x, y, '#ffffff', 0.25);
    const r = rng(epoch * 7);
    p.rect(18, 14, W - 36, H - 28, '#fffaf0');
    p.rect(20, 16, W - 40, H - 32, '#fff4dc');
    for (let k = 0; k < 6; k++) {
      const y = 26 + k * 11;
      for (let x = 30; x < W - 30 - (k === 5 ? 60 : 0); x += 6) p.rect(x, y, 4 + Math.floor(r() * 2), 2, '#c8a858');
    }
    p.line(30, H - 20, 70, 16, '#ffffff', 0.6);
    p.line(36, H - 20, 76, 16, '#ffffff', 0.35);
    for (let x = 14; x < W - 14; x++) { p.set(x, 12, '#c8962a'); p.set(x, H - 13, '#c8962a'); }
    for (let y = 12; y < H - 12; y++) { p.set(14, y, '#c8962a'); p.set(W - 15, y, '#c8962a'); }
    for (const [x, y] of [[14, 12], [W - 15, 12], [14, H - 13], [W - 15, H - 13]] as const) p.poly([[x - 4, y], [x, y - 4], [x + 4, y], [x, y + 4]], '#ffd36b');
    for (let i = 0; i < 6; i++) { const y = r() * H; p.hl(0, y, W, '#a88aff', 0.2); }
    return p;
  }
  if (epoch === 1) {
    deskBg(p, 2, '#4a3424');
    birchSheet(p, 10, 12, 172, 84, 33);
    const r = rng(34);
    for (let k = 0; k < 5; k++) scratchRow(p, 22, 24 + k * 12, 92 - (k % 2) * 16, r, '#5a3218', '#ffe0b0');
    const ink: Col = '#5a3218';
    p.ring(150, 40, 9, 9, ink); p.set(147, 38, ink); p.set(153, 38, ink); p.line(147, 44, 153, 44, ink);
    p.line(150, 49, 150, 70, ink); p.line(150, 56, 140, 62, ink); p.line(150, 56, 162, 50, ink);
    p.line(150, 70, 143, 82, ink); p.line(150, 70, 158, 82, ink);
    p.line(162, 50, 170, 34, ink);
    return p;
  }
  if (epoch === 2) {
    deskBg(p, 8, '#3a3a4a');
    for (let y = 8; y < H - 8; y++) for (let x = 14; x < W - 14; x++) {
      let c: Col = mix('#e0dbc8', '#c4bea6', fbm(x / 30, y / 20, 8, 3) * 0.6);
      if ((y - 16) % 11 === 0) c = mix(c, '#8aa0c0', 0.35);
      p.set(x, y, c);
    }
    const r = rng(9);
    for (let k = 0; k < 7; k++) {
      let x = 22;
      const y = 22 + k * 11, end = W - 28 - (k === 6 ? 70 : r() * 20);
      while (x < end) {
        const L = 3 + r() * 10;
        for (let i = 0; i < L; i++) p.set(x + i, y - 2 + Math.round(Math.sin((x + i) * 1.3) * 1.5), '#4a4a58', 0.75);
        x += L + 3;
      }
    }
    p.ring(58, 31, 14, 6, '#4a4a58', 0.8);
    p.rect(160, 70, 8, 22, '#e8e0cc'); p.set(164, 68, '#ffcf7a'); p.set(164, 67, '#fff4cf');
    p.ellipse(164, 64, 6, 6, '#ffcf7a', 0.3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = Math.min(x, y, W - 1 - x, H - 1 - y); if (e < 10 && fbm(x / 5, y / 5, 2, 2) > 0.3 + e / 18) p.set(x, y, '#e0ecf8', 0.6); }
    return p;
  }
  deskBg(p, 4, '#4a4a3e');
  speck(p, 0, 0, W, H, 5, ['#c8a868', '#a88848'], 500, 0.6);
  for (let y = 10; y < H - 10; y++) for (let x = 20; x < W - 20; x++) {
    let c: Col = mix('#dcd6c0', '#c0b89c', fbm(x / 24, y / 16, 6, 3) * 0.7);
    if ((y - 20) % 10 === 0) c = mix(c, '#7a8aa0', 0.3);
    if (x === 52) c = mix(c, '#7a8aa0', 0.5);
    p.set(x, y, c);
  }
  const r = rng(12);
  for (let k = 0; k < 7; k++) {
    const y = 18 + k * 10;
    for (let x = 24; x < 48; x += 4) p.rect(x, y, 3, 3, '#2a2a3a', 0.8);
    let x = 56;
    while (x < W - 30 - r() * 30) { const L = 3 + r() * 8; p.hl(x, y + 1, L, '#2a2a3a', 0.8); p.hl(x, y + 2, L - 1, '#2a2a3a', 0.4); x += L + 3; }
  }
  p.line(56, 59, 120, 59, '#2a2a3a'); p.hl(124, 58, 30, '#1a3a8a', 0.9); p.hl(124, 59, 28, '#1a3a8a', 0.5);
  for (const [x, y] of [[160, 80], [36, 86]] as const) p.ellipse(x, y, 6, 8, '#a88848', 0.4);
  return p;
}

export function panelModule(seed: number): Px {
  const W = 88, H = 34, p = new Px(W, H), r = rng(seed);
  const M = ramp('#56685c');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, mix(M[1], M[2], fbm(x / 20, y / 10, seed, 3) * 0.6));
  p.hl(0, 0, W, M[4]); p.vl(0, 0, H, M[3]); p.hl(0, H - 1, W, M[0]); p.vl(W - 1, 0, H, M[0]);
  p.hl(1, H - 2, W - 2, sh(M[1], -0.1));
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]] as const) { p.set(x, y, '#c8d0c8'); p.set(x + 1, y + 1, '#1a221e'); p.set(x + 1, y, M[3]); }
  p.rect(14, 7, W - 28, 15, '#0a120e');
  p.hl(14, 7, W - 28, '#000000');
  p.hl(15, 21, W - 30, '#2a3a30');
  for (let x = 16; x < W - 16; x += 2) p.set(x, 8, '#3a5a48', 0.6);
  for (let i = 0; i < 4; i++) {
    const x = 18 + i * 8;
    p.rect(x, 25, 4, 4, '#1a1a1a');
    p.rect(x + 1, 26, 2, 2, ['#7dffb0', '#ffcf7a', '#5fe3ff', '#ff9a6a'][Math.floor(r() * 4)]);
  }
  for (let i = 0; i < 3; i++) { const x = W - 34 + i * 7; p.rect(x, 25, 3, 5, '#c8c8c0'); p.set(x + 1, 24, '#ffffff'); p.set(x + 1, 30, '#2a2a2a'); }
  return p;
}
export function panelTile(): Px {
  const p = new Px(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    let c: Col = mix('#2a3a32', '#34463c', fbm(x / 16, y / 16, 7, 3));
    if (x === 0 || y === 0) c = '#1a2620';
    if (x === 1 || y === 1) c = '#46584c';
    p.set(x, y, c);
  }
  for (const [x, y] of [[5, 5], [58, 5], [5, 58], [58, 58]] as const) { p.set(x, y, '#8a9a90'); p.set(x + 1, y + 1, '#101814'); }
  return p;
}

export const scratchRowPublic = scratchRow;
export const birchSheetPublic = birchSheet;
