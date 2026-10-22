import { blurPx, fbm, hash2, mix, Px, ramp, rng, sh, type Col } from './px';
import { scratchRowPublic as scratchRow, birchSheetPublic as birchSheet } from './art_ui';

export const SW = 320, SH = 180;

function addGlow(p: Px, src: Px, R = 6, gain = 0.8): void {
  p.blit(blurPx(src, R, 2, gain), 0, 0);
  p.blit(src, 0, 0);
}

export function memServers(): Px {
  const p = new Px(SW, SH), r = rng(5);
  const VX = 160, VY = 70;
  p.gradV(0, 0, SW, SH, ['#05080f', '#0a1428', '#0e1c36', '#0a1222']);
  for (let y = VY + 6; y < SH; y++) {
    const t = (y - VY) / (SH - VY);
    p.hl(0, y, SW, mix('#0a1222', '#142640', t), 1);
    if (Math.floor(Math.pow(t, 0.5) * 18) !== Math.floor(Math.pow((y - 1 - VY) / (SH - VY), 0.5) * 18)) p.hl(0, y, SW, '#1d3a5e', 0.7);
  }
  for (let k = -12; k <= 12; k++) p.line(VX, VY + 6, VX + k * 40, SH, '#1d3a5e', 0.5);
  for (const side of [-1, 1]) {
    for (let i = 7; i >= 0; i--) {
      const d = 1 / (1 + i * 0.55);
      const x0 = VX + side * (26 + 130 * d), w = 90 * d * 0.55, top = VY - 70 * d, bot = VY + 6 + 104 * d;
      const xa = side > 0 ? x0 : x0 - w;
      p.rect(xa, top, w, bot - top, mix('#060c18', '#10213c', d));
      p.vl(side > 0 ? xa : xa + w - 1, top, bot - top, '#2a4a74', 0.8);
      for (let y = top + 3; y < bot - 3; y += Math.max(2, 7 * d)) {
        p.hl(xa + 2, y, w - 4, '#162c4e');
        for (let k = 0; k < w - 6; k += Math.max(2, 5 * d)) if (r() > 0.55) p.set(xa + 3 + k, y + 1, r() > 0.7 ? '#ffd36b' : '#5fe3ff', 0.4 + d * 0.6);
      }
    }
  }
  const L = new Px(SW, SH);
  L.ellipseF(VX, VY - 6, 6, 6, (_x, _y, r2) => ['#ffffff', 1 - r2 * 0.3]);
  for (let t = 0; t < 1; t += 0.002) {
    const y = VY - 6 - t * 90;
    const a = t * 9;
    L.set(VX + Math.sin(a) * (6 + t * 40), y, '#5fe3ff', 1 - t * 0.6);
    L.set(VX + Math.sin(a + Math.PI) * (6 + t * 40), y, '#ffd36b', 1 - t * 0.6);
  }
  addGlow(p, L, 6, 1);
  return p;
}

export function memPurge(): Px {
  const p = new Px(SW, SH), r = rng(8);
  p.gradV(0, 0, SW, SH, ['#120e28', '#1e1844', '#2a2258']);
  for (let i = 0; i < 6; i++) {
    const x = 6 + i * 54;
    p.rect(x, 20, 46, 150, '#1a1430');
    for (let s2 = 0; s2 < 6; s2++) {
      const y = 28 + s2 * 24;
      p.hl(x, y + 20, 46, '#3a2a54');
      let bx = x + 2;
      while (bx < x + 44) {
        const bw = 2 + Math.floor(r() * 3), bh = 12 + Math.floor(r() * 7);
        p.rect(bx, y + 20 - bh, bw, bh, ['#6a3a4a', '#3a4a6a', '#5a4a2a', '#2a5a4a', '#6a5a3a'][Math.floor(r() * 5)]!);
        p.vl(bx, y + 20 - bh, bh, '#ffffff', 0.12);
        bx += bw + 1;
      }
    }
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * SW, y = r() * SH;
    const beyond = x + y * 0.7 > 250;
    if (beyond) {
      for (let k = 0; k < 6; k++) p.set(x + r() * 8, y + r() * 8, '#ffffff', 0.3 + r() * 0.4);
      continue;
    }
    p.rect(x, y, 8, 10, '#f4efe0');
    for (const k of [2, 4, 6]) p.hl(x + 1, y + k, 6, '#8a7f66');
    p.vl(x + 8, y + 1, 10, '#000000', 0.3);
  }
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const d = x + y * 0.7 - 250 + fbm(x / 12, y / 12, 3, 3) * 30;
    if (d > 0) p.set(x, y, '#ffffff', Math.min(0.92, d / 60));
    else if (d > -6 && hash2(x, y, 4) > 0.6) p.set(x, y, '#e8f4ff', 0.8);
  }
  return p;
}

