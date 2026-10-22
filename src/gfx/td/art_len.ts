import { bookPile, wallShelf, type Art } from './art_common';
import { bayer, fbm, hash2, mix, Px, ramp, rng, sh } from './px';

export function tallWindow(w: number, h: number, seed: number): Art {
  const p = new Px(w, h), e = new Px(w, h), r = rng(seed);
  const FR = ramp('#4a4038');
  p.rect(0, 0, w, h, FR[1]);
  p.rect(0, 0, w, 3, FR[3]);
  p.vl(0, 0, h, FR[2]);
  p.vl(w - 1, 0, h, FR[0]);
  const gx = 5, gy = 5, gw = w - 10, gh = h - 14;
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) p.set(gx + x, gy + y, mix('#0c1424', '#1a2840', y / gh));
  let bx = 0;
  while (bx < gw) {
    const bw = 10 + Math.floor(r() * 18), bh = 14 + Math.floor(r() * 26);
    p.rect(gx + bx, gy + gh - bh, Math.min(bw, gw - bx), bh, '#0a0e18');
    p.hl(gx + bx, gy + gh - bh, Math.min(bw, gw - bx), '#8a9ab4');
    bx += bw + 1;
  }
  for (let i = 0; i < 18; i++) p.set(gx + r() * gw, gy + r() * gh * 0.6, '#c8d4ea', 0.8);
  e.ellipse(gx + gw * 0.7, gy + 16, 5, 5, '#dfe8f8', 0.9);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const d = Math.min(Math.hypot(x, y), Math.hypot(gw - x, y), Math.hypot(x, gh - y), Math.hypot(gw - x, gh - y));
      const n = fbm((gx + x) / 4, (gy + y) / 4, seed, 3);
      if (d < 6 + n * 26 && n > 0.42) p.set(gx + x, gy + y, '#c8d8ee', 0.35 + (n - 0.42) * 1.5);
    }
  p.rect(gx + Math.floor(gw / 2) - 1, gy, 3, gh, FR[2]);
  p.rect(gx, gy + Math.floor(gh * 0.38), gw, 3, FR[2]);
  const panes = [[gx, gy, gw / 2 - 1, gh * 0.38], [gx + gw / 2 + 2, gy, gw / 2 - 2, gh * 0.38], [gx, gy + gh * 0.38 + 3, gw / 2 - 1, gh * 0.62 - 3], [gx + gw / 2 + 2, gy + gh * 0.38 + 3, gw / 2 - 2, gh * 0.62 - 3]] as const;
  for (const [x, y, ww, hh] of panes)
    for (const [a, b, c, d] of [[x, y, x + ww, y + hh], [x + ww, y, x, y + hh]] as const) {
      p.line(a, b, c, d, '#c8bc9c');
      p.line(a + 1, b, c + 1, d, '#a89c7c');
    }
  p.rect(0, h - 9, w, 9, FR[3]);
  p.hl(0, h - 9, w, '#e8eef8');
  p.hl(0, h - 8, w, '#b8c4d8');
  p.hl(0, h - 1, w, FR[0]);
  return { p, e };
}

export function radioPlate(): Px {
  const p = new Px(26, 30);
  p.line(13, 0, 13, 4, '#1a1a1e');
  p.ellipseF(13, 16, 12, 12, (nx, ny, r2) => [r2 > 0.85 ? '#0a0a0e' : nx < -0.3 && ny < -0.3 ? '#3a3a44' : r2 < 0.08 ? '#4a4a54' : '#1e1e26']);
  for (let i = 0; i < 3; i++) p.ring(13, 16, 3 + i * 3, 3 + i * 3, '#2a2a34', 0.7, 1);
  p.line(13, 28, 18, 30, '#1a1a1e');
  p.outline(0, '#060608');
  return p;
}

