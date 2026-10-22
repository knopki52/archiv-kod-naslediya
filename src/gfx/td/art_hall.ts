import { bookRow, candleStand, ladder, stoneWall, wallShelf, type Art } from './art_common';
import { bayer, fbm, hash2, mix, Px, ramp, rng, sh } from './px';

export function pillar(h: number): Px {
  const w = 18, p = new Px(w + 6, h + 10);
  const S = ramp('#3a3466');
  const col = (x: number) => (x < 3 ? S[3] : x < 12 ? S[2] : x < 15 ? S[1] : S[0]);
  for (let y = 8; y < h; y++) for (let x = 0; x < w; x++) p.set(x + 3, y, col(x));
  for (let y = 10; y < h; y++) {
    p.set(8, y, S[3]);
    p.set(12, y, S[1]);
    p.set(16, y, S[0]);
  }
  p.vl(4, 8, h - 8, S[4]);
  p.rect(0, 0, w + 6, 4, S[3]);
  p.hl(0, 0, w + 6, S[4]);
  p.rect(1, 4, w + 4, 3, S[1]);
  p.hl(2, 7, w + 2, S[0]);
  p.hl(3, 2, w, '#c8a050');
  p.rect(0, h, w + 6, 6, S[2]);
  p.hl(0, h, w + 6, S[4]);
  p.rect(1, h + 6, w + 4, 4, S[1]);
  p.hl(1, h + 9, w + 4, S[0]);
  p.hl(3, h + 3, w, '#c8a050');
  return p;
}

export function serverRack(w: number, h: number, seed: number): Art {
  const p = new Px(w, h), e = new Px(w, h), r = rng(seed);
  const M = ramp('#2a2c40');
  p.rect(0, 0, w, h, M[1]);
  p.vl(0, 0, h, M[3]);
  p.vl(w - 1, 0, h, M[0]);
  p.hl(0, 0, w, M[4]);
  for (let y = 4; y < h - 4; y += 7) {
    p.rect(2, y, w - 4, 6, M[2]);
    p.hl(2, y, w - 4, M[3]);
    p.hl(2, y + 5, w - 4, M[0]);
    for (let x = 4; x < w - 10; x += 2) p.set(x, y + 3, M[0]);
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const c = ['#5fe3ff', '#7dffb0', '#ff6fa8', '#ffd36b'][Math.floor(r() * 4)]!;
      const lx = w - 8 + i * 2;
      p.set(lx, y + 2, '#10101a');
      if (r() < 0.8) e.set(lx, y + 2, c);
    }
  }
  return { p, e };
}