export function memSplit(): Px {
  const p = new Px(SW, SH);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const n = fbm(x / 60, y / 40, 9, 3);
    p.set(x, y, x < SW / 2 ? mix('#1a1000', '#2a1d00', n) : mix('#0c0828', '#1a0f3a', n));
  }
  const L = new Px(SW, SH);
  for (let y = 0; y < SH; y++) {
    const off = Math.round(Math.sin(y * 0.09) * 4);
    const gap = 2 + Math.max(0, (y - 40) / 12);
    for (let k = 0; k < 18; k++) {
      L.set(SW / 2 - gap - k + off, y, mix('#fff4cf', '#ffb347', k / 18), 1 - k / 22);
      L.set(SW / 2 + gap + k + off, y, mix('#e8dcff', '#8a5cff', k / 18), 1 - k / 22);
    }
    if (gap < 4) L.set(SW / 2 + off, y, '#ffffff');
  }
  const r = rng(4);
  for (let i = 0; i < 40; i++) {
    const left = r() > 0.5, x = SW / 2 + (left ? -1 : 1) * (24 + r() * 120), y = 40 + r() * 140;
    L.poly([[x, y], [x + 3, y - 2], [x + 4, y + 3]], left ? '#ffd36b' : '#a88aff', 0.8);
  }
  addGlow(p, L, 8, 1);
  return p;
}

export function slideBirchPx(smile = false): Px {
  const p = new Px(SW, SH);
  const W = ramp('#4a3424');
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) p.set(x, y, mix(W[1], W[2], fbm(x / 80, y / 5, 2, 4)));
  p.rect(30, 26, 268, 140, '#000000', 0.4);
  birchSheet(p, 22, 16, 272, 144, 77);
  const r = rng(78);
  for (let k = 0; k < 7; k++) scratchRow(p, 40, 36 + k * 16, 110 - (k % 3) * 14, r, '#5a3218', '#ffe0b0', 1.3);
  const ink: Col = '#4a2a14', hi: Col = '#ffe8c0';
  const s = (x0: number, y0: number, x1: number, y1: number) => { p.line(x0, y0, x1, y1, ink); p.line(x0 + 1, y0, x1 + 1, y1, ink); p.line(x0 + 1, y0 + 2, x1 + 1, y1 + 2, hi, 0.4); };
  s(176, 104, 236, 102); s(176, 104, 168, 90); s(168, 90, 160, 94); s(160, 94, 166, 98); s(236, 102, 246, 116);
  s(184, 104, 180, 132); s(196, 104, 200, 132); s(220, 104, 216, 132); s(232, 104, 236, 132);
  for (let k = 0; k < 4; k++) s(180 + k * 14, 104, 186 + k * 14, 112);
  s(206, 104, 206, 70); p.ring(206, 62, 7, 7, ink, 1, 2);
  s(206, 78, 222, 86); s(206, 78, 190, 84); s(190, 84, 260, 46);
  s(252, 54, 266, 62); s(260, 46, 266, 62);
  if (smile) {
    p.set(203, 60, ink); p.set(204, 60, ink); p.set(209, 60, ink); p.set(210, 60, ink);
    p.line(202, 64, 204, 66, ink); p.line(204, 66, 208, 66, ink); p.line(208, 66, 210, 64, ink);
  } else {
    p.set(203, 61, ink); p.set(209, 61, ink); p.hl(204, 65, 5, ink);
  }
  scratchRow(p, 176, 140, 56, rng(3), '#5a3218', '#ffe0b0', 1.2);
  void sh;
  return p;
}