export function burzhuika(frame = 0): Art {
  const p = new Px(40, 120), e = new Px(40, 120);
  const I = ramp('#3a3a42');
  const top = 82;
  p.rect(16, 0, 7, top, I[1]);
  p.vl(16, 0, top, I[3]);
  p.vl(22, 0, top, I[0]);
  for (let y = 10; y < top; y += 18) {
    p.hl(16, y, 7, I[0]);
    p.hl(15, y + 1, 9, I[2]);
  }
  p.rect(6, top, 28, 22, I[2]);
  p.vl(6, top, 22, I[3]);
  p.vl(33, top, 22, I[0]);
  p.rect(4, top - 3, 32, 4, I[3]);
  p.hl(4, top - 3, 32, I[4]);
  p.rect(12, top + 6, 16, 11, '#120806');
  const r = rng(frame + 11);
  e.rect(13, top + 8, 14, 9, '#ff7a2f');
  e.rect(15, top + 11, 10, 6, '#ffb347');
  e.rect(17, top + 13, 6, 4, '#fff0b0');
  for (let i = 0; i < 10; i++) e.set(13 + r() * 14, top + 7 + r() * 5, ['#ff9a40', '#ffcf70', '#ff5a1f'][Math.floor(r() * 3)]!);
  p.rect(28, top + 6, 4, 11, I[1]);
  e.rect(6, top + 4, 1, 16, '#ff7a2f', 0.25);
  e.hl(6, top, 28, '#ff7a2f', 0.18);
  for (const x of [7, 30]) p.rect(x, top + 22, 3, 8, I[0]);
  p.ellipse(28, top - 5, 5, 4, '#5a5e66');
  p.ellipse(27, top - 6, 2.5, 1.6, '#8a8e96');
  p.line(32, top - 6, 35, top - 9, '#5a5e66');
  p.outline(0, '#08080c');
  return { p, e };
}

export function readTable(w: number, seed: number, o: { lamp?: number; books?: number; candle?: number } = {}): Art {
  const h = 30, p = new Px(w, h + 10), e = new Px(w, h + 10), r = rng(seed);
  const WD = ramp('#4a3424');
  p.rect(0, 0, w, 18, WD[2]);
  p.hl(0, 0, w, WD[4]);
  for (let y = 3; y < 18; y += 4) p.hl(1, y, w - 2, sh('#4a3424', 0.1));
  p.rect(0, 18, w, 8, WD[1]);
  p.hl(0, 18, w, WD[3]);
  p.hl(0, 25, w, WD[0]);
  for (const x of [2, w - 6]) p.rect(x, 26, 4, h + 10 - 26, WD[0]);
  for (let i = 0; i < (o.books ?? 3); i++) {
    const x = 12 + Math.floor(r() * (w - 40)), y = 3 + Math.floor(r() * 8);
    p.poly([[x, y + 1], [x + 8, y], [x + 8, y + 6], [x, y + 7]], '#ddd2b8');
    p.poly([[x + 8, y], [x + 16, y + 1], [x + 16, y + 7], [x + 8, y + 6]], '#c8bca0');
    p.vl(x + 8, y, 6, '#8a7a60');
    for (let k = 0; k < 2; k++) {
      p.hl(x + 2, y + 2 + k * 2, 5, '#8a8070');
      p.hl(x + 10, y + 2 + k * 2, 5, '#8a8070');
    }
  }
  if (o.lamp !== undefined) {
    const lx = o.lamp;
    p.rect(lx - 1, 2, 3, 8, '#8a7a3a');
    p.poly([[lx - 7, 1], [lx + 7, 1], [lx + 5, 5], [lx - 5, 5]], '#2e4a3a');
    p.hl(lx - 6, 1, 13, '#4a6a54');
  }
  if (o.candle !== undefined) {
    const cx = o.candle;
    p.rect(cx, 4, 3, 6, '#e8dcc0');
    p.vl(cx, 4, 6, '#fff4dc');
    e.ellipse(cx + 1, 2, 1.5, 2.5, '#ffcf70');
    e.set(cx + 1, 1, '#fff6d0');
    p.ellipse(cx + 1.5, 10, 3, 1.2, '#c8bca0');
  }
  p.outline(0, '#0a0806');
  return { p, e };
}

export function parquet(p: Px, x0: number, y0: number, w: number, h: number): void {
  const P = ramp('#3e2c22');
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const u = x + y * 2, v = x - y * 2 + 2000;
      const a = Math.floor(u / 24), b = Math.floor(v / 8);
      const alt = (Math.floor(u / 48) + Math.floor(v / 48)) % 2;
      const pa = alt ? Math.floor(u / 8) : Math.floor(v / 8);
      const edge = alt ? u % 8 === 0 : v % 8 === 0;
      let c = sh(P[2], (hash2(pa, alt ? b : a, 3) - 0.5) * 0.2);
      if (edge) c = P[0];
      const n = fbm(x / 20, y / 14, 6, 3);
      if (n > 0.62) c = mix(c, '#5a463a', 0.3);
      p.set(x, y, c);
    }
}

