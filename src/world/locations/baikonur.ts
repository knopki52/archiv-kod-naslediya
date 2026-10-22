import { VIEW_H, VIEW_W } from '../../config';
import { COMMS, PAD, PAD_W } from '../../content/epoch3';
import { fbm, mulberry32 } from '../../gfx/Noise';
import { OUTLINE, PAL } from '../../gfx/Palette';
import { PixelCanvas } from '../../gfx/PixelCanvas';
import * as props from '../../gfx/props';

export const PAD_SKY_W = Math.ceil(VIEW_W + (PAD_W - VIEW_W) * 0.4);
export const HORIZON_Y = 188;

export const BUNKER_LAMPS = [{ x: 252, y: 46 }, { x: 290, y: 46 }, { x: 328, y: 46 }] as const;
export const COMMS_RACKS = [90, 150, 210, 380] as const;


export function buildPadSkyBg(): PixelCanvas {
  const p = new PixelCanvas(PAD_SKY_W, HORIZON_Y + 4);
  p.gradientV(0, 0, p.w, p.h, '#5c98d0', '#f4e8c6', 9);
  const r = mulberry32(61);
  for (let i = 0; i < 7; i++) {
    const cx = Math.floor(r() * p.w);
    const cy = 18 + Math.floor(r() * 80);
    p.fillDither(cx - 46, cy, 92, 5, '#00000000', '#ffffff66', 0.45, 8);
    p.ellipse(cx, cy + 2, 30 + Math.floor(r() * 24), 3, '#ffffff55');
  }
  p.blit(props.skyline(p.w, 28, '#cdb27c', 5, 31, 9), 0, p.h - 28);
  return p;
}

function distantFigure(p: PixelCanvas, x: number, baseY: number): void {
  p.rect(x, baseY - 6, 2, 6, '#2a2d38');
  p.px(x, baseY - 7, '#2a2d38');
  p.px(x + 1, baseY - 7, '#2a2d38');
}

export function buildPadBg(): PixelCanvas {
  const p = new PixelCanvas(PAD_W, VIEW_H);
  const r = mulberry32(43);
  p.gradientV(0, HORIZON_Y - 12, PAD_W, VIEW_H - HORIZON_Y + 12, '#e0c48a', '#9c7634', 8);
  for (let y = HORIZON_Y; y < VIEW_H; y++) {
    for (let x = 0; x < PAD_W; x++) {
      const n = fbm(x * 1.6, y * 3, 22, 12);
      if (n > 0.66) p.px(x, y, PAL.baik.steppe);
      else if (n < 0.3) p.px(x, y, PAL.baik.steppeDark);
    }
  }
  p.speckle(r, ['#d9c29a', '#8a6a2c', '#b8924a'], 0.012, 0, HORIZON_Y, PAD_W, VIEW_H - HORIZON_Y);
  for (let i = 0; i < 90; i++) {
    const gx = Math.floor(r() * PAD_W);
    const gy = HORIZON_Y + 6 + Math.floor(r() * (VIEW_H - HORIZON_Y - 10));
    const h = 2 + Math.floor(r() * 3);
    p.line(gx, gy, gx + 1, gy - h, '#8a6a2c');
    p.line(gx + 2, gy, gx + 2, gy - h - 1, '#b8924a');
  }
  for (let x = 0; x < PAD_W; x++) {
    p.rect(x, 226 + Math.round(Math.sin(x / 40) * 2), 1, 2, '#8a6a2c');
    p.rect(x, 232 + Math.round(Math.sin(x / 40) * 2), 1, 2, '#8a6a2c');
  }
  p.rect(120, 162, 70, 26, PAL.baik.concrete);
  p.rect(120, 162, 70, 3, '#b4b6bb');
  p.rect(120, 185, 70, 3, '#5a5d66');
  for (let x = 128; x < 186; x += 14) p.rect(x, 170, 8, 5, '#2a2d38');
  p.rect(236, 170, 40, 18, '#7a7d86');
  p.rect(236, 170, 40, 2, '#a0a2a8');
  const gx = PAD.rocket;
  p.blit(props.gantry(120), gx - 56, PAD.groundY - 120);
  p.blit(props.gantry(120), gx + 26, PAD.groundY - 120);
  p.rect(gx - 30, PAD.groundY - 60, 12, 3, '#6a4a3a');
  p.rect(gx + 18, PAD.groundY - 60, 12, 3, '#6a4a3a');
  p.blit(props.antennaTower(84), 556, PAD.groundY - 84);
  p.blit(props.antennaTower(64), 600, PAD.groundY - 64);
  p.rect(gx - 70, PAD.groundY - 2, 140, 6, '#8d8f94');
  p.rect(gx - 70, PAD.groundY - 2, 140, 1, '#b4b6bb');
  [gx - 46, gx - 40, gx + 40, gx + 52].forEach((x) => distantFigure(p, x, PAD.groundY + 2));
  p.rect(6, 118, 76, 92, '#7d8088');
  p.rect(6, 118, 76, 4, '#a0a2a8');
  p.rect(6, 206, 76, 4, '#4a4d56');
  for (let y = 126; y < 206; y += 16) p.rect(6, y, 76, 1, '#5e6168');
  p.rect(26, 136, 36, 72, '#3a3d4a');
  p.rect(28, 138, 32, 70, '#555a66');
  p.rect(43, 138, 2, 70, '#3a3d4a');
  p.rect(54, 172, 3, 6, '#ffd23f');
  p.rect(41, 126, 6, 5, '#b0302a');
  p.px(43, 127, '#ff8a7a');
  p.rect(8, 132, 14, 8, '#e8e4da');
  for (let i = 0; i < 4; i++) p.rect(10 + i * 3, 135, 2, 1, '#3a3d4a');
  p.blit(props.consoleDesk(64, 36, 14), PAD.ivan - 32, 164);
  p.blit(props.crate(22, 18, 7), PAD.ivan + 50, 190);
  p.blit(props.barrel(16, 22), PAD.ivan - 66, 188);
  for (let x = PAD.ivan - 30; x < PAD.rocket - 40; x++) p.px(x, 206 + Math.round(Math.sin(x / 18) * 2), '#2a2d38');
  return p;
}

