import type { Art } from './art_common';
import { bayer, fbm, hash2, mix, Px, ramp, rng, sh, type Col } from './px';

export const CORE = { W: 640, H: 400, CX: 320, CY: 210 } as const;

export function coreGround(): Art {
  const { W, H, CX, CY } = CORE;
  const A = new Px(W, H), E = new Px(W, H), r = rng(91);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 120, y / 80, 3, 4);
      A.set(x, y, mix('#05040a', '#141028', n * 0.9));
    }
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H;
    E.set(x, y, ['#fff4cf', '#a88aff', '#5fe3ff', '#ffffff'][i % 4]!, 0.2 + r() * 0.6);
  }
  for (let i = 0; i < 10; i++) {
    const x = r() * W, y = r() * 120, w = 30 + r() * 40;
    A.rect(x, y, w, 6, '#1a1630');
    for (let k = 0; k < w; k += 3) A.vl(x + k, y - 5, 5, ['#2a2244', '#221c3a'][k % 2]!);
  }
  const RX = 250, RY = 120;
  A.ellipseF(CX, CY + 14, RX, RY, (_nx, ny) => [ny > 0.1 ? '#120e22' : '#0e0a1a']);
  A.ellipseF(CX, CY, RX, RY, (nx, ny, r2) => {
    const n = fbm((nx + 1) * 12, (ny + 1) * 8, 7, 3);
    let c: Col = mix('#2a2448', '#3a3260', n);
    if (r2 > 0.94) c = ny < 0 ? '#6a5aa0' : '#c89a3a';
    const ring = Math.sqrt(r2);
    if (Math.abs(ring - 0.7) < 0.012 || Math.abs(ring - 0.45) < 0.01) c = '#8a6a2a';
    const ang = Math.atan2(ny, nx);
    if (ring > 0.2 && ring < 0.9 && Math.abs(Math.sin(ang * 6)) < 0.012) c = '#5a4a8a';
    return [c];
  });
  for (let a = 0; a < Math.PI * 2; a += 0.004) {
    for (const k of [0.7, 0.45]) E.set(CX + Math.cos(a) * RX * k, CY + Math.sin(a) * RY * k, '#ffd36b', 0.25);
    E.set(CX + Math.cos(a) * RX * 0.97, CY + Math.sin(a) * RY * 0.97, '#fff4cf', 0.2);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, x = CX + Math.cos(a) * RX * 0.58, y = CY + Math.sin(a) * RY * 0.58;
    const g = hash2(i, 3, 3);
    E.line(x - 3, y - 2, x + 3, y + 2, '#fff4cf', 0.55);
    if (g > 0.5) E.line(x - 3, y + 2, x + 3, y - 2, '#ffd36b', 0.5);
    else E.hl(x - 3, y, 7, '#ffd36b', 0.5);
  }
  for (let k = 0; k < 7; k++) {
    let x = CX + (r() - 0.5) * 300, y = CY + (r() - 0.5) * 140;
    for (let i = 0; i < 40; i++) {
      x += r() * 4 - 2;
      y += r() * 2 - 1;
      const nx = (x - CX) / RX, ny = (y - CY) / RY;
      if (nx * nx + ny * ny < 0.9) E.set(x, y, '#fff4cf', 0.35);
    }
  }
  return { p: A, e: E };
}

export function lightColumn(frame = 0): Art {
  const w = 90, h = 260, p = new Px(w, h), e = new Px(w, h);
  const cx = w / 2;
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const hw = 16 + Math.sin(y / 18 + frame * 0.7) * 2 + t * 10;
    for (let x = -hw - 10; x <= hw + 10; x++) {
      const k = Math.abs(x) / hw;
      if (k < 1) e.set(cx + x, y, mix('#ffffff', '#fff4cf', k), Math.min(1, 0.95 - k * 0.4));
      else e.set(cx + x, y, '#ffd36b', 0.25 * (1 - (k - 1) * 2));
    }
  }
  for (let i = 0; i < 40; i++) {
    const y = hash2(i, frame, 3) * h, x = cx + (hash2(i, 1, frame) - 0.5) * 40;
    e.set(x, y, '#ffffff');
  }
  e.ellipse(cx, h - 8, 40, 12, '#fff4cf', 0.35);
  e.ring(cx, h - 8, 40, 12, '#ffd36b', 0.9, 1.5);
  return { p, e };
}

