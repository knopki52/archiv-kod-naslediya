import { mulberry32 } from './Noise';
import { makeRamp, OUTLINE, PAL, shade } from './Palette';
import { PixelCanvas } from './PixelCanvas';


export function pine(h = 64, seed = 1): PixelCanvas {
  const w = Math.round(h * 0.55);
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  const cx = Math.floor(w / 2);
  p.rect(cx - 1, h - 8, 3, 8, '#4a2f1a');
  const tiers = 4;
  for (let t = 0; t < tiers; t++) {
    const top = Math.floor((t * (h - 12)) / tiers);
    const tw = Math.round((w / 2) * (0.45 + (t + 1) / tiers / 1.1));
    const th = Math.round((h - 12) / tiers) + 6;
    p.poly([[cx, top], [cx + tw, top + th], [cx - tw, top + th]], t % 2 ? '#1f4a3a' : '#25594a');
    p.poly([[cx, top], [cx + Math.round(tw * 0.5), top + Math.round(th * 0.5)], [cx - Math.round(tw * 0.5), top + Math.round(th * 0.5)]], '#e8f1ff');
    for (let i = 0; i < 6; i++) p.px(cx - tw + Math.floor(r() * tw * 2), top + th - 1 - Math.floor(r() * 3), '#bcd0ea');
  }
  return p.outline(OUTLINE);
}

export function izba(w = 96, h = 72, lit = true): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const wood = makeRamp(PAL.nov.wood);
  const bodyTop = Math.floor(h * 0.38);
  p.rect(4, bodyTop, w - 8, h - bodyTop, wood.base);
  for (let y = bodyTop; y < h; y += 5) {
    p.rect(4, y, w - 8, 1, wood.shadow);
    p.rect(4, y + 4, w - 8, 1, wood.shadow);
    p.rect(2, y, 4, 4, wood.light);
    p.rect(w - 6, y, 4, 4, wood.light);
  }
  p.poly([[0, bodyTop + 2], [w / 2, 4], [w, bodyTop + 2], [w - 6, bodyTop + 8], [6, bodyTop + 8]], '#5a3b25');
  p.poly([[2, bodyTop], [w / 2, 0], [w - 2, bodyTop], [w - 8, bodyTop + 3], [w / 2, 6], [8, bodyTop + 3]], '#e8f1ff');
  p.rect(8, bodyTop - 1, w - 16, 2, '#bcd0ea');
  const wx = Math.floor(w * 0.18);
  p.rect(wx, bodyTop + 12, 16, 14, '#3a2a1a');
  p.rect(wx + 2, bodyTop + 14, 12, 10, lit ? PAL.nov.window : '#2a3550');
  if (lit) p.rect(wx + 2, bodyTop + 14, 12, 3, '#ffd88a');
  p.rect(wx + 7, bodyTop + 14, 2, 10, '#3a2a1a');
  p.rect(wx + 2, bodyTop + 18, 12, 2, '#3a2a1a');
  const dx = Math.floor(w * 0.62);
  p.rect(dx, h - 28, 16, 28, '#3a2a1a');
  p.rect(dx + 2, h - 26, 12, 26, '#5a3b25');
  p.px(dx + 12, h - 14, '#ffd36b');
  p.rect(w - 22, 4, 8, 14, '#6d5a4a');
  p.rect(w - 22, 4, 8, 2, '#e8f1ff');
  return p.outline(OUTLINE);
}

export function bookshelf(w = 48, h = 80, seed = 3): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  p.rect(0, 0, w, h, '#3a2a40');
  const shelves = 5;
  const sh = Math.floor(h / shelves);
  const colors = ['#8a2f3a', '#2f5a8a', '#3a7a5a', '#c9a15b', '#5a4f8a', '#a0602c', '#cfd8e6'];
  for (let s = 0; s < shelves; s++) {
    const y = s * sh;
    p.rect(2, y + sh - 3, w - 4, 3, '#5a3b25');
    let x = 3;
    while (x < w - 5) {
      const bw = 2 + Math.floor(r() * 3);
      const bh = sh - 8 + Math.floor(r() * 5);
      const c = colors[Math.floor(r() * colors.length)]!;
      p.rect(x, y + sh - 3 - bh, bw, bh, c);
      p.rect(x, y + sh - 3 - bh, 1, bh, shade(c, 0.25));
      x += bw + (r() > 0.85 ? 3 : 0);
    }
  }
  p.strokeRect(0, 0, w, h, '#5a3b25');
  return p.outline(OUTLINE);
}