export function slideMetronomePx(): Px {
  const p = new Px(SW, SH), r = rng(41);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    let c: Col = mix('#2a2a38', '#34344a', fbm(x / 30, y / 30, 4, 3));
    if (x % 24 < 1) c = sh(c, -0.06);
    if ((x % 24) - 12 === 0 && y % 8 < 3) c = sh(c, 0.05);
    p.set(x, y, c);
  }
  const WX = 168, WY = 16, WW = 132, WH = 118;
  p.gradV(WX, WY, WW, WH, ['#0e1428', '#1a2440', '#2a3654']);
  for (let i = 0; i < 30; i++) p.set(WX + r() * WW, WY + r() * 50, '#c8d4ec', 0.6);
  let x = WX;
  while (x < WX + WW) {
    const w = 10 + r() * 22, h = 30 + r() * 40;
    p.rect(x, WY + WH - h, w, h, '#0c1020');
    if (r() > 0.6) p.rect(x + 3, WY + WH - h + 6, 2, 3, '#ffcf7a', 0.4);
    x += w;
  }
  p.line(WX + 20, WY + WH, WX + 60, WY, '#c8d4ec', 0.14);
  p.line(WX + 110, WY + WH, WX + 80, WY, '#c8d4ec', 0.1);
  const F = ramp('#5a4632');
  p.rect(WX - 6, WY - 6, WW + 12, 6, F[2]); p.rect(WX - 6, WY + WH, WW + 12, 8, F[1]);
  p.rect(WX - 6, WY, 6, WH, F[2]); p.rect(WX + WW, WY, 6, WH, F[1]);
  p.rect(WX + WW / 2 - 2, WY, 4, WH, F[2]); p.rect(WX, WY + 46, WW, 4, F[2]);
  for (const [x0, x1] of [[WX, WX + WW / 2 - 2], [WX + WW / 2 + 2, WX + WW]] as const)
    for (const [y0, y1] of [[WY, WY + 46], [WY + 50, WY + WH]] as const) {
      p.line(x0, y0, x1, y1, '#e8e0cc', 0.8); p.line(x0, y0 + 1, x1, y1 + 1, '#e8e0cc', 0.5);
      p.line(x0, y1, x1, y0, '#e8e0cc', 0.8); p.line(x0, y1 - 1, x1, y0 - 1, '#e8e0cc', 0.5);
    }
  p.ellipseF(70, 52, 30, 30, (nx, ny, r2) => [r2 > 0.88 ? '#08080a' : mix('#2c2c32', '#121216', (nx + ny + 2) / 4)]);
  for (const k of [18, 10]) p.ring(70, 52, k, k, '#3a3a44');
  p.rect(66, 48, 8, 8, '#5a5a66'); p.set(67, 49, '#9a9aa6');
  p.line(70, 22, 70, 6, '#141418'); p.line(71, 22, 71, 6, '#141418');
  p.rect(0, 136, 168, 44, '#2a1e16'); p.hl(0, 136, 168, '#4a3626'); p.hl(0, 137, 168, '#3a2a1c');
  p.poly([[96, 134], [126, 134], [118, 84], [104, 84]], '#5a3a1e');
  p.poly([[99, 132], [123, 132], [116, 88], [106, 88]], '#7a5a2e');
  p.line(111, 128, 120, 92, '#e8e0c8'); p.rect(117, 104, 5, 4, '#c8b888');
  p.hl(96, 134, 30, '#2a1a0e');
  p.rect(30, 124, 10, 12, '#4a4a52'); p.vl(35, 118, 6, '#2a2a2a');
  const fl = new Px(SW, SH);
  fl.ellipseF(35, 114, 2, 4, () => ['#fff4cf']);
  fl.ellipseF(35, 116, 3, 6, () => ['#ffb347', 0.6]);
  addGlow(p, fl, 10, 0.9);
  p.poly([[50, 140], [86, 138], [90, 156], [52, 158]], '#e0dbc8');
  for (let k = 0; k < 4; k++) p.line(55, 144 + k * 3, 84, 142 + k * 3, '#6a6a7a', 0.6);
  p.line(84, 150, 96, 146, '#c8b080');
  return p;
}