export function memoryPage(seed: number): Px {
  const p = new Px(12, 10), r = rng(seed);
  const a = r() * 2;
  p.poly([[1 + a, 0], [11, 1], [10, 9], [0, 8 - a]], '#f4ecd8');
  for (let k = 0; k < 3; k++) p.line(2 + a, 2 + k * 2, 9, 2 + k * 2, '#8a7a6a', 0.6);
  p.outline(0, '#6a5a3a');
  return p;
}

export const END = { W: 640, H: 360 } as const;

export function keeperRoom(): Art {
  const { W, H } = END;
  const A = new Px(W, H), E = new Px(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 40, y / 30, 5, 3);
      A.set(x, y, y < 120 ? mix('#c8d0dc', '#dfe6ee', n) : mix('#b8c2ce', '#ccd4de', n));
    }
  for (let ty = 120; ty < H; ty += 20) for (let x = 0; x < W; x++) A.set(x, ty, '#a8b2be');
  for (let tx = 0; tx < W; tx += 40) for (let y = 120; y < H; y++) A.set(tx, y, '#aeb8c4');
  for (let i = 0; i < 9; i++) {
    const x = 16 + i * 70;
    A.rect(x, 30, 56, 86, '#9aa4b2');
    A.hl(x, 30, 56, '#e8eef4');
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 3; c++) {
        A.rect(x + 4 + c * 17, 36 + r * 15, 15, 12, '#b8c2ce');
        A.rect(x + 9 + c * 17, 41 + r * 15, 5, 2, '#6a7482');
      }
  }
  for (let y = 0; y < 14; y++) A.rect(0, 120 + y, W, 1, '#6a7482', 0.3 * (1 - y / 14));
  E.rect(0, 0, W, 6, '#ffffff', 0.4);
  return { p: A, e: E };
}
export function readingDesk(): Art {
  const p = new Px(110, 44), e = new Px(110, 44), W = ramp('#8a96a4');
  p.rect(0, 0, 110, 20, W[3]);
  p.hl(0, 0, 110, W[4]);
  p.rect(0, 20, 110, 8, W[1]);
  for (const x of [2, 104]) p.rect(x, 28, 4, 16, W[0]);
  const AC = ['#ffb347', '#9fb4c8', '#7dffb0'];
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * 26;
    p.rect(x, 3, 20, 14, AC[i]);
    p.rect(x + 1, 4, 18, 12, '#f4ead4');
    for (let k = 0; k < 4; k++) p.hl(x + 3, 6 + k * 2, 14, '#8a8a8a');
    e.rect(x, 3, 20, 14, AC[i], 0.15);
  }
  p.outline(0, '#4a5462');
  return { p, e };
}
export function editorRoom(): Art {
  const { W, H } = END;
  const A = new Px(W, H), E = new Px(W, H);
  A.rect(0, 0, W, H, '#f4f4f0');
  for (let y = 120; y < H; y += 24) A.hl(0, y, W, '#e6e6e0');
  for (let x = 0; x < W; x += 48) A.vl(x, 120, H - 120, '#e8e8e2');
  A.rect(0, 112, W, 8, '#dcdcd4');
  A.rect(200, 24, 240, 60, '#3a3428');
  A.rect(204, 28, 232, 52, '#1a1610');
  for (let i = 0; i < 2; i++) A.rect(150 + i * 300, 130, 40, 40, '#ececE6');
  for (let i = 0; i < 6; i++) {
    A.rect(40 + i * 100, 4, 60, 6, '#ffffff');
    E.rect(40 + i * 100, 4, 60, 6, '#ffffff', 0.8);
  }
  void bayer;
  void sh;
  return { p: A, e: E };
}
export function mergeBook(): Art {
  const p = new Px(64, 40), e = new Px(64, 40);
  p.poly([[2, 10], [32, 16], [62, 10], [62, 34], [32, 40], [2, 34]], '#6a3a2a');
  p.poly([[4, 6], [32, 12], [32, 36], [4, 30]], '#f4ecd8');
  p.poly([[60, 6], [32, 12], [32, 36], [60, 30]], '#e8dcc4');
  p.vl(32, 12, 24, '#a89878');
  for (let k = 0; k < 6; k++) {
    p.line(8, 11 + k * 3, 28, 15 + k * 3, '#8a7a6a', 0.7);
    p.line(36, 15 + k * 3, 56, 11 + k * 3, '#8a7a6a', 0.7);
  }
  e.poly([[4, 6], [32, 12], [32, 36], [4, 30]], '#fff4cf', 0.35);
  e.poly([[60, 6], [32, 12], [32, 36], [60, 30]], '#fff4cf', 0.3);
  p.outline(0, '#3a2414');
  return { p, e };
}