export function stool(): Px {
  const p = new Px(14, 14), W = ramp('#4a3424');
  p.ellipse(7, 4, 6, 3, W[3]);
  p.hl(3, 2, 8, W[4]);
  p.rect(2, 5, 10, 2, W[1]);
  p.vl(3, 7, 7, W[0]);
  p.vl(10, 7, 7, W[0]);
  p.vl(6, 7, 6, W[1]);
  p.outline(0, '#0a0806');
  return p;
}
export function woodPile(): Px {
  const p = new Px(34, 16), W = ramp('#6a4a32');
  p.rect(2, 8, 18, 4, W[2]);
  p.hl(2, 8, 18, W[3]);
  p.line(8, 4, 30, 12, W[1]);
  p.line(8, 5, 30, 13, W[0]);
  p.rect(20, 9, 10, 5, '#4a4a3a');
  p.hl(20, 9, 10, '#6a6a5a');
  p.vl(29, 9, 5, '#d8ccb0');
  p.rect(4, 12, 12, 3, W[1]);
  p.outline(0, '#0a0806');
  return p;
}
export function catalog(): Px {
  const p = new Px(44, 46), W = ramp('#4a3424');
  p.rect(0, 0, 44, 8, W[3]);
  p.hl(0, 0, 44, W[4]);
  p.rect(0, 8, 44, 32, W[2]);
  p.vl(0, 8, 32, W[3]);
  p.vl(43, 8, 32, W[0]);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const x = 3 + c * 10, y = 10 + r * 7;
      p.rect(x, y, 8, 5, W[1]);
      p.hl(x, y, 8, W[3]);
      p.rect(x + 2, y + 2, 4, 1, '#d8ccb0');
      p.set(x + 3, y + 3, '#8a7a3a');
    }
  p.rect(2, 40, 4, 6, W[0]);
  p.rect(38, 40, 4, 6, W[0]);
  p.outline(0, '#0a0806');
  return p;
}
export function coatRack(): Px {
  const p = new Px(20, 56), W = ramp('#3a2a20');
  p.vl(9, 4, 50, W[2]);
  p.vl(10, 4, 50, W[1]);
  p.hl(4, 54, 12, W[1]);
  p.hl(5, 4, 10, W[3]);
  p.rect(2, 8, 8, 22, '#3a3c44');
  p.vl(2, 8, 22, '#4a4c56');
  p.rect(11, 6, 6, 10, '#4a4038');
  p.ellipse(14, 6, 4, 2, '#5a4a40');
  p.outline(0, '#0a0806');
  return p;
}
export function waterSled(): Px {
  const p = new Px(34, 22), W = ramp('#6a4a32');
  p.rect(2, 12, 24, 4, W[2]);
  p.hl(2, 12, 24, W[3]);
  for (const x of [6, 14, 22]) p.vl(x, 16, 3, W[0]);
  p.line(0, 19, 26, 19, '#8a8c94');
  p.line(26, 19, 29, 15, '#8a8c94');
  p.rect(5, 3, 9, 10, '#6a6e78');
  p.vl(5, 3, 10, '#8a8e98');
  p.ellipse(9.5, 3, 4.5, 1.5, '#9aa0aa');
  p.ellipse(9.5, 3, 3, 0.8, '#c8e0ff');
  p.rect(16, 6, 8, 7, '#5a5e68');
  p.ellipse(20, 6, 4, 1.4, '#7a7e88');
  for (let a = 0; a < Math.PI; a += 0.2) p.set(20 + Math.cos(a) * 4, 6 - Math.sin(a) * 5, '#3a3c44');
  p.line(29, 15, 32, 10, '#d8ccb0');
  p.outline(0, '#0a0806');
  return p;
}
export function wallClock(): Px {
  const p = new Px(16, 22), W = ramp('#4a3424');
  p.rect(2, 0, 12, 22, W[2]);
  p.vl(2, 0, 22, W[3]);
  p.ellipse(8, 7, 5, 5, '#d8d0bc');
  p.ring(8, 7, 5, 5, '#8a7a5a', 1, 1);
  p.line(8, 7, 8, 3, '#1a1a1a');
  p.line(8, 7, 11, 8, '#1a1a1a');
  p.rect(7, 13, 2, 6, '#8a7a3a');
  p.ellipse(8, 19, 2, 2, '#a89040');
  p.outline(0, '#0a0806');
  return p;
}
export function wallMap(): Px {
  const p = new Px(40, 28);
  p.rect(0, 0, 40, 28, '#4a3a2a');
  p.rect(2, 2, 36, 24, '#c8bc9c');
  for (let y = 3; y < 25; y++) for (let x = 3; x < 37; x++) if (fbm(x / 6, y / 5, 8, 3) > 0.5) p.set(x, y, '#a8b088');
  p.line(4, 20, 36, 8, '#6a7a9a');
  p.line(4, 21, 36, 9, '#8a9ab4');
  p.outline(0, '#0a0806');
  return p;
}
export function chairBlanket(): Px {
  const p = new Px(18, 26), W = ramp('#4a3424');
  p.rect(2, 0, 14, 12, W[2]);
  p.rect(1, 12, 16, 4, W[3]);
  p.vl(2, 16, 10, W[0]);
  p.vl(15, 16, 10, W[0]);
  p.poly([[1, 2], [17, 4], [16, 18], [12, 22], [3, 20]], '#5a5a6e');
  for (let y = 4; y < 20; y += 3) p.line(2, y, 16, y + 1, '#4a4a5c');
  p.outline(0, '#0a0806');
  return p;
}
export function libDoor(): Art {
  const p = new Px(40, 74), e = new Px(40, 74), W = ramp('#4a3424');
  p.rect(0, 0, 40, 74, W[1]);
  p.rect(2, 2, 36, 72, W[0]);
  for (const x of [4, 21]) {
    p.rect(x, 4, 15, 68, W[2]);
    p.rect(x + 2, 8, 11, 26, W[1]);
    p.rect(x + 2, 40, 11, 26, W[1]);
    p.hl(x, 4, 15, W[3]);
  }
  p.rect(17, 38, 2, 6, '#a89040');
  p.rect(22, 38, 2, 6, '#a89040');
  e.rect(3, 72, 34, 2, '#9ab0d0', 0.5);
  return { p, e };
}

