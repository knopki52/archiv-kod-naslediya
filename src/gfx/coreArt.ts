import { VIEW_H, VIEW_W } from '../config';
import { mulberry32 } from './Noise';
import { PixelCanvas } from './PixelCanvas';
import * as props from './props';


const W = VIEW_W;
const H = VIEW_H;

export function buildCoreBg(): PixelCanvas {
  const p = new PixelCanvas(W, H);
  p.gradientV(0, 0, W, 196, '#05040a', '#14102a', 8);
  const r = mulberry32(31);
  for (const cx of [30, 100, 380, 450]) {
    p.rect(cx - 4, 20, 8, 176, '#0d0b1e');
    p.rect(cx - 4, 20, 2, 176, '#241d4e');
    p.rect(cx - 7, 18, 14, 4, '#241d4e');
  }
  p.fillDither(0, 0, W, 60, '#05040a', '#000000', 0.5, 8);
  for (let i = 0; i < 70; i++) p.px(Math.floor(r() * W), Math.floor(r() * 180), r() > 0.5 ? '#ffd36b66' : '#5fe3ff55');
  p.blit(props.hallFloor(W, H - 190), 0, 190);
  p.rect(0, 190, W, 2, '#3a2d6a');
  p.ellipse(240, 214, 70, 12, '#fff4cf33');
  p.ellipse(240, 214, 44, 7, '#fff4cf44');
  return p;
}

export function buildColumn(): PixelCanvas {
  const p = new PixelCanvas(40, 190);
  for (let y = 0; y < 190; y++) {
    const a = Math.round(40 + (y / 190) * 90);
    const hex = a.toString(16).padStart(2, '0');
    p.rect(8, y, 24, 1, `#fff4cf${hex}`);
    p.rect(14, y, 12, 1, `#ffffff${hex}`);
    p.px(7, y, '#ffd36b88');
    p.px(32, y, '#ffd36b88');
  }
  return p;
}

export function buildMemoryPage(): PixelCanvas {
  const p = new PixelCanvas(10, 13);
  p.rect(0, 0, 10, 13, '#f4efe0');
  p.rect(0, 0, 10, 2, '#ffd36b');
  for (const y of [4, 6, 8, 10]) p.rect(1, y, y === 10 ? 5 : 8, 1, '#8a7f66');
  return p.outline('#2a2150');
}


export function memoryServers(): PixelCanvas {
  const p = new PixelCanvas(W, H).gradientV(0, 0, W, H, '#07101f', '#0b1c33', 6);
  const r = mulberry32(5);
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 78;
    p.rect(x, 50, 58, 170, '#0f2038');
    p.strokeRect(x, 50, 58, 170, '#1d3a5e');
    for (let row = 0; row < 14; row++) {
      p.rect(x + 5, 58 + row * 12, 48, 8, '#12294a');
      for (let k = 0; k < 6; k++) p.px(x + 8 + k * 7, 61 + row * 12, r() > 0.6 ? '#5fe3ff' : '#1d6a8a');
    }
  }
  p.circle(240, 120, 6, '#ffffff');
  p.circle(240, 120, 12, '#ffffff44');
  p.line(240, 120, 150, 40, '#5fe3ff');
  p.line(241, 120, 151, 40, '#5fe3ff88');
  p.line(240, 120, 330, 40, '#ffd36b');
  p.line(241, 120, 331, 40, '#ffd36b88');
  p.rect(0, 220, W, 50, '#050a14');
  return p;
}

export function memoryPurge(): PixelCanvas {
  const p = new PixelCanvas(W, H).gradientV(0, 0, W, H, '#1a1438', '#2d2358', 6);
  const r = mulberry32(8);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * 230);
    const cut = x + y * 0.6 > 330;
    p.rect(x, y, 10, 13, cut ? '#ffffff22' : '#f4efe0');
    if (!cut) for (const k of [3, 6, 9]) p.rect(x + 1, y + k, 7, 1, '#8a7f66');
  }
  p.poly([[300, 0], [W, 0], [W, H], [140, H]], '#ffffff55');
  p.poly([[340, 0], [W, 0], [W, H], [220, H]], '#ffffffaa');
  return p;
}

export function memorySplit(): PixelCanvas {
  const p = new PixelCanvas(W, H).rect(0, 0, W, H, '#05040a');
  p.rect(0, 0, 238, H, '#2a1d00');
  p.rect(242, 0, 238, H, '#1a0f3a');
  for (let y = 0; y < H; y++) {
    const off = Math.round(Math.sin(y * 0.12) * 4);
    p.rect(216 + off - 12, y, 24, 1, '#ffd36b');
    p.rect(244 + off + 6, y, 24, 1, '#8a5cff');
    p.px(240 + off, y, '#ffffff');
  }
  return p;
}


