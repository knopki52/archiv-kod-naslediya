import { mix, Px, ramp, rng, sh, type Col, type Rng } from './px';

export interface Art {
  p: Px;
  e: Px;
}
export const BOOK_COLS = ['#6a2a3a', '#2a3a6a', '#2a5a5a', '#5a5a2a', '#7a4a22', '#4a2a5a', '#3a4a2a', '#8a6a3a', '#5a2a2a', '#2a4a7a'];

export function bookCol(r: Rng, mute = 0): Col {
  return mix(BOOK_COLS[Math.floor(r() * BOOK_COLS.length)]!, '#4a4a52', mute);
}

export function bookRow(p: Px, e: Px, x: number, y: number, w: number, h: number, r: Rng, glow = 0, mute = 0, glowCols: string[] = ['#5fe3ff', '#a88aff']): void {
  let cx = x;
  while (cx < x + w - 1) {
    const bw = 2 + Math.floor(r() * 3);
    if (cx + bw > x + w) break;
    if (r() < 0.07) {
      cx += bw;
      continue;
    }
    const bh = h - Math.floor(r() * 4);
    const col = bookCol(r, mute);
    const R = ramp(col);
    const lean = r() < 0.08 && cx + bw + 2 < x + w;
    for (let i = 0; i < bw; i++)
      for (let yy = 0; yy < bh; yy++) {
        const yy2 = y + h - 1 - yy;
        let c = i === 0 ? R[3] : i === bw - 1 ? R[1] : R[2];
        if (yy === bh - 1) c = R[4];
        p.set(cx + i + (lean ? Math.floor(yy / 5) : 0), yy2, c);
      }
    if (r() < 0.6) {
      const by = y + h - bh + 2 + Math.floor(r() * 2);
      p.hl(cx, by, bw, mute ? '#8a7a50' : '#c8a050');
      p.hl(cx, by + bh - 5, bw, sh(col, -0.4));
    }
    if (glow && r() < glow) {
      const gc = glowCols[Math.floor(r() * glowCols.length)]!;
      for (let yy = 1; yy < bh - 1; yy++) if (r() < 0.75) e.set(cx + Math.floor(bw / 2), y + h - 1 - yy, gc, 0.95);
      e.set(cx, y + h - bh + 1, '#ffffff', 0.9);
    }
    cx += bw + (r() < 0.15 ? 1 : 0);
  }
}

export function wallShelf(w: number, h: number, seed: number, glow = 0.12, mute = 0, wood = '#3a2436'): Art {
  const p = new Px(w, h), e = new Px(w, h), r = rng(seed);
  const WD = ramp(wood);
  p.rect(0, 0, w, h, WD[1]);
  p.rect(0, 0, w, 4, WD[2]);
  p.hl(0, 0, w, WD[3]);
  p.hl(0, 3, w, WD[0]);
  p.vl(0, 0, h, WD[2]);
  p.vl(1, 4, h - 4, WD[3]);
  p.vl(w - 1, 0, h, WD[0]);
  p.vl(w - 2, 4, h - 4, WD[1]);
  const rows = Math.floor((h - 6) / 15);
  for (let i = 0; i < rows; i++) {
    const y = 4 + i * 15;
    p.rect(2, y, w - 4, 13, '#120a16');
    p.dither(2, y, w - 4, 3, '#000000', 0.5);
    bookRow(p, e, 3, y + 1, w - 6, 12, r, glow, mute);
    p.rect(1, y + 13, w - 2, 2, WD[2]);
    p.hl(1, y + 13, w - 2, WD[4]);
    p.hl(1, y + 14, w - 2, WD[1]);
  }
  p.rect(0, h - 3, w, 3, WD[1]);
  p.hl(0, h - 3, w, WD[3]);
  return { p, e };
}

export function standShelf(w: number, hFace: number, seed: number, glow = 0.1, mute = 0, wood = '#3a2436'): Art {
  const top = 7;
  const p = new Px(w, hFace + top), e = new Px(w, hFace + top);
  const WD = ramp(wood);
  p.rect(0, 0, w, top, WD[3]);
  p.hl(0, 0, w, WD[4]);
  p.hl(1, top - 1, w - 2, WD[2]);
  for (let x = 2; x < w - 2; x += 5) p.vl(x, 1, top - 2, sh(wood, 0.15));
  const s = wallShelf(w, hFace, seed, glow, mute, wood);
  p.blit(s.p, 0, top);
  e.blit(s.e, 0, top);
  return { p, e };
}