export function stove(lit = true): PixelCanvas {
  const p = new PixelCanvas(28, 40);
  p.rect(11, 0, 4, 14, '#3a3d4a');
  p.rect(10, 0, 6, 2, '#2a2d38');
  p.rect(3, 14, 22, 18, '#4a4f5e');
  p.rect(3, 14, 22, 2, '#6c7a8c');
  p.rect(3, 30, 22, 2, '#2a2d38');
  p.rect(7, 19, 10, 8, '#1a1418');
  p.rect(8, 20, 8, 6, lit ? PAL.len.stove : '#3a2a2a');
  if (lit) {
    p.rect(9, 22, 6, 3, '#ffcf70');
    p.rect(11, 23, 2, 2, '#fff2c0');
  }
  p.rect(4, 32, 3, 6, '#2a2d38');
  p.rect(21, 32, 3, 6, '#2a2d38');
  return p.outline(OUTLINE);
}

export function lamp(lit = true): PixelCanvas {
  const p = new PixelCanvas(16, 32);
  p.rect(7, 12, 2, 18, '#3a3d4a');
  p.rect(4, 29, 8, 3, '#2a2d38');
  p.poly([[3, 12], [13, 12], [11, 4], [5, 4]], '#6c7a8c');
  p.rect(5, 12, 6, 2, lit ? '#ffcf70' : '#3a3d4a');
  return p.outline(OUTLINE);
}

export function crate(w = 22, h = 18, seed = 5): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  p.rect(0, 0, w, h, '#8a6a44');
  p.strokeRect(0, 0, w, h, '#5a3b25');
  p.line(0, 0, w - 1, h - 1, '#5a3b25');
  p.line(w - 1, 0, 0, h - 1, '#5a3b25');
  p.speckle(r, ['#a8845a', '#6a4a2a'], 0.12);
  return p.outline(OUTLINE);
}

export function well(): PixelCanvas {
  const p = new PixelCanvas(34, 44);
  p.rect(3, 22, 28, 20, '#8a8a92');
  for (let y = 22; y < 42; y += 5) p.rect(3, y, 28, 1, '#5a5a66');
  for (let x = 3; x < 31; x += 7) p.rect(x, 22, 1, 20, '#5a5a66');
  p.rect(3, 20, 28, 3, '#bcd0ea');
  p.rect(5, 6, 3, 18, '#5a3b25');
  p.rect(26, 6, 3, 18, '#5a3b25');
  p.poly([[1, 8], [17, 0], [33, 8]], '#7a5232');
  p.poly([[1, 8], [17, 1], [33, 8], [31, 6], [17, 3], [3, 6]], '#e8f1ff');
  p.line(17, 8, 17, 20, '#3a2a1a');
  p.rect(14, 19, 6, 4, '#6d4a2c');
  return p.outline(OUTLINE);
}

export function rocket(h = 110): PixelCanvas {
  const w = 34;
  const p = new PixelCanvas(w, h);
  const cx = Math.floor(w / 2);
  for (const sx of [-9, 9]) {
    p.poly([[cx + sx, h - 4], [cx + sx - 3, h - 4], [cx + sx - 3, h * 0.45], [cx + sx, h * 0.3], [cx + sx + 3, h * 0.45], [cx + sx + 3, h - 4]], '#e8e4da');
    p.rect(cx + sx - 3, h * 0.55, 6, 3, '#b0302a');
  }
  p.rect(cx - 5, Math.floor(h * 0.2), 10, h - Math.floor(h * 0.2) - 4, '#f0ece2');
  p.rect(cx - 5, Math.floor(h * 0.2), 2, h - Math.floor(h * 0.2) - 4, '#c8c4b8');
  p.poly([[cx, 2], [cx + 5, Math.floor(h * 0.22)], [cx - 5, Math.floor(h * 0.22)]], '#e8e4da');
  p.rect(cx - 5, Math.floor(h * 0.38), 10, 4, '#b0302a');
  p.rect(cx - 5, Math.floor(h * 0.62), 10, 2, '#2d3f6a');
  for (let i = -2; i <= 2; i++) p.rect(cx + i * 4 - 1, h - 4, 3, 4, '#3a3d4a');
  return p.outline('#2a2d38');
}