export function coreDoor(sockets = 0, open = false): Art {
  const w = 96, h = 104, p = new Px(w, h), e = new Px(w, h);
  const ST = ramp('#4a4280'), G = ramp('#c89a3a');
  const cx = w / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dy = Math.max(0, 44 - y), dx = x + 0.5 - cx;
      const rOut = Math.sqrt(dx * dx + dy * dy);
      const inArch = y >= 44 ? Math.abs(dx) < 48 : rOut < 48;
      if (!inArch) continue;
      const inner = y >= 44 ? Math.abs(dx) < 36 : rOut < 36;
      if (!inner) {
        const ang = Math.atan2(dy, dx);
        const seg = y >= 44 ? Math.floor(y / 12) : Math.floor((ang + Math.PI) / 0.26);
        let c = seg % 2 ? ST[2] : ST[3];
        if (Math.abs(rOut - 47.5) < 1 || (y >= 44 && Math.abs(Math.abs(dx) - 47.5) < 1)) c = ST[4];
        if (Math.abs(rOut - 36.5) < 1 || (y >= 44 && Math.abs(Math.abs(dx) - 36.5) < 1)) c = ST[0];
        p.set(x, y, c);
      }
    }
  p.poly([[cx - 6, 0], [cx + 6, 0], [cx + 4, 12], [cx - 4, 12]], ST[4]);
  p.ellipse(cx, 6, 3, 3, '#13213a');
  e.ellipse(cx, 6, 2, 2, open || sockets >= 3 ? '#fff4cf' : '#8a7aff');
  for (let y = 12; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dy = Math.max(0, 44 - y), dx = x + 0.5 - cx;
      const inner = y >= 44 ? Math.abs(dx) < 35 : Math.sqrt(dx * dx + dy * dy) < 35;
      if (!inner) continue;
      if (open) {
        const t = Math.abs(dx) / 35;
        p.set(x, y, mix('#fff4cf', '#ffd36b', t));
        e.set(x, y, mix('#ffffff', '#ffe7a0', t), 0.95);
        continue;
      }
      let c = G[2];
      const lx = Math.abs(dx);
      if (lx < 1) c = G[0];
      else if (dx < 0 && dx > -3) c = G[1];
      else if (dx > 0 && dx < 3) c = G[3];
      if (lx > 32) c = dx < 0 ? G[3] : G[1];
      const py = y % 22;
      if (lx > 6 && lx < 28 && py > 3 && py < 19 && y > 30) c = py === 4 || (dx < 0 ? lx === 27 : lx === 7) ? G[1] : py === 18 ? G[4] : sh('#c89a3a', -0.08);
      p.set(x, y, c);
    }
  if (!open) {
    p.ring(cx, 42, 14, 14, G[4], 1, 1.4);
    p.ring(cx, 42, 11, 11, G[0], 1, 1);
    ([[cx - 18, 70], [cx, 76], [cx + 18, 70]] as const).forEach(([sx, sy], i) => {
      p.ellipse(sx, sy, 5, 5, G[0]);
      p.ellipse(sx, sy, 4, 4, '#1a1226');
      p.ring(sx, sy, 5, 5, G[4], 1, 1);
      if (i < sockets) e.ellipse(sx, sy, 3, 3, ['#ffb347', '#9fb4c8', '#7dffb0'][i]!);
      else e.ellipse(sx, sy, 2, 2, '#c89a3a', 0.25);
    });
    e.ring(cx, 42, 12.5, 12.5, '#ffd36b', 0.5, 1);
  }
  return { p, e };
}

