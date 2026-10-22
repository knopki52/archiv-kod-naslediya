import { VIEW_H, VIEW_W } from '../../config';
import { fbm, mulberry32 } from '../../gfx/Noise';
import { PixelCanvas } from '../../gfx/PixelCanvas';
import * as props from '../../gfx/props';

export const SQUARE_W = 960;

export const SQ = {
  house: 220,
  bakery: 650,
  workshop: 840,
  well: 480,
  stall: 330,
  portal: 60,
  baseY: 204,
} as const;

function izbaLeft(doorX: number, w: number): number {
  return doorX - (Math.floor(w * 0.62) + 8);
}

const HOUSES: [number, number, number][] = [
  [SQ.house, 112, 82],
  [SQ.bakery, 122, 86],
  [SQ.workshop, 106, 80],
];
const BACK_X = [60, 300, 440, 590, 760];

export function chimneyPositions(): { x: number; y: number }[] {
  const out = HOUSES.map(([doorX, w, h]) => ({ x: izbaLeft(doorX, w) + w - 18, y: SQ.baseY - h + 6 }));
  for (const x of BACK_X) out.push({ x: x + 40, y: 176 - 40 });
  return out;
}

export function windowPosition(i: 0 | 1 | 2): { x: number; y: number } {
  const [doorX, w, h] = HOUSES[i]!;
  const left = izbaLeft(doorX, w);
  const bodyTop = Math.floor(h * 0.38);
  return { x: left + Math.floor(w * 0.18) + 8, y: SQ.baseY - h + bodyTop + 19 };
}

function shadowOnSnow(p: PixelCanvas, x: number, y: number, w: number): void {
  p.ellipse(x + w / 2, y, w / 2 + 4, 4, '#6d7fa544');
}

export function buildSquareBg(workshopLit = false): PixelCanvas {
  const p = new PixelCanvas(SQUARE_W, VIEW_H);
  const r = mulberry32(31);
  p.gradientV(0, 0, SQUARE_W, 168, '#86a2cc', '#eef4ff', 7);
  for (let i = 0; i < 9; i++) {
    const cx = Math.floor(r() * SQUARE_W);
    const cy = 20 + Math.floor(r() * 70);
    p.fillDither(cx - 40, cy, 80, 7, '#eef4ff', '#ffffff', 0.5, 8);
    p.ellipse(cx, cy + 3, 34 + Math.floor(r() * 20), 6, '#ffffff66');
  }
  p.blit(props.skyline(SQUARE_W, 70, '#b7c8e0', 10, 5, 8), 0, 110);
  p.blit(props.church(84, '#a3b8d4'), 700, 92);
  p.blit(props.church(60, '#aebfd8'), 140, 112);
  p.blit(props.skyline(SQUARE_W, 40, '#9fb4d0', 6, 9, 7), 0, 142);
  for (let x = -10; x < SQUARE_W; x += 26 + Math.floor(r() * 18)) p.blit(props.pine(34 + Math.floor(r() * 14), 40 + x), x, 176 - 40);
  p.gradientV(0, 172, SQUARE_W, VIEW_H - 172, '#e6eefb', '#b4c8e6', 6);
  for (let y = 172; y < VIEW_H; y += 1) {
    for (let x = 0; x < SQUARE_W; x++) {
      const n = fbm(x, y * 1.8, 22, 3);
      if (n > 0.66) p.px(x, y, '#f4f8ff');
      else if (n < 0.3) p.px(x, y, '#b0c4e2');
    }
  }
  p.speckle(r, ['#ffffff', '#9fb4d4'], 0.01, 0, 172, SQUARE_W, VIEW_H - 172);
  for (let x = 0; x < SQUARE_W; x++) {
    const wob = Math.sin(x / 40) * 3;
    p.rect(x, 218 + wob, 1, 22, '#c3d1e8');
    if (x % 3 === 0) p.px(x, 218 + wob + 1, '#a5b8d6');
    if (x % 5 === 0) p.px(x, 237 + wob, '#a5b8d6');
  }
  const back = BACK_X;
  back.forEach((x, i) => p.blit(props.izba(64 + (i % 2) * 14, 50, true), x, 176 - 48));
  const lit = [true, true, workshopLit];
  HOUSES.forEach(([doorX, w, h], i) => {
    const left = izbaLeft(doorX, w);
    shadowOnSnow(p, left, SQ.baseY + 2, w);
    p.blit(props.izba(w, h, lit[i]), left, SQ.baseY - h);
  });
  p.blit(new PixelCanvas(14, 10).ellipse(7, 5, 6, 4, '#c98a4a').rect(3, 2, 8, 1, '#e8b070').outline('#14101f'), SQ.bakery - 7, SQ.baseY - 56);
  shadowOnSnow(p, SQ.well - 17, SQ.baseY + 2, 34);
  p.blit(props.well(), SQ.well - 17, SQ.baseY - 44);
  shadowOnSnow(p, SQ.stall - 30, SQ.baseY + 4, 60);
  p.blit(props.stall(), SQ.stall - 30, SQ.baseY + 4 - 52);
  p.blit(props.fence(60), 130, SQ.baseY - 16);
  p.blit(props.fence(60), 700, SQ.baseY - 16);
  p.blit(props.barrel(), SQ.bakery + 74, SQ.baseY - 22);
  p.blit(props.crate(), SQ.bakery + 92, SQ.baseY - 18);
  p.blit(props.pine(80, 7), 8, SQ.baseY - 78);
  p.blit(props.pine(70, 8), SQUARE_W - 52, SQ.baseY - 68);
  for (const x of [0, 90, 200, 380, 560, 700, 880]) p.blit(props.snowdrift(70 + (x % 3) * 12, 12, x), x, VIEW_H - 12);
  return p;
}