export function bookPile(seed: number, mute = 0): Px {
  const r = rng(seed), n = 3 + Math.floor(r() * 3), p = new Px(24, n * 4 + 2);
  for (let i = 0; i < n; i++) {
    const w = 14 + Math.floor(r() * 8), x = Math.floor(r() * (24 - w)), y = p.h - 4 - i * 4;
    const R = ramp(bookCol(r, mute));
    p.rect(x, y, w, 4, R[2]);
    p.hl(x, y, w, R[3]);
    p.hl(x, y + 3, w, R[1]);
    p.vl(x + w - 1, y, 4, '#e8dcc0');
    p.vl(x + w - 2, y + 1, 2, '#c8bca0');
  }
  p.outline(0, '#0a0814');
  return p;
}

export function stoneWall(p: Px, x: number, y: number, w: number, h: number, base: string, seed: number): void {
  const r = rng(seed), S = ramp(base);
  p.rect(x, y, w, h, S[1]);
  for (let row = 0; row * 12 < h; row++) {
    const off = row % 2 ? 16 : 0;
    for (let bx = -off; bx < w; bx += 32) {
      const yy = y + row * 12, k = (r() - 0.5) * 0.18;
      const c = sh(base, k);
      const x0 = x + Math.max(0, bx) + 1;
      p.rect(x0, yy + 1, Math.min(31, w - Math.max(0, bx) - 1), Math.min(10, y + h - yy - 1), c);
      p.hl(x0, yy + 1, Math.min(30, w - bx - 1), sh(base, k + 0.18));
      if (yy + 10 < y + h) p.hl(x0, yy + 10, Math.min(31, w - bx - 1), sh(base, k - 0.18));
      if (r() < 0.25) p.set(x + bx + 4 + Math.floor(r() * 20), yy + 4 + Math.floor(r() * 4), sh(base, -0.35));
    }
  }
}

export function ladder(h: number): Px {
  const p = new Px(17, h), W = ramp('#6a4a32');
  p.line(2, 0, 0, h - 1, W[2]);
  p.line(3, 0, 1, h - 1, W[1]);
  p.line(13, 0, 15, h - 1, W[2]);
  p.line(14, 0, 16, h - 1, W[1]);
  for (let y = 6; y < h; y += 10) {
    p.hl(2, y, 12, W[3]);
    p.hl(2, y + 1, 12, W[0]);
  }
  p.outline(0, '#0a0814');
  return p;
}

export function candleStand(): Art {
  const p = new Px(16, 44), e = new Px(16, 44);
  const G = ramp('#a8823a');
  p.vl(7, 10, 30, G[2]);
  p.vl(8, 10, 30, G[1]);
  p.ellipse(8, 41, 6, 2.5, G[1]);
  p.hl(3, 40, 10, G[3]);
  p.rect(2, 9, 12, 2, G[3]);
  p.hl(2, 10, 12, G[0]);
  for (const [x, dy] of [[3, 2], [8, -1], [13, 2]] as const) {
    p.rect(x - 1, 4 + dy, 2, 5, '#efe6cf');
    p.vl(x - 1, 4 + dy, 5, '#ffffff');
    e.ellipse(x - 0.5, 2 + dy, 1.6, 2.4, '#ffcf70');
    e.set(x - 1, 1 + dy, '#fff6d0');
  }
  return { p, e };
}

export function floatingPage(seed: number): Px {
  const r = rng(seed), p = new Px(10, 8);
  const a = r() * 3;
  p.poly([[1 + a, 0], [9, 1 + a * 0.5], [8 - a * 0.3, 7], [0, 6 - a * 0.4]], '#efe6cf');
  p.line(2 + a, 2, 7, 3, '#9a8a6a', 0.6);
  p.line(2 + a, 4, 6, 5, '#9a8a6a', 0.5);
  return p;
}

export function scatteredPages(p: Px, x0: number, y0: number, w: number, h: number, n: number, seed: number, col: Col = '#cfc6b0', skip?: (x: number, y: number) => boolean): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h;
    if (skip && skip(x, y)) continue;
    p.poly([[x, y], [x + 6, y - 1], [x + 7, y + 4], [x + 1, y + 5]], col);
    p.line(x + 1, y + 1, x + 5, y + 1, '#8a8070', 0.6);
  }
}

export function chair(wood = '#4a2e3a'): Px {
  const ch = new Px(18, 22), CR = ramp(wood);
  ch.rect(2, 0, 14, 12, CR[2]);
  ch.hl(2, 0, 14, CR[3]);
  ch.rect(4, 2, 10, 8, CR[1]);
  ch.rect(1, 12, 16, 5, CR[3]);
  ch.hl(1, 16, 16, CR[1]);
  ch.vl(2, 17, 5, CR[0]);
  ch.vl(15, 17, 5, CR[0]);
  ch.outline(0, '#0a0814');
  return ch;
}