export function portal(accent: string, state: 'active' | 'ghost' | 'done' = 'active', seed = 1, frame = 0): Art {
  const w = 72, h = 96, p = new Px(w, h), e = new Px(w, h);
  const ST = ramp('#3a3466'), G = ramp('#c89a3a'), A = ramp(accent);
  const cx = 36, cy = 78;
  p.ellipseF(cx, cy + 4, 30, 11, (_nx, ny) => [ny > 0.2 ? ST[0] : ST[1]]);
  p.ellipseF(cx, cy, 30, 11, (nx, ny, r2) => [r2 > 0.86 ? (ny < 0 ? ST[4] : G[2]) : nx < -0.3 && ny < 0 ? ST[3] : ST[2]]);
  p.ellipseF(cx, cy, 22, 8, (_nx, _ny, r2) => [r2 > 0.82 ? ST[1] : ST[2]]);
  const runeA = state === 'active' ? 1 : state === 'done' ? 0.45 : 0.18;
  for (let a = 0; a < Math.PI * 2; a += 0.06) {
    const x = cx + Math.cos(a + frame * 0.05) * 19, y = cy + Math.sin(a + frame * 0.05) * 6.8;
    e.set(x, y, A[3], runeA * (Math.floor(a * 7) % 3 === 0 ? 1 : 0.65));
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - frame * 0.08, x = cx + Math.cos(a) * 14, y = cy + Math.sin(a) * 4.8;
    e.rect(Math.round(x) - 1, Math.round(y), 2, 1, A[4], runeA * 0.9);
  }
  if (state === 'active') {
    for (let y = 8; y < cy; y++) {
      const t = (y - 8) / (cy - 8);
      const bw = 9 + t * 9;
      for (let x = -bw; x <= bw; x++) {
        const k = 1 - Math.abs(x) / bw;
        e.set(cx + x, y, A[3], 0.32 * k * k * (0.35 + t * 0.65));
      }
    }
  }
  if (state === 'done') {
    const by = 62;
    p.poly([[cx - 13, by], [cx + 13, by], [cx + 11, by + 8], [cx - 11, by + 8]], sh(accent, -0.4));
    p.hl(cx - 12, by + 1, 24, '#efe6cf');
    p.hl(cx - 12, by, 24, sh(accent, -0.1));
    e.set(cx, by + 4, A[4], 0.7);
    return { p, e };
  }
  const by = (state === 'active' ? 34 : 46) + (frame % 2 ? -1 : 0);
  const ba = state === 'active' ? 1 : 0.5;
  const cover = sh(accent, -0.45);
  p.poly([[cx - 15, by + 2], [cx, by + 5], [cx + 15, by + 2], [cx + 15, by + 12], [cx, by + 15], [cx - 15, by + 12]], cover, ba);
  p.poly([[cx - 13, by], [cx, by + 3], [cx, by + 12], [cx - 13, by + 9]], '#efe6cf', ba);
  p.poly([[cx + 13, by], [cx, by + 3], [cx, by + 12], [cx + 13, by + 9]], '#d8ccb0', ba);
  for (let i = 0; i < 4; i++) {
    p.line(cx - 11, by + 2 + i * 2, cx - 3, by + 4 + i * 2, '#8a7a6a', ba * 0.7);
    p.line(cx + 3, by + 4 + i * 2, cx + 11, by + 2 + i * 2, '#7a6a5a', ba * 0.6);
  }
  p.vl(cx, by + 3, 10, '#a89878', ba);
  if (state === 'active') {
    for (let i = 0; i < 4; i++) {
      e.line(cx - 11, by + 2 + i * 2, cx - 3, by + 4 + i * 2, A[4], 0.8);
      e.line(cx + 3, by + 4 + i * 2, cx + 11, by + 2 + i * 2, A[4], 0.7);
    }
    p.poly([[cx + 16, by - 8], [cx + 23, by - 10], [cx + 24, by - 4], [cx + 17, by - 2]], '#efe6cf');
    e.line(cx + 18, by - 7, cx + 22, by - 8, A[4], 0.8);
    const r = rng(seed + frame);
    for (let i = 0; i < 14; i++) e.set(cx - 18 + r() * 36, 6 + r() * 60, i % 3 ? A[4] : '#ffffff', 0.5 + r() * 0.5);
  }
  return { p, e };
}

export function lectern(glowBook = true): Art {
  const w = 32, h = 44, p = new Px(w, h), e = new Px(w, h);
  const WD = ramp('#4a2e3a');
  p.rect(13, 18, 6, 20, WD[2]);
  p.vl(13, 18, 20, WD[3]);
  p.vl(18, 18, 20, WD[0]);
  p.ellipseF(16, 40, 11, 4, (_nx, ny) => [ny < -0.2 ? WD[3] : WD[1]]);
  p.rect(5, 39, 22, 3, WD[1]);
  p.hl(5, 41, 22, WD[0]);
  p.poly([[2, 10], [30, 10], [27, 20], [5, 20]], WD[2]);
  p.hl(2, 10, 28, WD[4]);
  p.hl(5, 20, 22, WD[0]);
  p.poly([[4, 6], [28, 6], [30, 10], [2, 10]], WD[3]);
  if (glowBook) {
    p.poly([[5, 2], [16, 4], [16, 11], [4, 9]], '#efe6cf');
    p.poly([[27, 2], [16, 4], [16, 11], [28, 9]], '#d8ccb0');
    p.vl(16, 4, 7, '#9a8a6a');
    for (let i = 0; i < 3; i++) {
      e.line(7, 4 + i * 2, 14, 6 + i * 2, '#5fe3ff', 0.9);
      e.line(18, 6 + i * 2, 25, 4 + i * 2, '#a8f2ff', 0.8);
    }
    const r = rng(9);
    for (let i = 0; i < 10; i++) e.set(4 + r() * 24, r() * 6, '#5fe3ff', 0.7);
  } else {
    p.poly([[8, 6], [12, 5], [13, 8], [9, 9]], '#8a8070');
    p.set(20, 7, '#8a8070');
    p.set(22, 6, '#6a6058');
  }
  return { p, e };
}