export function buildRocket(): PixelCanvas {
  return props.rocket(112);
}


function steelDoor(p: PixelCanvas, cx: number, label: string): void {
  p.rect(cx - 21, 128, 42, 82, '#3a3d4a');
  p.rect(cx - 17, 134, 34, 76, '#5e6370');
  p.rect(cx - 17, 134, 34, 2, '#8a909c');
  p.rect(cx - 1, 134, 2, 76, '#3a3d4a');
  for (let y = 144; y < 206; y += 14) p.rect(cx - 17, y, 34, 1, '#3f4350');
  p.rect(cx + 8, 174, 3, 6, '#ffd23f');
  p.rect(cx - 4, 120, 8, 6, '#2a2d38');
  p.rect(cx - 2, 121, 4, 4, PAL.baik.panelG);
  for (let i = 0; i < label.length; i++) p.rect(cx - 10 + i * 3, 129, 2, 3, '#e8e4da');
}

export function buildBunkerBg(): PixelCanvas {
  const p = new PixelCanvas(VIEW_W, VIEW_H);
  const r = mulberry32(77);
  p.gradientV(0, 0, VIEW_W, 190, '#7e838c', '#5a5f68', 6);
  for (let x = 0; x < VIEW_W; x += 60) {
    p.rect(x, 0, 1, 190, '#464a52');
    for (let y = 14; y < 186; y += 28) p.px(x + 3, y, '#aeb2ba');
  }
  p.speckle(r, ['#6a6e78', '#8e939c'], 0.05, 0, 0, VIEW_W, 190);
  p.rect(0, 0, VIEW_W, 16, '#3f434c');
  p.rect(0, 10, VIEW_W, 2, '#2a2d38');
  p.rect(0, 4, VIEW_W, 3, '#6a5a4a');
  for (let x = 20; x < VIEW_W; x += 90) p.rect(x, 0, 4, 18, '#2a2d38');
  p.rect(64, 36, 150, 80, '#3a3d4a');
  p.rect(67, 39, 144, 74, '#dccfa4');
  for (let x = 67; x < 211; x += 12) p.rect(x, 39, 1, 74, '#c2b488');
  for (let y = 39; y < 113; y += 12) p.rect(67, y, 144, 1, '#c2b488');
  p.line(74, 104, 120, 70, '#2d3f6a');
  p.line(120, 70, 190, 58, '#2d3f6a');
  p.line(80, 52, 150, 96, '#b0302a');
  p.ellipse(150, 96, 5, 5, '#b0302a', false);
  p.ellipse(188, 58, 4, 4, '#2d3f6a', false);
  p.rect(70, 44, 18, 4, '#8a7a50');
  p.rect(236, 34, 108, 24, '#2a2d38');
  p.rect(238, 36, 104, 20, '#14151c');
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 12; i++) {
      const c = r() > 0.8 ? PAL.baik.panelY : PAL.baik.panelG;
      p.rect(241 + i * 8, 40 + row * 8, 4, 4, c);
    }
  }
  p.ellipse(380, 56, 14, 14, '#2a2d38');
  p.ellipse(380, 56, 12, 12, '#e8e4da');
  p.line(380, 56, 380, 47, '#14101f');
  p.line(380, 56, 386, 58, '#14101f');
  p.ellipse(380, 56, 12, 12, '#14101f', false);
  p.blit(props.consoleDesk(64, 36, 21), 396, 154);
  p.blit(props.consoleDesk(64, 36, 22), 232, 156);
  p.blit(props.desk(60, 32), BUNKER_TABLE.x, BUNKER_TABLE.y);
  p.rect(0, 188, VIEW_W, VIEW_H - 188, '#4c505a');
  for (let y = 188; y < VIEW_H; y += 14) {
    p.rect(0, y, VIEW_W, 1, '#363a42');
    for (let x = ((y / 14) % 2) * 24; x < VIEW_W; x += 48) p.rect(x, y, 1, 14, '#363a42');
  }
  for (let y = 188; y < VIEW_H; y++) for (let x = 0; x < VIEW_W; x += 2) if (fbm(x, y * 2, 16, 5) > 0.68) p.px(x, y, '#5a5f6a');
  p.rect(0, 186, VIEW_W, 3, '#6a6f7a');
  steelDoor(p, 38, 'СВЯЗЬ');
  steelDoor(p, 452, 'ПУСК');
  return p;
}