export function gantry(h = 120): PixelCanvas {
  const p = new PixelCanvas(30, h);
  p.rect(0, 0, 3, h, '#6a4a3a');
  p.rect(27, 0, 3, h, '#6a4a3a');
  for (let y = 0; y < h - 10; y += 12) {
    p.line(3, y, 27, y + 12, '#8a6a4a');
    p.line(27, y, 3, y + 12, '#8a6a4a');
    p.rect(0, y, 30, 2, '#6a4a3a');
  }
  return p.outline(OUTLINE);
}

export function antennaTower(h = 80): PixelCanvas {
  const p = new PixelCanvas(24, h);
  p.line(12, 0, 4, h - 1, '#8d8f94');
  p.line(12, 0, 20, h - 1, '#8d8f94');
  for (let y = 10; y < h - 4; y += 10) {
    const half = Math.round(((y / h) * 8) + 1);
    p.line(12 - half, y, 12 + half, y, '#8d8f94');
    p.line(12 - half, y, 12 + half, y + 10, '#6a6c70');
  }
  p.rect(10, 0, 4, 3, '#b0302a');
  p.px(12, 0, '#ffd23f');
  return p.outline(OUTLINE);
}

export function bookPortal(active = true, accent = '#5fe3ff'): PixelCanvas {
  const p = new PixelCanvas(36, 44);
  if (active) {
    p.ellipse(18, 18, 14, 16, `${accent}22`);
    p.ellipse(18, 18, 9, 11, `${accent}33`);
  }
  p.poly([[3, 30], [18, 26], [18, 40], [3, 40]], active ? '#e8f1ff' : '#4a4660');
  p.poly([[33, 30], [18, 26], [18, 40], [33, 40]], active ? '#cfd8e6' : '#3a3650');
  p.line(18, 26, 18, 40, active ? '#5a4f8a' : '#2a2640');
  for (let i = 0; i < 4; i++) {
    p.line(6, 32 + i * 2, 16, 30 + i * 2, active ? accent : '#2a2640');
    p.line(20, 30 + i * 2, 30, 32 + i * 2, active ? accent : '#2a2640');
  }
  p.rect(2, 40, 32, 3, active ? '#5a4f8a' : '#2a2640');
  if (active) {
    for (const [x, y] of [[10, 12], [18, 6], [26, 14], [14, 20], [23, 22]] as const) {
      p.rect(x, y, 3, 4, '#ffffffcc');
      p.px(x, y, accent);
    }
  }
  return p;
}

export function consoleDesk(w = 64, h = 36, seed = 9): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  p.poly([[0, h], [4, 12], [w - 4, 12], [w, h]], '#4a4f5e');
  p.rect(4, 12, w - 8, 3, '#6c7a8c');
  p.rect(6, 4, w - 12, 8, '#2a2d38');
  p.rect(8, 6, w - 16, 4, '#0c1a14');
  for (let x = 10; x < w - 12; x += 3) p.px(x, 7 + Math.floor(r() * 3), PAL.baik.panelG);
  for (let i = 0; i < 12; i++) p.rect(8 + i * 4, 18 + Math.floor(r() * 4), 2, 2, [PAL.baik.panelG, PAL.baik.panelY, '#ff6b8b'][Math.floor(r() * 3)]!);
  for (let i = 0; i < 6; i++) p.rect(10 + i * 8, 26, 4, 4, '#14101f');
  return p.outline(OUTLINE);
}

export function desk(w = 52, h = 30): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 6, w, 5, '#7a5232');
  p.rect(0, 6, w, 1, '#a07848');
  p.rect(3, 11, 4, h - 11, '#5a3b25');
  p.rect(w - 7, 11, 4, h - 11, '#5a3b25');
  p.rect(10, 1, 14, 5, '#f4e9c8');
  p.rect(16, 1, 1, 5, '#c9b88a');
  p.rect(34, 2, 4, 4, '#3a3d4a');
  return p.outline(OUTLINE);
}

export function fence(w = 48): PixelCanvas {
  const p = new PixelCanvas(w, 20);
  for (let x = 2; x < w - 2; x += 8) {
    p.rect(x, 2, 4, 18, '#6a4a2a');
    p.rect(x, 2, 4, 2, '#e8f1ff');
  }
  p.rect(0, 7, w, 2, '#5a3b25');
  p.rect(0, 14, w, 2, '#5a3b25');
  return p.outline(OUTLINE);
}