export const LHALL = { W: 640, H: 360, FLOOR_Y: 132 } as const;

export function lenHallGround(): Art {
  const { W, H, FLOOR_Y } = LHALL;
  const A = new Px(W, H), E = new Px(W, H), r = rng(31);
  for (let y = 0; y < FLOOR_Y; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 30, y / 20, 2, 4);
      A.set(x, y, mix('#262b38', '#363d4e', n));
      if (fbm(x / 8, y / 8, 3, 2) > 0.74) A.set(x, y, '#20242e');
    }
  A.rect(0, 0, W, 8, '#1a1e28');
  A.hl(0, 8, W, '#4a5266');
  A.rect(0, 100, W, 32, '#2a221c');
  A.hl(0, 100, W, '#4a3c30');
  A.hl(0, 101, W, '#3a2e24');
  for (let x = 6; x < W; x += 44) {
    A.rect(x, 106, 36, 20, '#241c16');
    A.hl(x, 106, 36, '#1a140e');
    A.hl(x, 125, 36, '#3a2e24');
  }
  [44, 268, 492].forEach((x, i) => {
    const w = tallWindow(104, 104, 40 + i);
    A.blit(w.p, x, 6);
    E.blit(w.e, x, 6);
  });
  [[164, 1], [388, 2]].forEach(([x, sd]) => A.blit(wallShelf(88, 92, 60 + sd!, 0, 0.45, '#3a2a20').p, x!, 10));
  A.blit(wallShelf(36, 92, 73, 0, 0.45, '#3a2a20').p, 0, 10);
  A.blit(wallClock(), 382, 30);
  A.blit(radioPlate(), 236, 30);
  A.line(249, 0, 249, 30, '#14161c');
  for (let k = 0; k < 5; k++) {
    let x = 20 + k * 130 + r() * 40, y = 8;
    for (let i = 0; i < 30; i++) {
      A.set(x, y, '#1a1e28');
      x += r() * 2 - 1;
      y += 1;
    }
  }
  parquet(A, 0, FLOOR_Y, W, H - FLOOR_Y);
  for (let y = 0; y < 16; y++) A.rect(0, FLOOR_Y + y, W, 1, '#000000', 0.55 * (1 - y / 16));
  [44, 268, 492].forEach((x) => {
    for (let y = FLOOR_Y; y < FLOOR_Y + 130; y++) {
      const t = (y - FLOOR_Y) / 130, x0 = x + 14 + t * 60, x1 = x + 92 + t * 70;
      for (let xx = Math.floor(x0); xx < x1; xx++) if (bayer(xx, y) < 0.6) E.set(xx, y, '#a8c0e8', 0.1 * (1 - t));
    }
  });
  for (let i = 0; i < 18; i++) {
    const x = 20 + r() * 600, y = 150 + r() * 190;
    A.poly([[x, y], [x + 6, y - 1], [x + 7, y + 4], [x + 1, y + 5]], '#8a8274', 0.9);
  }
  return { p: A, e: E };
}