type RoomOpts = { wall: string; floor: string; seed: number };

function room(opts: RoomOpts): PixelCanvas {
  const p = new PixelCanvas(VIEW_W, VIEW_H);
  p.blit(props.woodWall(VIEW_W, 184, opts.wall, opts.seed), 0, 0);
  p.blit(props.plankFloor(VIEW_W, VIEW_H - 184, opts.floor, opts.seed + 1), 0, 184);
  p.rect(0, 182, VIEW_W, 4, '#3a2412');
  p.rect(0, 186, VIEW_W, 1, '#a07848');
  p.fillDither(0, 186, VIEW_W, 10, '#00000040', '#00000000', 0.5, 4);
  p.rect(18, 104, 38, 80, '#3a2412');
  p.rect(21, 107, 32, 77, '#5a3b25');
  p.rect(36, 107, 2, 77, '#3a2412');
  p.rect(48, 148, 3, 4, '#ffd36b');
  p.rect(18, 100, 38, 4, '#241408');
  return p;
}

export function buildHouseBg(): PixelCanvas {
  const p = room({ wall: '#7a5232', floor: '#8a6a44', seed: 3 });
  p.blit(props.windowFrame(30, 32, '#ffd9a0'), 300, 52);
  p.blit(props.houseStove(true), 84, 184 - 62 + 2);
  p.blit(props.bench(44), 170, 184 - 12);
  p.blit(props.bench(44), 380, 184 - 12);
  p.rect(150, 40, 60, 22, '#5a3b25');
  p.rect(154, 28, 8, 12, '#c9b88a');
  p.rect(166, 32, 10, 8, '#8a6540');
  p.blit(new PixelCanvas(80, 30).fillDither(0, 0, 80, 30, '#a04040', '#c05050', 0.4, 4).strokeRect(0, 0, 80, 30, '#601818'), 200, 214);
  return p;
}

export function buildBakeryBg(): PixelCanvas {
  const p = room({ wall: '#7a5a3a', floor: '#8a6a50', seed: 5 });
  p.blit(props.windowFrame(28, 30, '#ffd9a0'), 170, 56);
  p.blit(props.brickOven(true), 380, 184 - 64 + 2);
  p.blit(props.bakeTable(56), 236, 184 - 28);
  p.blit(props.barrel(), 150, 184 - 20);
  for (let i = 0; i < 4; i++) p.blit(new PixelCanvas(12, 8).ellipse(6, 4, 5, 3, '#c98a4a').rect(3, 2, 6, 1, '#e8b070').outline('#14101f'), 250 + i * 14, 40);
  p.rect(238, 48, 62, 3, '#5a3b25');
  return p;
}

export function buildWorkshopBg(): PixelCanvas {
  const p = room({ wall: '#5a4230', floor: '#6a5238', seed: 7 });
  p.blit(props.shelfRolls(44, 64, 4), 90, 184 - 64 + 2);
  p.blit(props.shelfRolls(44, 64, 6), 140, 184 - 64 + 2);
  p.blit(props.windowFrame(24, 26, '#2a3550'), 330, 50);
  p.blit(props.scribeDesk(60, 44), 310, 184 - 42 + 2);
  p.blit(props.barrel(), 440, 184 - 20);
  p.blit(props.barrel(), 456, 184 - 22);
  return p;
}