export function snowdrift(w = 48, h = 10, seed = 2): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  for (let x = 0; x < w; x++) {
    const top = Math.round(h * (0.35 + 0.35 * Math.sin((x / w) * Math.PI) - r() * 0.05));
    p.rect(x, h - top, 1, top, '#e8f1ff');
    p.px(x, h - top, '#ffffff');
    p.px(x, h - 2, '#bcd0ea');
  }
  return p;
}

export function metronome(): PixelCanvas {
  const p = new PixelCanvas(24, 36);
  p.poly([[12, 0], [22, 34], [2, 34]], '#6a4a2a');
  p.poly([[12, 5], [19, 32], [5, 32]], '#8a6a44');
  p.line(12, 28, 17, 6, '#e8e4da');
  p.rect(15, 10, 4, 3, '#c9a15b');
  p.rect(1, 34, 22, 2, '#3a2a1a');
  return p.outline(OUTLINE);
}

export function sky(w: number, h: number, top: string, bottom: string, stars = 0, seed = 1): PixelCanvas {
  const p = new PixelCanvas(w, h).gradientV(0, 0, w, h, top, bottom, 6);
  const r = mulberry32(seed);
  for (let i = 0; i < stars; i++) p.px(Math.floor(r() * w), Math.floor(r() * h * 0.7), r() > 0.7 ? '#ffffff' : '#bcd0ea');
  return p;
}

export function skyline(w: number, h: number, color: string, amp: number, seed: number, step = 6): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  let y = h - amp;
  for (let x = 0; x < w; x += step) {
    y = Math.max(h - amp * 2, Math.min(h - 4, y + Math.round((r() - 0.5) * amp)));
    p.rect(x, y, step, h - y, color);
  }
  return p;
}

export function lightSprite(size = 64): PixelCanvas {
  const p = new PixelCanvas(size, size);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c + 0.5, y - c + 0.5) / c;
      if (d >= 1) continue;
      const a = Math.round(255 * (1 - d) ** 1.6);
      p.px(x, y, `#ffffff${a.toString(16).padStart(2, '0')}`);
    }
  }
  return p;
}

export function lectern(glowing = true): PixelCanvas {
  const p = new PixelCanvas(36, 44);
  p.rect(15, 22, 6, 18, '#3a2a40');
  p.rect(8, 40, 20, 4, '#2a1f30');
  p.poly([[2, 14], [18, 10], [34, 14], [32, 24], [18, 22], [4, 24]], '#5a3b25');
  p.poly([[4, 13], [18, 9], [18, 20], [4, 21]], glowing ? '#e8f1ff' : '#8a8a96');
  p.poly([[32, 13], [18, 9], [18, 20], [32, 21]], glowing ? '#cfd8e6' : '#7a7a86');
  for (let i = 0; i < 4; i++) {
    p.line(6, 12 + i * 2, 16, 11 + i * 2, glowing ? '#5fe3ff' : '#4a4a56');
    p.line(20, 11 + i * 2, 30, 12 + i * 2, glowing ? '#5fe3ff' : '#4a4a56');
  }
  return p.outline(OUTLINE);
}

export function leaf(): PixelCanvas {
  const p = new PixelCanvas(14, 10);
  p.poly([[1, 8], [3, 1], [12, 2], [13, 9]], '#e9dfc0');
  p.line(3, 4, 11, 4, '#8d7f5c');
  p.line(3, 6, 10, 6, '#8d7f5c');
  p.rect(1, 0, 12, 1, '#5fe3ff88');
  return p.outline(OUTLINE);
}

export function showcase(): PixelCanvas {
  const p = new PixelCanvas(60, 78);
  p.rect(2, 2, 56, 74, '#241a3a');
  p.rect(5, 5, 50, 62, '#14102a');
  p.rect(5, 5, 50, 62, '#5fe3ff14');
  for (let i = 0; i < 3; i++) {
    const y = 12 + i * 19;
    p.rect(9, y + 14, 42, 3, '#8a5cff');
    p.rect(9, y + 14, 42, 1, '#c9b8ff');
    p.rect(26, y + 3, 8, 11, '#1b1530');
  }
  p.rect(0, 66, 60, 12, '#3a2a55');
  p.rect(0, 66, 60, 2, '#5a4a80');
  p.poly([[8, 6], [20, 6], [8, 30]], '#ffffff12');
  return p.outline(OUTLINE);
}