export const LYARD = { W: 800, H: 400, BASE: 150 } as const;

export function yardGround(): Art {
  const { W, H, BASE } = LYARD;
  const A = new Px(W, H), E = new Px(W, H), r = rng(51);
  for (let y = 0; y < BASE; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 26, y / 18, 5, 4);
      let c = mix('#4a4e5a', '#5e6270', n);
      if ((y % 18 === 0 || (x + (Math.floor(y / 18) % 2) * 20) % 40 === 0) && n > 0.35) c = sh(c, -0.12);
      A.set(x, y, c);
    }
  for (let y = 0; y < BASE; y += 1) if (fbm(5, y / 3, 2, 2) > 0.5) A.set(r() * W, y, '#3a3e48');
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 8; col++) {
      const x = 30 + col * 96, y = 12 + row * 64;
      if (col === 0 && row === 1) continue;
      A.rect(x - 3, y - 3, 34, 46, '#3a3e48');
      A.rect(x, y, 28, 40, '#141a26');
      A.rect(x + 13, y, 2, 40, '#3a3428');
      A.rect(x, y + 14, 28, 2, '#3a3428');
      for (const [a, b, c, d] of [[x, y, x + 13, y + 14], [x + 13, y, x, y + 14], [x + 15, y, x + 28, y + 14], [x + 28, y, x + 15, y + 14], [x, y + 16, x + 13, y + 40], [x + 13, y + 16, x, y + 40], [x + 15, y + 16, x + 28, y + 40], [x + 28, y + 16, x + 15, y + 40]] as const)
        A.line(a, b, c, d, '#b8ac8c');
      A.hl(x - 4, y + 41, 36, '#e8eef8');
      A.hl(x - 4, y + 42, 36, '#a8b4c8');
      if (r() < 0.12) A.rect(x + 2, y + 2, 10, 10, '#0a0c12');
    }
  for (const x of [262, 600]) {
    A.rect(x, 0, 6, BASE, '#5a5e66');
    A.vl(x, 0, BASE, '#7a7e86');
    for (let y = 20; y < BASE; y += 30) A.rect(x - 1, y, 8, 3, '#4a4e56');
    for (let i = 0; i < 4; i++) A.vl(x + 1 + i, BASE - 4, 3 + i % 2 * 2, '#d8f0ff');
  }
  A.rect(0, BASE - 10, W, 10, '#3a3a40');
  A.hl(0, BASE - 10, W, '#6a6a72');
  for (let y = BASE; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 40, y / 24, 7, 4), m = fbm(x / 9, y / 6, 8, 3);
      let c = mix('#aeb8cc', '#d8e0ee', Math.min(1, Math.max(0, (n - 0.3) * 2)));
      if (m < 0.36) c = mix(c, '#98a4bc', 0.4);
      A.set(x, y, c);
    }
  for (let x = 0; x < W; x++) {
    const hh = 6 + Math.round(fbm(x / 14, 2, 3, 3) * 12);
    for (let y = 0; y < hh; y++) A.set(x, BASE + y - 2, y < 2 ? '#e8eef8' : '#c8d0e0');
  }
  for (let i = 0; i < 400; i++) {
    const t = i / 400, x = 80 + t * 500, y = BASE + 30 + Math.sin(t * 6) * 8;
    A.ellipse(x, y, 6, 3, '#9aa4b8', 0.4);
  }
  E.rect(0, 0, 1, 1, '#000000', 0);
  return { p: A, e: E };
}

