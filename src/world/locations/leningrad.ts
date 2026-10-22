import { VIEW_H, VIEW_W } from '../../config';
import { fbm, mulberry32 } from '../../gfx/Noise';
import { PixelCanvas } from '../../gfx/PixelCanvas';
import * as props from '../../gfx/props';

export const YARD_W = 640;

export const HALL_WINDOWS = [{ x: 168, y: 78 }, { x: 304, y: 78 }, { x: 410, y: 78 }] as const;

function plaster(p: PixelCanvas, x: number, y: number, w: number, h: number, seed: number): void {
  const r = mulberry32(seed);
  p.gradientV(x, y, w, h, '#2f3b50', '#1d2636', 6);
  for (let i = 0; i < 40; i++) {
    const sx = x + Math.floor(r() * w);
    const sy = y + Math.floor(r() * h);
    p.rect(sx, sy, 4 + Math.floor(r() * 18), 2 + Math.floor(r() * 5), r() > 0.5 ? '#26324a' : '#394861');
  }
  for (let i = 0; i < 400; i++) p.px(x + Math.floor(r() * w), y + Math.floor(r() * h), r() > 0.5 ? '#3d4c66' : '#1a2232');
}

export function buildReadingHallBg(): PixelCanvas {
  const p = new PixelCanvas(VIEW_W, VIEW_H);
  plaster(p, 0, 0, VIEW_W, 188, 2);
  p.fillDither(0, 0, VIEW_W, 36, '#10151f', '#000000', 0.5, 8);
  [14, 60, 206, 252, 356, 440].forEach((x, i) => p.blit(props.bookshelf(42, 110, 40 + i), x, 188 - 110));
  HALL_WINDOWS.forEach((w, i) => {
    p.blit(props.frostWindow(34, 74, i === 2), w.x - 17, 40);
    for (let k = 0; k < 4; k++) p.fillDither(w.x - 17 + k * 6, 112 + k * 4, 30, 76 - k * 4, '#00000000', '#9bb4d633', 0.35, 4);
  });
  p.blit(props.radioPlate(), 236, 52);
  p.rect(0, 188, VIEW_W, VIEW_H - 188, '#262f40');
  for (let y = 188; y < VIEW_H; y += 14) {
    p.rect(0, y, VIEW_W, 1, '#1a2130');
    for (let x = ((y / 14) % 2) * 20; x < VIEW_W; x += 40) p.rect(x, y, 1, 14, '#1a2130');
  }
  for (let y = 188; y < VIEW_H; y++) for (let x = 0; x < VIEW_W; x += 2) if (fbm(x, y * 2, 18, 4) > 0.66) p.px(x, y, '#2f3a50');
  p.rect(0, 186, VIEW_W, 3, '#3b465c');
  p.rect(98, 24, 4, 112, '#2a2d38');
  p.blit(props.stove(true), 90 - 14, 188 - 40 + 6);
  p.blit(props.readingTable(70, 34), 252, 188 - 30);
  p.blit(props.bench(44), 322, 188 - 12);
  p.blit(props.lamp(false), 330, 188 - 32);
  return p;
}

export function buildYardBg(): PixelCanvas {
  const p = new PixelCanvas(YARD_W, VIEW_H);
  const r = mulberry32(55);
  p.gradientV(0, 0, YARD_W, 140, '#1c2638', '#8a97ab', 7);
  p.blit(props.skyline(YARD_W, 60, '#3a4658', 12, 15, 10), 0, 90);
  p.blit(props.brickWall(YARD_W, 150, '#5a4640', 9), 0, 44);
  p.rect(0, 44, YARD_W, 4, '#2a2d38');
  for (let x = 90; x < YARD_W - 40; x += 120) {
    p.blit(props.frostWindow(30, 56, true), x, 70);
    p.rect(x - 4, 66, 38, 4, '#6a5a52');
  }
  p.rect(26, 112, 36, 78, '#2a1e1a');
  p.rect(29, 115, 30, 75, '#4a3830');
  p.rect(44, 115, 2, 75, '#2a1e1a');
  p.rect(26, 108, 36, 5, '#8d8f94');
  p.gradientV(0, 186, YARD_W, VIEW_H - 186, '#7f8ea6', '#3f4b60', 6);
  for (let y = 186; y < VIEW_H; y++) {
    for (let x = 0; x < YARD_W; x++) {
      const n = fbm(x, y * 1.7, 20, 8);
      if (n > 0.64) p.px(x, y, '#aab8ce');
      else if (n < 0.3) p.px(x, y, '#56637a');
    }
  }
  p.speckle(r, ['#c9d6ea', '#6f7e96'], 0.012, 0, 186, YARD_W, VIEW_H - 186);
  for (let x = 0; x < YARD_W; x++) p.rect(x, 214 + Math.round(Math.sin(x / 36) * 3), 1, 20, '#5d6a80');
  p.blit(props.gate(64, 70), 560, 188 - 66);
  p.blit(props.logsPile(30, 20), 330, 190);
  p.blit(props.logsPile(30, 20), 360, 196);
  p.blit(props.chopBlock(), 410, 188);
  p.blit(props.lamp(false), 240, 188 - 30);
  for (const x of [0, 120, 260, 480, 590]) p.blit(props.snowdrift(80 + (x % 3) * 12, 14, x + 3), x, VIEW_H - 14);
  return p;
}

export function buildCellarBg(): PixelCanvas {
  const p = new PixelCanvas(VIEW_W, VIEW_H);
  p.blit(props.brickWall(VIEW_W, 190, '#4a3a3a', 17), 0, 0);
  p.fillDither(0, 0, VIEW_W, 190, '#00000000', '#000000', 0.38, 8);
  for (let i = 0; i < 5; i++) {
    const cx = 40 + i * 100;
    p.ellipse(cx, 60, 56, 50, '#2a2024', false);
    p.ellipse(cx, 62, 55, 49, '#1c1518', false);
  }
  p.rect(0, 190, VIEW_W, VIEW_H - 190, '#2b2630');
  for (let y = 190; y < VIEW_H; y += 12) {
    p.rect(0, y, VIEW_W, 1, '#1a161e');
    for (let x = ((y / 12) % 2) * 18; x < VIEW_W; x += 36) p.rect(x, y, 1, 12, '#1a161e');
  }
  p.rect(0, 188, VIEW_W, 3, '#3a3238');
  for (let i = 0; i < 6; i++) p.rect(8 + i * 8, 130 + i * 10, 40 - i * 4, 10, i % 2 ? '#3a3238' : '#4a4048');
  p.rect(0, 100, 60, 4, '#6a5a50');
  p.blit(props.lantern(), 233, 30);
  p.rect(239, 0, 2, 32, '#3a3d4a');
  const r = mulberry32(8);
  for (let i = 0; i < 40; i++) p.rect(Math.floor(r() * VIEW_W), Math.floor(r() * 180), 1, 8 + Math.floor(r() * 18), '#3a4a5a55');
  return p;
}