export function desk(leaf: boolean): Art {
  const w = 76, h = 46, p = new Px(w, h), e = new Px(w, h);
  const WD = ramp('#5a3a2e');
  p.rect(0, 8, w, 16, WD[3]);
  p.hl(0, 8, w, WD[4]);
  for (let y = 11; y < 24; y += 4) p.hl(1, y, w - 2, sh('#5a3a2e', 0.18));
  p.rect(0, 24, w, 14, WD[1]);
  p.hl(0, 24, w, WD[2]);
  p.hl(0, 37, w, WD[0]);
  p.rect(6, 27, 26, 8, WD[2]);
  p.rect(44, 27, 26, 8, WD[2]);
  p.hl(6, 27, 26, WD[3]);
  p.hl(44, 27, 26, WD[3]);
  p.rect(17, 30, 4, 2, '#c8a050');
  p.rect(55, 30, 4, 2, '#c8a050');
  p.rect(1, 38, 4, 8, WD[0]);
  p.rect(w - 5, 38, 4, 8, WD[0]);
  p.poly([[10, 13], [26, 11], [28, 20], [12, 22]], '#e8dcc4');
  p.poly([[14, 10], [30, 12], [28, 21], [12, 19]], '#f4ead4');
  for (let i = 0; i < 4; i++) p.hl(16, 13 + i * 2, 10, '#9a8a7a');
  if (leaf) {
    p.poly([[38, 14], [50, 12], [52, 20], [40, 22]], '#f6e7b8');
    for (let i = 0; i < 3; i++) p.hl(41, 15 + i * 2, 8, '#a08a5a');
    e.poly([[39, 15], [49, 13], [51, 19], [41, 21]], '#ffd36b', 0.35);
  }
  p.rect(56, 13, 4, 4, '#1a1426');
  p.hl(56, 13, 4, '#4a4466');
  p.line(58, 12, 64, 2, '#e8e0f0');
  p.line(59, 12, 65, 3, '#b8b0c8');
  p.rect(66, 18, 6, 2, '#8a7a3a');
  p.vl(69, 6, 12, '#a89040');
  p.poly([[63, 0], [75, 0], [77, 7], [61, 7]], '#2e5a3a');
  p.hl(62, 0, 14, '#4a8a5a');
  e.rect(63, 7, 13, 1, '#ffe7a0', 0.9);
  return { p, e };
}

export function showcase(cards: number[]): Art {
  const w = 56, h = 58, p = new Px(w, h), e = new Px(w, h);
  const WD = ramp('#3a2436'), G = ramp('#c89a3a');
  const AC = ['#ffb347', '#9fb4c8', '#7dffb0'];
  p.rect(0, 46, w, 12, WD[1]);
  p.hl(0, 46, w, WD[3]);
  p.hl(0, 57, w, WD[0]);
  p.rect(2, 4, w - 4, 42, '#141228');
  p.rect(0, 0, w, 4, WD[3]);
  p.hl(0, 0, w, WD[4]);
  p.vl(0, 0, 46, WD[2]);
  p.vl(w - 1, 0, 46, WD[0]);
  for (let i = 0; i < 3; i++) {
    const x = 6 + i * 16;
    p.rect(x, 14, 12, 16, '#2a2440');
    p.hl(x, 30, 12, G[2]);
    if (cards.includes(i + 1)) {
      p.rect(x + 1, 15, 10, 14, AC[i]);
      p.rect(x + 2, 16, 8, 12, '#f4ead4');
      for (let k = 0; k < 4; k++) p.hl(x + 3, 18 + k * 2, 6, '#9a8a7a');
      e.rect(x + 1, 15, 10, 14, AC[i], 0.22);
    }
  }
  for (let i = 0; i < 40; i++) p.set(6 + i * 0.6, 40 - i, '#ffffff', 0.12);
  p.line(36, 42, 50, 8, '#ffffff', 0.1);
  return { p, e };
}