export function stairDoor(): Art {
  const p = new Px(44, 70), e = new Px(44, 70);
  p.rect(0, 0, 44, 70, '#3a3a40');
  p.hl(0, 0, 44, '#6a6a72');
  p.rect(5, 6, 34, 64, '#20222a');
  const W = ramp('#3e3428');
  for (const x of [7, 23]) {
    p.rect(x, 8, 14, 60, W[2]);
    p.rect(x + 2, 12, 10, 22, W[1]);
    p.rect(x + 2, 40, 10, 22, W[1]);
  }
  p.rect(19, 38, 2, 5, '#8a8a7a');
  p.rect(23, 38, 2, 5, '#8a8a7a');
  p.hl(2, 0, 40, '#e8eef8');
  e.rect(18, 2, 8, 2, '#3a3e48', 0);
  return { p, e };
}
export function chopBlock(): Px {
  const p = new Px(22, 18), W = ramp('#6a4a32');
  p.ellipseF(11, 5, 9, 4, (_nx, _ny, r2) => [r2 > 0.6 ? W[1] : r2 > 0.3 ? '#a8804e' : '#c8a070']);
  p.ring(11, 5, 5, 2, W[1], 1, 1);
  for (let y = 6; y < 16; y++) for (let x = 2; x < 20; x++) p.set(x, y, x < 5 ? W[3] : x > 16 ? W[1] : W[2]);
  p.ellipse(11, 16, 9, 2, W[1]);
  p.outline(0, '#0a0806');
  return p;
}
export function furniturePile(): Px {
  const p = new Px(60, 34), W = ramp('#5a4030');
  p.rect(4, 16, 30, 14, W[2]);
  p.hl(4, 16, 30, W[3]);
  for (let x = 6; x < 32; x += 8) p.rect(x, 18, 6, 10, W[1]);
  p.line(20, 4, 56, 26, W[1]);
  p.line(21, 4, 57, 26, W[3]);
  p.line(30, 30, 50, 6, W[0]);
  p.rect(38, 18, 16, 12, '#6a5a48');
  p.hl(38, 18, 16, '#8a7a68');
  p.ellipse(46, 24, 4, 3, '#4a3a2a');
  for (let i = 0; i < 18; i++) p.set(hash2(i, 1, 1) * 60, 2 + hash2(i, 2, 1) * 30, '#e8eef8');
  p.outline(0, '#0a0806');
  return p;
}
export function shed(): Px {
  const p = new Px(96, 70), W = ramp('#4a4038');
  p.rect(0, 0, 96, 22, '#dfe6f0');
  for (let x = 0; x < 96; x++) if (fbm(x / 6, 1, 2, 2) > 0.5) p.set(x, 21, '#b8c4d8');
  for (let y = 22; y < 70; y++) for (let x = 0; x < 96; x++) p.set(x, y, x % 8 === 0 ? W[0] : x % 8 === 1 ? W[3] : W[2]);
  for (const x of [12, 52]) {
    p.rect(x, 34, 30, 36, W[1]);
    p.hl(x, 50, 30, '#3a3a40');
    p.rect(x + 26, 48, 3, 6, '#5a5a62');
  }
  p.outline(0, '#0a0806');
  return p;
}

export const CELLAR = { W: 640, H: 360, FLOOR_Y: 132 } as const;

