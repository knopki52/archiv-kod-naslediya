import type { ByteForm } from '../content/types';
import { OUTLINE } from './Palette';
import { PixelCanvas } from './PixelCanvas';

export const BYTE_FRAME = 24;
export const BYTE_FORMS: ByteForm[] = ['drone', 'raven', 'collar', 'kestrel'];
export const BYTE_FRAMES = 2;

const EYE = '#5fe3ff';

function glowEye(p: PixelCanvas, x: number, y: number): void {
  p.rect(x - 1, y - 1, 4, 4, '#5fe3ff33');
  p.rect(x, y, 2, 2, EYE);
  p.px(x, y, '#ffffff');
}

function drone(frame: 0 | 1): PixelCanvas {
  const p = new PixelCanvas(BYTE_FRAME, BYTE_FRAME);
  p.line(8, 10, 5, 7, '#8d9bb0');
  p.line(16, 10, 19, 7, '#8d9bb0');
  if (frame === 0) {
    p.rect(1, 6, 8, 1, '#ffffffaa');
    p.rect(15, 6, 8, 1, '#ffffffaa');
  } else {
    p.rect(3, 6, 4, 1, '#ffffff88');
    p.rect(17, 6, 4, 1, '#ffffff88');
  }
  p.line(12, 8, 12, 5, '#8d9bb0');
  p.px(12, 4, frame ? '#ffd36b' : '#ff6b8b');
  p.circle(12, 13, 6, '#cfd8e6');
  p.rect(7, 15, 11, 3, '#8d9bb0');
  p.rect(7, 13, 11, 1, '#3a4258');
  p.rect(9, 9, 5, 1, '#ffffff');
  p.rect(14, 10, 4, 5, '#0b0814');
  glowEye(p, 15, 11);
  p.px(12, 20, frame ? EYE : '#2a8aa8');
  p.px(11, 21, '#5fe3ff55');
  p.px(13, 21, '#5fe3ff55');
  return p.outline(OUTLINE);
}

function raven(frame: 0 | 1): PixelCanvas {
  const p = new PixelCanvas(BYTE_FRAME, BYTE_FRAME);
  p.poly([[6, 14], [0, 16], [1, 12]], '#14121f');
  if (frame === 0) p.poly([[9, 12], [4, 3], [14, 9]], '#26233a');
  else p.poly([[9, 13], [3, 19], [14, 16]], '#26233a');
  p.ellipse(11, 14, 6, 4, '#1c1a2e');
  p.rect(8, 11, 6, 1, '#3a3a6a');
  p.circle(17, 11, 3, '#1c1a2e');
  p.poly([[19, 11], [23, 12], [19, 13]], '#8d8f94');
  glowEye(p, 16, 9);
  p.px(10, 19, '#8d8f94');
  p.px(13, 19, '#8d8f94');
  return p.outline(OUTLINE);
}

function collar(frame: 0 | 1): PixelCanvas {
  const p = new PixelCanvas(BYTE_FRAME, BYTE_FRAME);
  p.poly(frame ? [[5, 15], [2, 21], [7, 19]] : [[5, 15], [1, 20], [6, 19]], '#9aa4b4');
  p.ellipse(12, 14, 9, 5, '#9aa4b4');
  for (let x = 4; x < 21; x += 2) p.line(x, 10 + (x % 4 ? 0 : 1), x + 1, 18, '#7c8798');
  p.rect(5, 10, 14, 1, '#c8d0dc');
  p.rect(14, 11, 5, 5, '#2a303c');
  glowEye(p, 15, 12);
  p.px(7, 19, '#7c8798');
  return p.outline(OUTLINE);
}

function kestrel(frame: 0 | 1): PixelCanvas {
  const p = new PixelCanvas(BYTE_FRAME, BYTE_FRAME);
  p.poly([[6, 14], [0, 18], [0, 14]], '#a0562a');
  p.px(2, 15, '#14101f');
  p.px(3, 16, '#14101f');
  if (frame === 0) p.poly([[9, 12], [2, 2], [14, 10]], '#b0602c');
  else p.poly([[9, 13], [1, 20], [14, 16]], '#b0602c');
  p.ellipse(11, 14, 6, 3, '#b0602c');
  p.rect(9, 15, 6, 2, '#e8c8a0');
  p.px(8, 13, '#4a2a14');
  p.px(11, 12, '#4a2a14');
  p.px(12, 14, '#4a2a14');
  p.circle(17, 11, 3, '#8a8a92');
  p.rect(16, 13, 2, 2, '#4a2a14');
  p.poly([[19, 11], [22, 12], [20, 14]], '#e8d070');
  glowEye(p, 16, 9);
  return p.outline(OUTLINE);
}

export function drawByte(form: ByteForm, frame: 0 | 1): PixelCanvas {
  switch (form) {
    case 'raven': return raven(frame);
    case 'collar': return collar(frame);
    case 'kestrel': return kestrel(frame);
    default: return drone(frame);
  }
}
