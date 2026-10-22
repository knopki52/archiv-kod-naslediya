import { OUTLINE } from './Palette';
import { PixelCanvas } from './PixelCanvas';

export const ICON_SIZE = 16;

const make = (draw: (p: PixelCanvas) => void): PixelCanvas => {
  const p = new PixelCanvas(ICON_SIZE, ICON_SIZE);
  draw(p);
  return p.outline(OUTLINE);
};

const drawers: Record<string, () => PixelCanvas> = {
  ink: () => make((p) => {
    p.poly([[8, 2], [12, 9], [8, 14], [4, 9]], '#14121f');
    p.rect(7, 8, 2, 3, '#3a3a6a');
    p.px(6, 9, '#ffffff');
    p.line(11, 2, 14, 5, '#c9a15b');
    p.line(12, 2, 14, 4, '#e8d3a0');
  }),
  word: () => make((p) => {
    p.rect(2, 3, 12, 8, '#e8f1ff');
    p.poly([[4, 11], [4, 14], [8, 11]], '#e8f1ff');
    p.rect(4, 5, 8, 1, '#5fe3ff');
    p.rect(4, 7, 6, 1, '#5fe3ff');
    p.rect(4, 9, 7, 1, '#8a5cff');
  }),
  steps: () => make((p) => {
    p.ellipse(5, 10, 2, 3, '#bcd0ea');
    p.ellipse(11, 5, 2, 3, '#bcd0ea');
    p.rect(4, 6, 1, 1, '#6d7fa5');
    p.rect(10, 1, 1, 1, '#6d7fa5');
    p.line(2, 14, 14, 14, '#6d7fa5');
  }),
  candle: () => make((p) => {
    p.rect(6, 7, 4, 7, '#f4e9c8');
    p.rect(6, 7, 1, 7, '#c9b88a');
    p.rect(5, 14, 6, 1, '#7a5232');
    p.poly([[8, 2], [10, 5], [8, 7], [6, 5]], '#ffb347');
    p.px(8, 5, '#ffffff');
  }),
  bark: () => make((p) => {
    p.rect(2, 3, 12, 10, '#8a6540');
    for (let y = 4; y < 13; y += 2) p.rect(2, y, 12, 1, '#6d4a2c');
    p.line(5, 6, 10, 9, '#e8d3a0');
    p.line(10, 6, 5, 9, '#e8d3a0');
  }),
  coin: () => make((p) => {
    p.circle(8, 8, 6, '#c8d0da');
    p.circle(8, 8, 4, '#e8f1ff', false);
    p.rect(7, 5, 2, 6, '#8d9bb0');
    p.px(5, 5, '#ffffff');
  }),
  stall: () => make((p) => {
    for (let i = 0; i < 6; i++) p.rect(2 + i * 2, 3, 2, 4, i % 2 ? '#e8f1ff' : '#c04a4a');
    p.rect(3, 7, 10, 6, '#7a5232');
    p.rect(3, 7, 10, 1, '#5a3b25');
    p.line(5, 9, 11, 12, '#14101f');
    p.line(11, 9, 5, 12, '#14101f');
  }),
  bread: () => make((p) => {
    p.ellipse(8, 9, 6, 4, '#c98a4a');
    p.rect(5, 6, 6, 1, '#e8b070');
    p.line(5, 8, 7, 10, '#8a5a2a');
    p.line(8, 8, 10, 10, '#8a5a2a');
  }),
  water: () => make((p) => {
    p.poly([[8, 2], [13, 10], [8, 14], [3, 10]], '#5fa8e8');
    p.rect(6, 9, 2, 3, '#9fd8ff');
    p.px(5, 10, '#ffffff');
  }),
  key: () => make((p) => {
    p.circle(5, 5, 3, '#ffd36b', false);
    p.circle(5, 5, 1, '#14101f');
    p.rect(7, 7, 2, 7, '#ffd36b');
    p.rect(9, 11, 3, 1, '#ffd36b');
    p.rect(9, 13, 2, 1, '#ffd36b');
  }),
  key2: () => make((p) => {
    p.circle(5, 5, 3, '#ffd36b', false);
    p.rect(7, 7, 2, 5, '#ffd36b');
    p.ellipse(11, 12, 4, 2, '#c98a4a');
    p.rect(9, 10, 4, 1, '#e8b070');
  }),
  pencil: () => make((p) => {
    p.poly([[3, 13], [12, 4], [14, 6], [5, 15]], '#ffd36b');
    p.poly([[3, 13], [5, 15], [2, 15]], '#e8d3a0');
    p.px(2, 15, '#2d2d3a');
    p.line(12, 4, 14, 6, '#c9a15b');
    p.line(11, 3, 14, 6, '#c04a4a');
  }),
  pass: () => make((p) => {
    p.rect(2, 3, 12, 10, '#d9d6c8');
    p.rect(2, 3, 12, 2, '#2d3f6a');
    p.rect(3, 6, 4, 5, '#8d8f94');
    p.rect(8, 7, 5, 1, '#444444');
    p.rect(8, 9, 4, 1, '#a00020');
  }),
  boots: () => make((p) => {
    p.rect(3, 3, 4, 8, '#2a2a3a');
    p.rect(3, 10, 7, 3, '#2a2a3a');
    p.rect(9, 5, 4, 6, '#2a2a3a');
    p.rect(9, 10, 6, 3, '#2a2a3a');
    p.px(4, 4, '#ffffff');
    p.px(10, 6, '#ffffff');
  }),
  hatch: () => make((p) => {
    p.circle(8, 8, 6, '#8d8f94');
    p.circle(8, 8, 3, '#3a3d4a');
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      p.px(8 + Math.round(Math.cos(a) * 5), 8 + Math.round(Math.sin(a) * 5), '#ffd23f');
    }
    p.line(5, 5, 11, 11, '#ffffff');
  }),
  panel: () => make((p) => {
    p.rect(2, 3, 12, 10, '#3a3d4a');
    for (let i = 0; i < 3; i++) {
      p.rect(4 + i * 4, 5, 2, 6, '#14101f');
      p.rect(4 + i * 4, 6 + (i % 2) * 3, 2, 2, '#7dffb0');
    }
  }),
  clock: () => make((p) => {
    p.circle(8, 8, 6, '#e8f1ff');
    p.line(8, 8, 8, 4, '#14101f');
    p.line(8, 8, 11, 9, '#14101f');
    p.rect(2, 8, 1, 1, '#a00020');
  }),
  eye: () => make((p) => {
    p.ellipse(8, 8, 6, 3, '#e8f1ff');
    p.circle(8, 8, 2, '#5fe3ff');
    p.px(8, 8, '#14101f');
  }),
  hand: () => make((p) => {
    p.rect(5, 6, 6, 7, '#f0c8a8');
    for (let i = 0; i < 4; i++) p.rect(5 + i * 2, 2 + (i % 2 ? 1 : 0), 1, 5, '#f0c8a8');
    p.rect(3, 8, 2, 3, '#f0c8a8');
  }),
  door: () => make((p) => {
    p.rect(3, 2, 10, 13, '#7a5232');
    p.rect(4, 3, 8, 11, '#5a3b25');
    p.px(10, 9, '#ffd36b');
  }),
  book: () => make((p) => {
    p.rect(2, 3, 12, 10, '#5a4f8a');
    p.rect(3, 4, 5, 8, '#e8f1ff');
    p.rect(8, 4, 5, 8, '#cfd8e6');
    p.px(8, 3, '#ffd36b');
  }),
  lock: () => make((p) => {
    p.rect(3, 7, 10, 7, '#c9a15b');
    p.rect(4, 2, 8, 7, '#8d8f94');
    p.rect(6, 4, 4, 5, '#14101f');
    p.rect(7, 10, 2, 2, '#14101f');
  }),
  talk: () => make((p) => {
    p.rect(2, 3, 12, 8, '#e8f1ff');
    p.poly([[4, 11], [4, 14], [8, 11]], '#e8f1ff');
    p.rect(4, 6, 2, 2, '#14101f');
    p.rect(7, 6, 2, 2, '#14101f');
    p.rect(10, 6, 2, 2, '#14101f');
  }),
};

export const ICON_NAMES = Object.keys(drawers);

const cache = new Map<string, PixelCanvas>();

export function iconBuffer(name: string): PixelCanvas {
  let c = cache.get(name);
  if (!c) {
    c = (drawers[name] ?? drawers['book']!)();
    cache.set(name, c);
  }
  return c;
}

const urls = new Map<string, string>();

export function iconUrl(name: string): string {
  let u = urls.get(name);
  if (!u) {
    u = iconBuffer(name).toDataURL();
    urls.set(name, u);
  }
  return u;
}