export function banner(seed: number, col = '#4a2468'): Art {
  const p = new Px(22, 60), e = new Px(22, 60), R = ramp(col), G = ramp('#c89a3a');
  p.rect(0, 0, 22, 3, G[2]);
  p.hl(0, 0, 22, G[4]);
  for (let y = 3; y < 54; y++) for (let x = 2; x < 20; x++) p.set(x, y, x < 4 ? R[3] : x > 17 ? R[1] : R[2]);
  p.poly([[2, 54], [20, 54], [11, 60]], R[2]);
  p.vl(3, 3, 51, G[2]);
  p.vl(18, 3, 51, G[1]);
  p.poly([[6, 22], [11, 24], [16, 22], [16, 30], [11, 32], [6, 30]], G[3]);
  p.vl(11, 24, 8, G[0]);
  p.ellipse(11, 16, 4, 2.6, G[2]);
  e.ellipse(11, 16, 3, 2, seed % 2 ? '#a88aff' : '#5fe3ff', 0.9);
  e.set(11, 16, '#ffffff');
  for (let i = 0; i < 4; i++) p.hl(6, 38 + i * 3, 10, G[1]);
  p.outline(0, '#0a0814');
  return { p, e };
}

export function sconce(): Art {
  const p = new Px(10, 14), e = new Px(10, 14);
  p.rect(3, 8, 4, 5, '#a8823a');
  p.hl(1, 8, 8, '#c8a050');
  p.rect(4, 4, 2, 4, '#efe6cf');
  e.ellipse(5, 2, 1.5, 2.4, '#ffcf70');
  e.set(5, 1, '#fff6d0');
  return { p, e };
}

export function holoCube(seed: number, frame = 0): Art {
  const p = new Px(14, 14), e = new Px(14, 14);
  const c = ['#5fe3ff', '#a88aff'][seed % 2]!;
  const sk = frame % 2;
  const L = [[2, 4, 7, 1], [7, 1, 12, 4], [12, 4, 7, 7], [7, 7, 2, 4], [2, 4, 2, 10], [7, 7, 7, 13], [12, 4, 12, 10], [2, 10, 7, 13], [7, 13, 12, 10]] as const;
  for (const [a, b, cc, d] of L) e.line(a, b + sk, cc, d + sk, c, 0.85);
  e.set(7, 4 + sk, '#ffffff');
  e.rect(5, 6 + sk, 4, 4, c, 0.25);
  return { p, e };
}

export function armchair(): Px {
  const p = new Px(26, 26), R = ramp('#5a2a3a');
  p.rect(2, 0, 22, 12, R[2]);
  p.hl(2, 0, 22, R[3]);
  for (let x = 5; x < 22; x += 5) p.vl(x, 2, 9, R[1]);
  p.rect(0, 8, 5, 14, R[3]);
  p.rect(21, 8, 5, 14, R[1]);
  p.rect(4, 12, 18, 8, R[2]);
  p.hl(4, 12, 18, R[4]);
  p.rect(4, 20, 18, 3, R[0]);
  p.vl(1, 22, 4, '#2a1a1a');
  p.vl(24, 22, 4, '#2a1a1a');
  p.outline(0, '#0a0814');
  return p;
}

export function roundTable(): Art {
  const p = new Px(22, 22), e = new Px(22, 22), W = ramp('#5a3a2e');
  p.ellipse(11, 9, 10, 3, W[1]);
  p.ellipse(11, 7, 10, 5, W[3]);
  p.ellipse(11, 6.5, 8.5, 3.6, W[2]);
  p.rect(10, 10, 3, 10, W[0]);
  p.ellipse(11, 20, 5, 1.6, W[1]);
  p.rect(4, 2, 4, 1, '#c8a050');
  p.rect(4, 7, 4, 1, '#c8a050');
  p.poly([[4, 3], [8, 3], [6, 5]], '#e8dcb0');
  p.poly([[6, 5], [4, 7], [8, 7]], '#d8c48a');
  p.rect(14, 2, 2, 4, '#efe6cf');
  e.ellipse(15, 0.8, 1.2, 1.6, '#ffcf70');
  p.rect(9, 5, 6, 2, '#e8dcc0');
  p.outline(0, '#0a0814');
  return { p, e };
}