export function endKeeperBg(): PixelCanvas {
  const p = new PixelCanvas(W, H).gradientV(0, 0, W, 196, '#e4ebf3', '#b9c6d6', 6);
  for (const cx of [20, 130, 240, 350, 460]) {
    p.rect(cx - 6, 0, 12, 196, '#a9b6c8');
    p.rect(cx - 6, 0, 3, 196, '#d4dde8');
  }
  p.rect(0, 190, W, H - 190, '#8996aa');
  for (let i = 0; i < 6; i++) p.rect(0, 196 + i * i * 2, W, 1, '#a0adc0');
  p.fillDither(0, 0, W, 40, '#e4ebf3', '#ffffff', 0.4, 8);
  return p;
}

export function endEditorBg(): PixelCanvas {
  const p = new PixelCanvas(W, H).gradientV(0, 0, W, 190, '#ffffff', '#f4f1e8', 4);
  p.rect(0, 190, W, H - 190, '#f0ede4');
  p.rect(0, 190, W, 1, '#e0dccf');
  for (let i = 0; i < 5; i++) p.rect(0, 200 + i * 14, W, 1, '#e6e2d6');
  return p;
}

export function mergeBook(): PixelCanvas {
  const p = new PixelCanvas(40, 30);
  p.poly([[2, 14], [20, 8], [20, 26], [2, 26]], '#fff4cf');
  p.poly([[38, 14], [20, 8], [20, 26], [38, 26]], '#f4e4b0');
  p.line(20, 8, 20, 26, '#b8892a');
  for (let i = 0; i < 4; i++) {
    p.line(5, 15 + i * 3, 17, 12 + i * 3, '#b8892a');
    p.line(23, 12 + i * 3, 35, 15 + i * 3, '#b8892a');
  }
  p.rect(1, 26, 38, 3, '#8a6a2c');
  return p.outline('#2a2150');
}


const SW = 320;
const SH = 180;

export function slideBirch(): PixelCanvas {
  const p = new PixelCanvas(SW, SH).gradientV(0, 0, SW, SH, '#2a2018', '#4a3622', 5);
  const r = mulberry32(2);
  p.poly([[40, 24], [282, 18], [290, 156], [34, 162]], '#c9a063');
  p.speckle(r, ['#b08a50', '#d9b87a', '#8a6a3c'], 0.12, 34, 18, 256, 144);
  for (let i = 0; i < 6; i++) p.line(52, 40 + i * 20, 268, 36 + i * 20 + (i % 2), '#8a6a3c88');
  p.ellipse(170, 96, 22, 11, '#3a2a1a');
  p.line(150, 100, 144, 120, '#3a2a1a');
  p.line(190, 100, 198, 122, '#3a2a1a');
  p.circle(204, 80, 8, '#3a2a1a');
  p.line(170, 90, 176, 62, '#3a2a1a');
  p.circle(177, 56, 6, '#3a2a1a');
  p.line(180, 66, 214, 54, '#3a2a1a');
  return p;
}

export function slideBirchSmile(): PixelCanvas {
  const p = slideBirch();
  p.px(205, 78, '#f0e0b8');
  p.px(209, 78, '#f0e0b8');
  p.line(204, 83, 206, 85, '#f0e0b8');
  p.line(206, 85, 210, 85, '#f0e0b8');
  p.line(210, 85, 212, 83, '#f0e0b8');
  return p;
}

export function slideMetronome(): PixelCanvas {
  const p = new PixelCanvas(SW, SH).gradientV(0, 0, SW, SH, '#10151f', '#2a3547', 5);
  p.rect(60, 30, 200, 120, '#1a222f');
  p.strokeRect(60, 30, 200, 120, '#3b4a62');
  p.line(160, 30, 160, 150, '#3b4a62');
  p.line(60, 90, 260, 90, '#3b4a62');
  const m = props.metronome();
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const c = m.get(x, y);
      if (c >>> 24 === 0) continue;
      p.rect(136 + x * 2, 70 + y * 2, 2, 2, c);
    }
  }
  p.rect(0, 150, SW, 30, '#080c12');
  return p;
}

export function slideVostok(): PixelCanvas {
  const p = new PixelCanvas(SW, SH).gradientV(0, 0, SW, 140, '#6fa8d8', '#f2e6c4', 6);
  p.rect(0, 140, SW, 40, '#8a7a56');
  p.fillDither(0, 140, SW, 14, '#8a7a56', '#b8a77a', 0.5, 4);
  const rk = props.rocket(96);
  for (let y = 0; y < rk.h; y++) {
    for (let x = 0; x < rk.w; x++) {
      const c = rk.get(x, y);
      if (c >>> 24 === 0) continue;
      p.rect(140 + x * 1, 46 + y, 1, 1, c);
    }
  }
  p.poly([[158, 142], [176, 142], [182, 170], [152, 170]], '#ffffffaa');
  return p;
}