export const BUNKER_TABLE = { x: 322, y: 176 } as const;

export function buildJournal(open: boolean): PixelCanvas {
  const p = new PixelCanvas(22, 10);
  if (open) {
    p.poly([[0, 3], [11, 1], [11, 9], [0, 9]], '#efe6c8');
    p.poly([[21, 3], [11, 1], [11, 9], [21, 9]], '#e4dab8');
    for (let i = 0; i < 4; i++) {
      p.line(2, 4 + i * 1.5, 9, 3 + i * 1.5, '#8a8472');
      p.line(13, 3 + i * 1.5, 19, 4 + i * 1.5, '#8a8472');
    }
    p.line(11, 1, 11, 9, '#8a8472');
  } else {
    p.rect(1, 2, 20, 7, '#3a4a6a');
    p.rect(1, 2, 20, 1, '#5a6a8a');
    p.rect(3, 4, 12, 1, '#c9a23c');
  }
  return p.outline(OUTLINE);
}

export function buildProtocol(): PixelCanvas {
  const p = new PixelCanvas(14, 10);
  p.rect(0, 0, 14, 10, '#f4f1e8');
  p.strokeRect(0, 0, 14, 10, '#c9c4b0');
  p.ellipse(10, 6, 2, 2, '#b0302a', false);
  return p.outline(OUTLINE);
}


function rack(p: PixelCanvas, cx: number, seed: number): void {
  const r = mulberry32(seed);
  const x = cx - 20;
  p.rect(x, 62, 40, 126, '#23262e');
  p.rect(x + 2, 64, 36, 122, '#2f333c');
  for (let row = 0; row < 7; row++) {
    const y = 68 + row * 17;
    p.rect(x + 4, y, 32, 14, '#3a3f4a');
    p.rect(x + 4, y, 32, 1, '#5a606c');
    for (let i = 0; i < 5; i++) {
      const c = r() > 0.75 ? PAL.baik.panelY : r() > 0.2 ? PAL.baik.panelG : '#ff6b8b';
      p.rect(x + 7 + i * 6, y + 4, 3, 3, c);
    }
    p.rect(x + 7, y + 10, 18, 2, '#14151c');
  }
  p.outline(OUTLINE);
}

export function buildCommsBg(): PixelCanvas {
  const p = new PixelCanvas(VIEW_W, VIEW_H);
  const r = mulberry32(95);
  p.gradientV(0, 0, VIEW_W, 190, '#56635f', '#3c4743', 6);
  p.speckle(r, ['#4a5753', '#667570'], 0.05, 0, 0, VIEW_W, 190);
  p.rect(0, 0, VIEW_W, 14, '#2a302e');
  for (let i = 0; i < 4; i++) p.rect(0, 14 + i * 3, VIEW_W, 2, ['#2a2d38', '#6a3a2a', '#3a4a6a', '#5a5a3a'][i]!);
  COMMS_RACKS.forEach((cx, i) => rack(p, cx, 11 + i));
  p.rect(284, 40, 70, 54, '#2a2d38');
  p.gradientV(288, 44, 62, 46, '#7fb0dc', '#f0e2b8', 5);
  p.rect(288, 76, 62, 14, '#c9a15b');
  p.rect(318, 44, 2, 46, '#2a2d38');
  p.blit(props.rocket(40), 330, 50);
  p.blit(props.consoleDesk(96, 40, 17), COMMS.panel - 48, 160);
  p.rect(COMMS.panel - 6, 202, 12, 3, '#3a3d4a');
  p.rect(COMMS.panel - 1, 205, 2, 8, '#2a2d38');
  p.rect(0, 188, VIEW_W, VIEW_H - 188, '#39403c');
  for (let y = 188; y < VIEW_H; y += 14) {
    p.rect(0, y, VIEW_W, 1, '#2a302e');
    for (let x = ((y / 14) % 2) * 22; x < VIEW_W; x += 44) p.rect(x, y, 1, 14, '#2a302e');
  }
  p.rect(0, 186, VIEW_W, 3, '#566660');
  for (let x = 0; x < VIEW_W; x++) p.px(x, 230 + Math.round(Math.sin(x / 24) * 3), '#14151c');
  steelDoor(p, COMMS.door, 'ВЫХОД');
  return p;
}