export function miniCard(accent: string): PixelCanvas {
  const p = new PixelCanvas(14, 18);
  p.rect(0, 0, 14, 18, '#e8dfc4');
  p.rect(0, 0, 14, 4, accent);
  p.rect(2, 7, 10, 1, '#7a6a4a');
  p.rect(2, 10, 8, 1, '#7a6a4a');
  p.rect(2, 13, 9, 1, '#7a6a4a');
  return p.outline(OUTLINE);
}

export function coreDoor(open: boolean, sockets = 0): PixelCanvas {
  const p = new PixelCanvas(52, 92);
  p.rect(0, 14, 52, 78, '#241a3a');
  p.ellipse(26, 16, 26, 16, '#241a3a');
  p.rect(5, 18, 42, 74, open ? '#fff4cf' : '#0d0b1e');
  p.ellipse(26, 18, 21, 13, open ? '#fff4cf' : '#0d0b1e');
  if (open) {
    p.rect(8, 22, 36, 70, '#ffffff');
    p.rect(14, 30, 24, 62, '#fff4cf');
  } else {
    p.rect(5, 18, 42, 74, '#0d0b1e');
    p.line(26, 6, 26, 92, '#2a2150');
  }
  for (let i = 0; i < 3; i++) {
    p.circle(14 + i * 12, 8, 4, '#14102a');
    p.circle(14 + i * 12, 8, 3, i < sockets ? '#ffd36b' : '#3a2a55');
  }
  return p.outline(OUTLINE);
}

export function hallFloor(w: number, h: number): PixelCanvas {
  const p = new PixelCanvas(w, h).gradientV(0, 0, w, h, '#2f2558', '#120e26', 6);
  const vx = w / 2;
  for (let i = -8; i <= 8; i++) {
    const x2 = vx + i * (w / 5);
    p.line(vx + i * 6, 0, x2, h - 1, '#4a3a7a66');
  }
  for (const f of [0.1, 0.24, 0.42, 0.66, 0.96]) p.rect(0, Math.floor(h * f), w, 1, '#4a3a7a66');
  return p;
}


export function stall(w = 60, h = 52): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(4, 14, 3, h - 14, '#5a3b25');
  p.rect(w - 7, 14, 3, h - 14, '#5a3b25');
  p.rect(2, h - 20, w - 4, 8, '#7a5232');
  p.rect(2, h - 20, w - 4, 2, '#a07848');
  p.rect(7, 22, w - 14, h - 40, '#3a2a1a');
  for (let x = 8; x < w - 8; x += 6) p.rect(x, 22, 1, h - 40, '#241a10');
  for (let i = 0; i < w / 6; i++) p.rect(i * 6, 6, 6, 10, i % 2 ? '#e8f1ff' : '#b8433a');
  p.rect(0, 14, w, 2, '#5a3b25');
  p.rect(0, 4, w, 2, '#e8f1ff');
  return p.outline(OUTLINE);
}

export function chest(): PixelCanvas {
  const p = new PixelCanvas(34, 28);
  p.rect(2, 12, 30, 14, '#7a5232');
  p.rect(2, 12, 30, 2, '#a07848');
  p.rect(2, 20, 30, 2, '#3a2a1a');
  p.rect(4, 12, 2, 14, '#8d8f94');
  p.rect(28, 12, 2, 14, '#8d8f94');
  p.poly([[2, 12], [6, 3], [28, 3], [32, 12]], '#6a4528');
  p.rect(7, 5, 20, 3, '#f4e9c8');
  p.rect(9, 6, 16, 1, '#ffd36b');
  p.rect(15, 18, 4, 4, '#ffd36b');
  return p.outline(OUTLINE);
}

export function logsPile(w = 28, h = 20): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const n = 4 - r;
    for (let i = 0; i < n; i++) {
      const x = 2 + i * 7 + r * 3.5;
      const y = h - 7 - r * 6;
      p.circle(x + 3, y + 3, 3, '#8a5a32');
      p.circle(x + 3, y + 3, 1, '#d9b080');
    }
  }
  return p.outline(OUTLINE);
}