export function cellarGround(): Art {
  const { W, H, FLOOR_Y } = CELLAR;
  const A = new Px(W, H), E = new Px(W, H), r = rng(61);
  A.rect(0, 0, W, H, '#0a0a10');
  for (let y = 8; y < FLOOR_Y; y++)
    for (let x = 0; x < W; x++) {
      const by = Math.floor(y / 7), bx = Math.floor((x + (by % 2) * 7) / 14);
      const edge = y % 7 === 0 || (x + (by % 2) * 7) % 14 === 0;
      let c = edge ? '#2a1e1e' : sh('#4a3a38', (hash2(bx, by, 7) - 0.5) * 0.25);
      c = mix(c, '#2a2a34', Math.max(0, 1 - (y - 8) / 50) * 0.6);
      A.set(x, y, c);
    }
  for (let i = 0; i < 4; i++) {
    const cx = 80 + i * 160;
    for (let y = 8; y < 60; y++) {
      const half = Math.sqrt(Math.max(0, 1 - ((y - 60) / 52) ** 2)) * 70;
      for (const x of [cx - half, cx + half]) A.set(x, y, '#1a1414');
    }
  }
  for (const [y, c] of [[22, '#5a5e66'], [30, '#4a5048']] as const) {
    A.rect(0, y, W, 5, c);
    A.hl(0, y, W, sh(c, 0.3));
    A.hl(0, y + 4, W, sh(c, -0.4));
    for (let x = 40; x < W; x += 120) A.rect(x, y - 1, 4, 7, sh(c, -0.2));
  }
  for (let y = FLOOR_Y; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 22, y / 14, 4, 4);
      let c = mix('#2e3038', '#40424c', n);
      if (fbm(x / 8, y / 6, 5, 2) > 0.7) c = mix(c, '#5a6a80', 0.25);
      A.set(x, y, c);
    }
  for (let y = 0; y < 16; y++) A.rect(0, FLOOR_Y + y, W, 1, '#000000', 0.5 * (1 - y / 16));
  for (let i = 0; i < 7; i++) {
    const x = 560, y = 40 + i * 13;
    A.rect(x, y, 70, 13, i % 2 ? '#4a4a52' : '#55555e');
    A.hl(x, y, 70, '#7a7a84');
  }
  E.rect(570, 30, 50, 8, '#2a3a5a', 0.6);
  for (let i = 0; i < 20; i++) A.set(r() * W, FLOOR_Y + 20 + r() * 200, '#6a6a72');
  return { p: A, e: E };
}
export function bunk(): Px {
  const p = new Px(70, 50), W = ramp('#4a3a2a');
  for (const x of [1, 66]) p.rect(x, 0, 3, 50, W[1]);
  for (const y of [8, 34]) {
    p.rect(2, y, 66, 6, W[2]);
    p.hl(2, y, 66, W[3]);
    p.rect(4, y - 5, 60, 5, '#4a4c5a');
    for (let x = 6; x < 62; x += 6) p.vl(x, y - 5, 5, '#3a3c4a');
    p.ellipse(12, y - 4, 6, 2.5, '#d8d0c0');
  }
  p.outline(0, '#0a0806');
  return p;
}
export function kerosene(): Art {
  const p = new Px(12, 20), e = new Px(12, 20);
  p.vl(6, 0, 4, '#2a2a2a');
  p.rect(2, 14, 8, 5, '#6a5a3a');
  p.hl(2, 14, 8, '#8a7a4a');
  p.ellipse(6, 9, 4, 5, '#c8d0d8', 0.5);
  e.ellipse(6, 10, 1.6, 3, '#ffcf70');
  e.set(6, 8, '#fff6d0');
  return { p, e };
}
export function seedBoxes(): Px {
  const p = new Px(40, 30), W = ramp('#7a6040');
  for (const [x, y] of [[2, 14], [20, 14], [10, 2]] as const) {
    p.rect(x, y, 18, 14, W[2]);
    p.hl(x, y, 18, W[3]);
    p.vl(x + 17, y, 14, W[0]);
    p.rect(x + 3, y + 3, 12, 5, '#d8ccb0');
    p.hl(x + 4, y + 5, 10, '#6a6a5a');
  }
  p.outline(0, '#0a0806');
  return p;
}
export function papersStack(): Px {
  const p = new Px(34, 26);
  for (let i = 0; i < 4; i++) {
    const x = 2 + (i % 2) * 14, y = 14 - Math.floor(i / 2) * 10;
    p.rect(x, y, 14, 10, '#4a5a6a');
    p.hl(x, y, 14, '#6a7a8a');
    p.vl(x + 13, y, 10, '#e8dcc0');
  }
  p.outline(0, '#0a0806');
  return p;
}
export function sandbags(w: number): Px {
  const p = new Px(w, 18);
  for (let row = 0; row < 2; row++)
    for (let x = row * 6; x < w - 10; x += 13) p.ellipseF(x + 6, 12 - row * 6, 7, 4, (nx, ny) => [ny < -0.3 ? '#a8a088' : nx > 0.4 ? '#6a6450' : '#8a8470']);
  p.outline(0, '#0a0806');
  return p;
}
export function sled(): Px {
  const p = new Px(56, 22), W = ramp('#6a4a32');
  p.rect(4, 6, 46, 8, W[2]);
  p.hl(4, 6, 46, W[3]);
  for (const x of [8, 26, 44]) p.vl(x, 14, 4, W[0]);
  p.line(0, 18, 50, 18, '#8a8c94');
  p.line(50, 18, 55, 12, '#8a8c94');
  p.line(0, 20, 50, 20, '#5a5c64');
  p.outline(0, '#0a0806');
  return p;
}
export { bookPile };