export function globe(): Px {
  const p = new Px(18, 26), W = ramp('#6a4a30');
  p.ellipseF(9, 9, 7, 7, (nx, ny) => {
    const land = fbm((nx + 1) * 3, (ny + 1) * 3, 4, 2) > 0.5;
    return [land ? (nx < 0 ? '#9a8a4a' : '#6a5a2a') : nx < -0.2 ? '#4a7aa0' : '#2a4a6a'];
  });
  p.set(6, 5, '#ffffff');
  p.ring(9, 9, 8, 8, '#c89a3a', 1, 1);
  p.vl(9, 17, 5, W[2]);
  p.ellipse(9, 23, 6, 2, W[2]);
  p.hl(4, 22, 10, W[3]);
  p.outline(0, '#0a0814');
  return p;
}

export function scrollBasket(): Px {
  const p = new Px(18, 20), W = ramp('#8a6a3a');
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 3;
    p.rect(x, 1 + (i % 2) * 2, 3, 9, '#e8dcc0');
    p.ellipse(x + 1, 1 + (i % 2) * 2, 1.4, 1.2, '#c8b890');
  }
  p.rect(1, 9, 16, 10, W[2]);
  for (let y = 10; y < 19; y += 2) p.hl(1, y, 16, W[1]);
  for (let x = 2; x < 17; x += 3) p.vl(x, 9, 10, W[3]);
  p.hl(1, 9, 16, W[4]);
  p.outline(0, '#0a0814');
  return p;
}

export const HALL = { W: 640, H: 430, WALL_TOP: 22, FLOOR_Y: 128, CARPET: [292, 348] as const, RING: { x: 320, y: 236, rx: 150, ry: 52 } };