export function slideVostokPx(launch = false): Px {
  const p = new Px(SW, SH), r = rng(61);
  p.gradV(0, 0, SW, SH, ['#0e1a44', '#2a3a7a', '#7a6a9a', '#e8a07a', '#ffd89a']);
  for (let i = 0; i < 50; i++) p.set(r() * SW, r() * 60, '#ffffff', 0.3 + r() * 0.5);
  for (let x = 0; x < SW; x++) {
    const h = 20 + Math.round(fbm(x / 50, 0, 4, 3) * 8);
    for (let y = SH - h; y < SH; y++) p.set(x, y, mix('#3a2e26', '#5a4a3a', (y - (SH - h)) / h * 0.5 + hash2(x, y, 2) * 0.2));
  }
  const cx = 160, top = 24, bot = 150;
  for (const d of [-1, 1]) {
    const bx = cx + d * 40, tx = cx + d * 14;
    for (let y = top + 20; y < bot + 4; y += 8) {
      const t = (y - top - 20) / (bot - top - 16);
      const ax = tx + (bx - tx) * t;
      const t2 = (y + 8 - top - 20) / (bot - top - 16);
      const ax2 = tx + (bx - tx) * t2;
      p.line(ax, y, ax2 + d * 8, y + 8, '#3a3a44');
      p.line(ax + d * 8, y, ax2, y + 8, '#3a3a44');
      p.hl(Math.min(ax, ax + d * 8), y, 9, '#4a4a54');
    }
    p.line(tx, top + 20, bx, bot + 4, '#5a5a66'); p.line(tx + d * 8, top + 20, bx + d * 8, bot + 4, '#5a5a66');
    for (let k = 0; k < 4; k++) p.set(tx + d * 4, top + 30 + k * 26, '#ffcf7a');
  }
  const R = ramp('#c8ccd4');
  for (let y = top; y < bot; y++) {
    const w = y < top + 18 ? Math.max(1, ((y - top) / 18) * 7) : 7;
    for (let x = -w; x <= w; x++) {
      const t = (x + w) / (2 * w);
      p.set(cx + x, y, t < 0.25 ? R[4] : t < 0.6 ? R[3] : t < 0.85 ? R[2] : R[1]);
    }
  }
  p.hl(cx - 7, top + 40, 15, '#5a6a8a'); p.hl(cx - 7, top + 74, 15, '#8a92a0');
  for (const d of [-1, 1]) {
    for (let y = top + 70; y < bot; y++) {
      const w = Math.min(7, (y - top - 70) / 4);
      for (let x = 0; x <= w; x++) p.set(cx + d * (8 + x), y, x < w / 2 ? R[3] : R[2]);
    }
  }
  p.rect(cx - 50, bot, 100, 8, '#2a2a30'); p.hl(cx - 50, bot, 100, '#5a5a66');
  const fx = new Px(SW, SH);
  for (let i = 0; i < 26; i++) {
    const a = (r() - 0.5) * 220;
    fx.ellipseF(cx + a, bot + 6 + Math.abs(a) * 0.05, 10 + r() * 12, 6 + r() * 4, (_x, ny) => [ny < 0 ? '#ffffff' : '#c8c8d8', 0.75]);
  }
  if (launch) {
    fx.ellipseF(cx, bot + 4, 12, 18, (_x, _y, r2) => [mix('#ffffff', '#ffb347', r2), 1 - r2 * 0.4]);
  }
  addGlow(p, fx, launch ? 10 : 4, launch ? 1 : 0.5);
  for (const [x0, x1] of [[20, 130], [300, 190]] as const) for (let k = 0; k < 3; k++) p.line(x0 + k, SH - 20, x1 + k * 3, 0, '#fff4cf', 0.08);
  return p;
}