export function brickOven(lit = true): PixelCanvas {
  const p = new PixelCanvas(72, 64);
  p.poly([[2, 64], [2, 24], [36, 4], [70, 24], [70, 64]], '#a8603a');
  for (let y = 10; y < 64; y += 6) {
    p.rect(2, y, 68, 1, '#7a4226');
    for (let x = (y / 6) % 2 ? 4 : 10; x < 70; x += 12) p.rect(x, y, 1, 6, '#7a4226');
  }
  p.rect(2, 20, 68, 3, '#c07848');
  p.poly([[16, 64], [16, 36], [36, 26], [56, 36], [56, 64]], '#1a1010');
  if (lit) {
    p.poly([[20, 64], [20, 40], [36, 32], [52, 40], [52, 64]], '#ff7a2f');
    p.poly([[26, 64], [26, 46], [36, 40], [46, 46], [46, 64]], '#ffcf70');
    p.rect(32, 52, 8, 12, '#fff2c0');
  }
  p.rect(30, 0, 12, 8, '#7a4226');
  return p.outline(OUTLINE);
}

export function barrel(w = 16, h = 22): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(1, 2, w - 2, h - 4, '#7a5232');
  p.rect(0, 5, w, 2, '#5a5f6a');
  p.rect(0, h - 8, w, 2, '#5a5f6a');
  p.rect(2, 2, 2, h - 4, '#a07848');
  p.ellipse(w / 2, 2, w / 2 - 1, 2, '#3a2a1a');
  return p.outline(OUTLINE);
}

export function shelfRolls(w = 44, h = 64, seed = 4): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  p.rect(0, 0, w, h, '#4a3322');
  for (let s = 0; s < 4; s++) {
    const y = 4 + s * 16;
    p.rect(2, y + 12, w - 4, 3, '#7a5232');
    for (let x = 4; x < w - 8; x += 7) {
      if (r() < 0.25) continue;
      if (r() > 0.6) {
        p.rect(x, y + 5, 6, 7, '#e8d3a0');
        p.rect(x, y + 5, 6, 1, '#fff4cf');
      } else {
        p.circle(x + 3, y + 8, 3, '#d9b78a');
        p.circle(x + 3, y + 8, 1, '#8a6540');
      }
    }
  }
  return p.outline(OUTLINE);
}

export function windowFrame(w = 24, h = 26, color = '#ffb347'): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 0, w, h, '#3a2a1a');
  p.rect(2, 2, w - 4, h - 4, color);
  p.rect(2, 2, w - 4, 4, shade(color, 0.35));
  p.rect(Math.floor(w / 2) - 1, 2, 2, h - 4, '#3a2a1a');
  p.rect(2, Math.floor(h / 2) - 1, w - 4, 2, '#3a2a1a');
  return p.outline(OUTLINE);
}

export function woodWall(w: number, h: number, base = '#6d4a2c', seed = 8): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  const log = makeRamp(base);
  for (let y = 0; y < h; y += 10) {
    p.rect(0, y, w, 8, log.base);
    p.rect(0, y, w, 2, log.light);
    p.rect(0, y + 6, w, 2, log.shadow);
    p.rect(0, y + 8, w, 2, '#2a1a10');
    for (let i = 0; i < 6; i++) p.rect(Math.floor(r() * w), y + 2 + Math.floor(r() * 4), 6 + Math.floor(r() * 10), 1, log.shadow);
  }
  return p;
}

export function plankFloor(w: number, h: number, base = '#8a6a44', seed = 9): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  const f = makeRamp(base);
  const rows = Math.ceil(h / 9);
  for (let i = 0; i < rows; i++) {
    const y = i * 9;
    p.rect(0, y, w, 9, i % 2 ? f.base : f.light);
    p.rect(0, y + 8, w, 1, f.shadow);
    for (let x = (i * 37) % 48; x < w; x += 48 + Math.floor(r() * 24)) p.rect(x, y, 1, 9, f.shadow);
    for (let k = 0; k < 5; k++) p.px(Math.floor(r() * w), y + 1 + Math.floor(r() * 6), f.shadow);
  }
  return p;
}

export function bakeTable(w = 52, h = 30): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 8, w, 5, '#a07848');
  p.rect(0, 8, w, 1, '#d9b080');
  p.rect(4, 13, 4, h - 13, '#5a3b25');
  p.rect(w - 8, 13, 4, h - 13, '#5a3b25');
  p.ellipse(16, 6, 9, 3, '#f0e6c8');
  p.ellipse(16, 5, 7, 2, '#fff4cf');
  p.rect(32, 2, 8, 6, '#6d4a2c');
  p.rect(42, 4, 6, 4, '#c98a4a');
  return p.outline(OUTLINE);
}