export function hallGround(): Art {
  const { W, H, WALL_TOP, FLOOR_Y } = HALL;
  const A = new Px(W, H), E = new Px(W, H);
  A.gradV(0, 0, W, WALL_TOP, ['#05040c', '#0b0a1c']);
  const r = rng(3);
  for (let i = 0; i < 40; i++) E.set(r() * W, r() * (WALL_TOP - 8), '#8a7aff', 0.3 + r() * 0.4);
  A.rect(0, WALL_TOP - 6, W, 6, '#1a173a');
  A.hl(0, WALL_TOP - 6, W, '#3a3470');
  A.hl(0, WALL_TOP - 1, W, '#0a0918');
  stoneWall(A, 0, WALL_TOP, W, FLOOR_Y - WALL_TOP, '#26224e', 3);
  A.dither(0, WALL_TOP, W, 20, '#000000', 0.5, 0.5);
  A.hl(0, WALL_TOP + 2, W, '#7a5a2a');
  A.hl(0, WALL_TOP + 3, W, '#3a2a1a');
  [44, 116, 188, 380, 452, 524].forEach((x, i) => {
    const s = wallShelf(68, 94, 30 + i, 0.16);
    A.blit(s.p, x, WALL_TOP + 10);
    E.blit(s.e, x, WALL_TOP + 10);
  });
  for (let ty = FLOOR_Y, row = 0; ty < H; ty += 16, row++)
    for (let tx = row % 2 ? -16 : 0; tx < W; tx += 32) {
      const k = (hash2(tx, ty, 5) - 0.5) * 0.12;
      const base = sh('#20245a', k);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 32; x++) {
          const n = fbm((tx + x) / 9, (ty + y) / 7, 3, 2);
          A.set(tx + x, ty + y, sh(base, (n - 0.5) * 0.22));
        }
      A.hl(tx + 1, ty, 30, sh(base, 0.25));
      A.vl(tx, ty, 15, sh(base, 0.12));
      A.hl(tx, ty + 15, 32, sh(base, -0.42));
      A.vl(tx + 31, ty, 16, sh(base, -0.3));
      if (hash2(tx, ty, 11) < 0.1) {
        let cx = tx + 4 + hash2(tx, ty, 12) * 20, cy = ty + 2;
        for (let i = 0; i < 11; i++) {
          A.set(cx, cy, sh(base, -0.45));
          cx += hash2(i, tx, ty) > 0.5 ? 1 : -1;
          cy += hash2(ty, i, tx) > 0.3 ? 1 : 0;
        }
      }
    }
  const R = HALL.RING;
  for (let a = 0; a < Math.PI * 2; a += 0.003) {
    const x = R.x + Math.cos(a) * R.rx, y = R.y + Math.sin(a) * R.ry;
    A.set(x, y, '#8a6a2a');
    A.set(x, y + 1, '#3a2a14');
    E.set(x, y, '#ffd36b', 0.12);
  }
  for (let a = 0; a < Math.PI * 2; a += 0.004) A.set(R.x + Math.cos(a) * (R.rx - 12), R.y + Math.sin(a) * (R.ry - 5), '#5a4420');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = R.x + Math.cos(a) * (R.rx - 6), y = R.y + Math.sin(a) * (R.ry - 2.5);
    A.rect(x - 1, y - 1, 3, 3, '#c89a3a');
    A.set(x, y, '#fff0b0');
    E.set(x, y, '#ffd36b', 0.5);
  }
  for (let y = 0; y < 14; y++) A.rect(0, FLOOR_Y + y, W, 1, '#000000', 0.5 * (1 - y / 14));
  const [CX0, CX1] = HALL.CARPET;
  const CP = ramp('#4a2468');
  for (let y = FLOOR_Y; y < H; y++)
    for (let x = CX0; x < CX1; x++) {
      const lx = x - CX0, wpx = CX1 - CX0;
      let c = CP[2];
      if (lx < 2 || lx >= wpx - 2) c = CP[0];
      else if (lx < 5 || lx >= wpx - 5) c = y % 4 < 2 ? sh('#c89a3a', 0) : sh('#9a7228', 0);
      else {
        const u = lx - 28 + 0.5, v = ((y - FLOOR_Y) % 24) - 12;
        const dmd = Math.abs(u) / 1.6 + Math.abs(v);
        if (Math.abs(dmd - 10) < 0.8) c = CP[3];
        else if (dmd < 3) c = sh('#c89a3a', 0);
        else if ((x + y) % 2 === 0 && dmd < 10) c = sh('#4a2468', -0.08);
      }
      if (x === CX1 - 1 || x === CX1 - 2) c = sh(c, -0.25);
      A.set(x, y, c);
    }
  for (let y = FLOOR_Y; y < FLOOR_Y + 14; y++) A.rect(CX0, y, CX1 - CX0, 1, '#000000', 0.45 * (1 - (y - FLOOR_Y) / 14));
  for (let k = 0; k < 6; k++) {
    let x = 200 + k * 48, y = H - 30;
    for (let i = 0; i < 260; i++) {
      x += (320 - x) * 0.01 + (hash2(i, k, 3) - 0.5) * 1.2;
      y -= 1;
      if (y < FLOOR_Y) break;
      if (i % 3 === 0 && Math.abs(x - 320) > 30) E.set(x, y, '#5fe3ff', 0.16 + (i % 15 === 0 ? 0.5 : 0));
    }
  }
  for (const [x0, x1, s] of [[20, 60, 1], [618, 590, 2]] as const) {
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i <= 140; i++) {
        const t = i / 140;
        const xx = x0 + k * 3 + (x1 - x0) * t + Math.sin(t * 9 + k + s) * 4, yy = FLOOR_Y + (210 - FLOOR_Y) * (t * t) + k * 2;
        A.set(xx, yy, k === 1 ? '#14121e' : '#1e1a2c');
        A.set(xx, yy + 1, '#000000', 0.3);
        if (k === 1 && i % 9 === 0) E.set(xx, yy, '#5fe3ff', 0.6);
      }
    }
  }
  A.rect(0, H - 10, W, 10, '#120f28');
  A.hl(0, H - 10, W, '#3a3470');
  const rr = rng(77);
  for (let i = 0; i < 18; i++) {
    const x = 50 + rr() * 540, y = FLOOR_Y + 24 + rr() * (H - FLOOR_Y - 50);
    if (Math.abs(x - 320) < 36) continue;
    A.poly([[x, y], [x + 6, y - 1], [x + 7, y + 4], [x + 1, y + 5]], '#cfc6b0');
    A.line(x + 1, y + 1, x + 5, y + 1, '#8a8070', 0.6);
  }
  void bayer;
  void bookRow;
  return { p: A, e: E };
}

export { candleStand, ladder };