export function bareTree(h: number, seed: number): Px {
  const w = Math.round(h * 0.8), p = new Px(w, h), r = rng(seed);
  const cx = w / 2;
  const branch = (x: number, y: number, ang: number, len: number, th: number, d: number): void => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    for (let t = 0; t < th; t++) p.line(x + t - th / 2, y, x2 + t - th / 2, y2, t === 0 ? '#5a5048' : '#2e2824');
    if (d > 0) {
      branch(x2, y2, ang - 0.4 - r() * 0.3, len * 0.7, Math.max(1, th - 1), d - 1);
      branch(x2, y2, ang + 0.4 + r() * 0.3, len * 0.7, Math.max(1, th - 1), d - 1);
    } else p.set(x2, y2 - 1, '#f4f8ff');
  };
  branch(cx, h - 1, -Math.PI / 2, h * 0.36, 4, 4);
  p.outline(0, '#14100e');
  return p;
}
export function archway(): Art {
  const p = new Px(70, 96), e = new Px(70, 96);
  p.rect(0, 0, 70, 96, '#4a4e5a');
  for (let y = 18; y < 96; y++) {
    const half = y < 40 ? Math.sqrt(Math.max(0, 1 - ((y - 40) / 22) ** 2)) * 26 : 26;
    for (let x = 35 - half; x < 35 + half; x++) p.set(x, y, mix('#06080c', '#1a2030', (y - 18) / 78));
  }
  e.rect(26, 80, 18, 14, '#8a9ab8', 0.25);
  return { p, e };
}
export function streetBench(): Px {
  const p = new Px(40, 18), W = ramp('#4a3a2e');
  p.rect(0, 0, 40, 4, W[3]);
  p.hl(0, 0, 40, '#e8eef8');
  p.rect(0, 6, 40, 4, W[2]);
  p.hl(0, 6, 40, '#f4f8ff');
  for (const x of [3, 35]) p.rect(x, 10, 3, 8, '#2a2a30');
  p.outline(0, '#0a0806');
  return p;
}
export function drift(w: number): Px {
  const p = new Px(w, 14);
  p.ellipseF(w / 2, 9, w / 2, 6, (nx, ny) => [ny < -0.3 ? '#f4f8ff' : nx > 0.4 ? '#b8c4d8' : '#dfe6f0']);
  return p;
}

export function waterPump(): Px {
  const p = new Px(26, 40), M = ramp('#4a5a66');
  p.ellipse(13, 36, 12, 3.5, '#000000', 0.3);
  p.ellipseF(13, 34, 12, 4, (nx, ny) => [ny < 0 ? '#e8f2fc' : '#b8d0e8', 0.95]);
  p.rect(9, 6, 8, 28, M[2]);
  p.vl(9, 6, 28, M[3]);
  p.vl(16, 6, 28, M[1]);
  p.ellipseF(13, 6, 5, 3, () => [M[3]]);
  p.line(16, 10, 24, 4, M[1]);
  p.line(16, 11, 24, 5, M[2]);
  p.rect(3, 18, 7, 3, M[2]);
  for (const [x, l] of [[4, 6], [6, 4], [8, 7]] as const) p.vl(x, 21, l, '#dceefc');
  p.ellipseF(13, 4, 6, 2, () => ['#f4f8ff']);
  p.outline(0, '#141820', 200);
  return p;
}

export function lampPost(): Px {
  const p = new Px(20, 70), M = ramp('#3a3e46');
  p.ellipse(10, 67, 6, 2, '#000000', 0.3);
  p.rect(9, 12, 3, 56, M[2]);
  p.vl(9, 12, 56, M[3]);
  p.rect(7, 62, 7, 6, M[1]);
  p.line(10, 12, 17, 8, M[2]);
  p.rect(14, 8, 6, 6, '#1a1e26');
  p.hl(13, 7, 8, M[3]);
  p.hl(13, 6, 8, '#f4f8ff');
  p.outline(0, '#101218', 200);
  return p;
}

export function noticeBoard(): Px {
  const p = new Px(40, 34), W = ramp('#5a4a3a');
  p.rect(2, 2, 36, 24, W[2]);
  p.rect(4, 4, 32, 20, W[1]);
  for (const [x, y, w, h] of [[6, 6, 10, 13], [18, 5, 9, 9], [28, 7, 7, 11], [19, 15, 8, 7]] as const) {
    p.rect(x, y, w, h, '#e8e2d0');
    for (let k = 2; k < h - 1; k += 2) p.hl(x + 1, y + k, w - 2, '#8a8478', 0.8);
    p.set(x + w / 2, y, '#8a2a2a');
  }
  p.vl(6, 26, 8, W[1]);
  p.vl(33, 26, 8, W[1]);
  p.hl(1, 1, 38, '#f4f8ff');
  p.outline(0, '#141010', 200);
  return p;
}