export function scribeDesk(w = 56, h = 44): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.poly([[2, 16], [w - 2, 10], [w - 2, 16], [2, 22]], '#8a6540');
  p.rect(4, 22, 4, h - 22, '#5a3b25');
  p.rect(w - 8, 18, 4, h - 18, '#5a3b25');
  p.rect(10, 12, 18, 6, '#f4e9c8');
  p.line(32, 14, 44, 6, '#e8e4da');
  p.rect(w - 14, 8, 3, 7, '#f4e9c8');
  p.poly([[w - 13, 2], [w - 11, 6], [w - 13, 8], [w - 15, 6]], '#ffb347');
  return p.outline(OUTLINE);
}

export function church(h = 70, color = '#9ab0cc'): PixelCanvas {
  const w = Math.round(h * 0.7);
  const p = new PixelCanvas(w, h);
  const cx = Math.floor(w / 2);
  p.rect(cx - 8, h * 0.45, 16, h * 0.55, color);
  p.poly([[cx - 8, h * 0.45], [cx, h * 0.3], [cx + 8, h * 0.45]], color);
  p.rect(cx - 3, h * 0.2, 6, h * 0.15, color);
  p.circle(cx, h * 0.15, 6, color);
  p.poly([[cx - 5, h * 0.17], [cx, 2], [cx + 5, h * 0.17]], color);
  p.rect(cx, 0, 1, 5, '#e8d3a0');
  p.rect(cx - 12, h * 0.6, 8, h * 0.4, color);
  p.circle(cx - 8, h * 0.58, 4, color);
  return p;
}

export function bench(w = 42, h = 16): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 4, w, 4, '#8a6540');
  p.rect(0, 4, w, 1, '#b08858');
  p.rect(3, 8, 3, h - 8, '#5a3b25');
  p.rect(w - 6, 8, 3, h - 8, '#5a3b25');
  return p.outline(OUTLINE);
}

export function houseStove(lit = true): PixelCanvas {
  const p = new PixelCanvas(48, 62);
  p.rect(2, 8, 44, 54, '#d9d0b8');
  for (let y = 12; y < 62; y += 8) p.rect(2, y, 44, 1, '#b0a688');
  p.rect(2, 8, 44, 3, '#f0e8d0');
  p.rect(14, 38, 20, 14, '#1a1010');
  if (lit) {
    p.rect(16, 44, 16, 8, '#ff7a2f');
    p.rect(20, 46, 8, 6, '#ffcf70');
  }
  p.rect(18, 0, 12, 10, '#a8a090');
  return p.outline(OUTLINE);
}


export function frostWindow(w = 34, h = 70, boarded = false): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 0, w, h, '#2b2f3a');
  p.rect(3, 3, w - 6, h - 6, '#a9bcd2');
  p.gradientV(3, 3, w - 6, h - 6, '#c9d8e8', '#7f93ad', 4);
  const r = mulberry32(12);
  for (let i = 0; i < 60; i++) p.px(3 + Math.floor(r() * (w - 6)), 3 + Math.floor(r() * (h - 6)), r() > 0.5 ? '#ffffff' : '#e8f1ff');
  p.rect(Math.floor(w / 2) - 1, 3, 2, h - 6, '#2b2f3a');
  p.rect(3, Math.floor(h / 2) - 1, w - 6, 2, '#2b2f3a');
  p.line(4, 4, w - 5, h - 5, '#e8e4da');
  p.line(w - 5, 4, 4, h - 5, '#e8e4da');
  if (boarded) {
    p.rect(3, Math.floor(h / 2) + 2, w - 6, Math.floor(h / 2) - 5, '#5a3b25');
    for (let x = 3; x < w - 3; x += 5) p.rect(x, Math.floor(h / 2) + 2, 1, Math.floor(h / 2) - 5, '#3a2412');
  }
  return p.outline(OUTLINE);
}

export function radioPlate(): PixelCanvas {
  const p = new PixelCanvas(26, 26);
  p.circle(13, 13, 12, '#14141c');
  p.circle(13, 13, 9, '#2a2a36');
  p.circle(13, 13, 4, '#0c0c12');
  p.circle(13, 13, 11, '#3a3a48', false);
  p.px(8, 8, '#6a6a7a');
  return p.outline(OUTLINE);
}

export function sled(w = 56, h = 22): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(2, 8, w - 4, 5, '#7a5232');
  p.rect(2, 8, w - 4, 1, '#a07848');
  p.rect(6, 13, 3, 4, '#5a3b25');
  p.rect(w - 10, 13, 3, 4, '#5a3b25');
  p.rect(0, 17, w, 2, '#5a5f6a');
  p.rect(0, 15, 4, 3, '#5a5f6a');
  return p.outline(OUTLINE);
}