export function solidPx(c: Col): Px {
  return new Px(8, 8).rect(0, 0, 8, 8, c);
}

export function finalArt(kind: 'merge' | 'keeper' | 'editor'): Px {
  const W = 160, H = 90, p = new Px(W, H);
  if (kind === 'merge') {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, mix(x < W / 2 ? '#2a1a08' : '#140c2e', '#3a2a40', Math.abs(x - W / 2) < 10 ? 0.6 : fbm(x / 30, y / 20, 3, 3) * 0.4));
    const L = new Px(W, H);
    for (let t = 0; t < 1; t += 0.003) {
      const y = H - t * H;
      const amp = 34 * (1 - t);
      L.set(W / 2 + Math.sin(t * 10) * amp, y, '#ffd36b', 1);
      L.set(W / 2 + Math.sin(t * 10 + Math.PI) * amp, y, '#a88aff', 1);
      if (t > 0.7) L.ellipseF(W / 2, y, 2 + (t - 0.7) * 10, 1, () => ['#fff4cf', 0.5]);
    }
    L.ellipseF(W / 2, 14, 10, 10, (_x, _y, r2) => ['#ffffff', 1 - r2]);
    addGlow(p, L, 5, 1);
    return p;
  }
  if (kind === 'keeper') {
    p.gradV(0, 0, W, H, ['#e8eef4', '#c8d0dc', '#b0bac8']);
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 26;
      p.rect(x, 10, 22, 50, '#9aa4b2'); p.hl(x, 10, 22, '#eef2f6');
      for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 2; c++) { p.rect(x + 2 + c * 10, 14 + r2 * 11, 8, 9, '#b8c2ce'); p.hl(x + 4 + c * 10, 18 + r2 * 11, 4, '#6a7482'); }
    }
    p.rect(0, 62, W, 28, '#a8b2be');
    for (let x = 0; x < W; x += 16) p.vl(x, 62, 28, '#98a2ae');
    p.rect(76, 52, 6, 14, '#5a6a7a'); p.ellipseF(79, 49, 3, 3, () => ['#5a6a7a']);
    for (let i = 0; i < 40; i++) p.set(100 + hash2(i, 1, 1) * 16, 44 + hash2(i, 2, 1) * 22, '#ffd36b', 0.3 + hash2(i, 3, 1) * 0.4);
    return p;
  }
  p.rect(0, 0, W, H, '#f6f4ee');
  for (let y = 40; y < H; y += 8) p.hl(0, y, W, '#e6e2d8');
  p.rect(30, 10, 100, 24, '#3a3428'); p.rect(32, 12, 96, 20, '#1a1610');
  const L = new Px(W, H);
  const word = [0x1f, 0x15, 0x15, 0x0a, 0, 0x1f, 0x11, 0x11, 0, 0x1f, 0x15, 0x11, 0, 0, 0x1b, 0x04, 0x1b, 0, 0x1f, 0x11, 0x1f, 0, 0x1f, 0x05, 0x07, 0, 0x1f, 0x11, 0x1f, 0, 0x1f, 0x10, 0x1f, 0x10, 0x1f, 0, 0x1f, 0x11, 0x1f];
  word.forEach((col, i) => { for (let b = 0; b < 5; b++) if (col & (1 << b)) L.rect(38 + i * 2, 15 + b * 3, 1, 2, '#ffd36b'); });
  addGlow(p, L, 3, 1);
  for (let i = 0; i < 5; i++) { p.rect(16 + i * 30, 2, 18, 3, '#ffffff'); }
  p.rect(77, 58, 6, 16, '#d8d4c8'); p.ellipseF(80, 55, 3, 3, () => ['#d8d4c8']);
  return p;
}