export function seedBox(): PixelCanvas {
  const p = new PixelCanvas(30, 24);
  p.rect(1, 6, 28, 16, '#8a6a44');
  p.rect(1, 6, 28, 2, '#b08858');
  for (let i = 0; i < 4; i++) p.rect(3 + i * 7, 2, 5, 6, i % 2 ? '#c9b88a' : '#a89868');
  p.rect(10, 12, 10, 6, '#e8dfc4');
  p.line(12, 14, 18, 14, '#7a6a4a');
  return p.outline(OUTLINE);
}

export function papersStack(): PixelCanvas {
  const p = new PixelCanvas(30, 22);
  p.rect(1, 12, 28, 8, '#6a5a4a');
  p.rect(2, 8, 24, 5, '#8a7a5a');
  p.rect(4, 4, 20, 5, '#e8dfc4');
  p.rect(1, 12, 28, 1, '#a89878');
  p.line(6, 6, 20, 6, '#8d7f5c');
  p.rect(23, 14, 4, 5, '#b8433a');
  return p.outline(OUTLINE);
}

export function brickWall(w: number, h: number, base = '#6a4a42', seed = 21): PixelCanvas {
  const p = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  const b = makeRamp(base);
  p.rect(0, 0, w, h, b.shadow);
  for (let y = 0; y < h; y += 6) {
    for (let x = (y / 6) % 2 ? -6 : 0; x < w; x += 12) {
      const c = r() > 0.2 ? b.base : b.light;
      p.rect(x + 1, y + 1, 10, 4, c);
    }
  }
  for (let i = 0; i < 10; i++) p.rect(Math.floor(r() * w), Math.floor(r() * h), 6 + Math.floor(r() * 14), 3 + Math.floor(r() * 6), '#8d8f94aa');
  return p;
}

export function chopBlock(): PixelCanvas {
  const p = new PixelCanvas(40, 30);
  p.rect(10, 16, 20, 12, '#7a5232');
  p.ellipse(20, 16, 10, 3, '#a07848');
  p.line(14, 15, 26, 15, '#5a3b25');
  p.rect(2, 6, 3, 14, '#6a4a2a');
  p.rect(2, 6, 12, 2, '#6a4a2a');
  p.rect(32, 20, 6, 3, '#8a6a44');
  p.rect(30, 24, 8, 3, '#8a6a44');
  return p.outline(OUTLINE);
}

export function gate(w = 64, h = 64): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 0, 6, h, '#3a3d4a');
  p.rect(w - 6, 0, 6, h, '#3a3d4a');
  p.rect(0, 0, 6, 4, '#e8f1ff');
  p.rect(w - 6, 0, 6, 4, '#e8f1ff');
  for (let x = 8; x < w - 8; x += 6) {
    p.rect(x, 10, 2, h - 10, '#2a2d38');
    p.poly([[x - 1, 10], [x + 1, 4], [x + 3, 10]], '#2a2d38');
  }
  p.rect(6, 20, w - 12, 2, '#2a2d38');
  p.rect(6, h - 14, w - 12, 2, '#2a2d38');
  return p.outline(OUTLINE);
}

export function lantern(): PixelCanvas {
  const p = new PixelCanvas(14, 22);
  p.rect(6, 0, 2, 5, '#3a3d4a');
  p.rect(3, 5, 8, 12, '#4a4f5e');
  p.rect(4, 7, 6, 8, '#ffcf70');
  p.rect(5, 9, 4, 4, '#fff2c0');
  p.rect(2, 17, 10, 2, '#3a3d4a');
  return p.outline(OUTLINE);
}

export function readingTable(w = 70, h = 34): PixelCanvas {
  const p = new PixelCanvas(w, h);
  p.rect(0, 10, w, 5, '#6a5238');
  p.rect(0, 10, w, 1, '#8a6a48');
  p.rect(4, 15, 4, h - 15, '#4a3624');
  p.rect(w - 8, 15, 4, h - 15, '#4a3624');
  p.rect(10, 4, 16, 6, '#8a2f3a');
  p.rect(28, 6, 12, 4, '#2f5a8a');
  p.rect(44, 5, 3, 5, '#c9a15b');
  p.rect(46, 0, 8, 10, '#3a3d4a');
  return p.outline(OUTLINE);
}
