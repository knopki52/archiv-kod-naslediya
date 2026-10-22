import type { Game } from '../../core/Game';
import { el } from '../Ui';
import { openMinigame, type MinigameResult } from './common';

const W = 640;
const H = 360;
export const PENCIL_TEXT =
  '22 декабря. Холодно. Хлеба 125 граммов, делю на три раза. Тётя Маша читала вслух. Пишу карандашом, чернила замёрзли. Завтра будет завтра.';
const WIN_COVERAGE = 0.92;
const BRUSH = 26;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function runPencilReveal(game: Game): Promise<MinigameResult> {
  const f = openMinigame(game, 'pencil', 'Проявите настоящие страницы');
  try {
    await document.fonts.load('bold 34px Caveat', PENCIL_TEXT);
  } catch {
      void 0;
  }
  const frame = el('div', 'pencil-frame panel', f.root);
  const view = el('canvas', 'pencil-canvas', frame);
  view.width = W;
  view.height = H;
  const vctx = view.getContext('2d')!;
  view.style.touchAction = 'none';

  const textCv = document.createElement('canvas');
  textCv.width = W;
  textCv.height = H;
  const tctx = textCv.getContext('2d')!;
  tctx.font = 'bold 34px Caveat, cursive';
  tctx.fillStyle = '#2a2a38';
  tctx.textBaseline = 'middle';
  const lines = wrap(tctx, PENCIL_TEXT, W - 90);
  const lh = 44;
  const y0 = (H - lines.length * lh) / 2 + lh / 2;
  lines.forEach((l, i) => tctx.fillText(l, 45, y0 + i * lh));

  const reveal = document.createElement('canvas');
  reveal.width = W;
  reveal.height = H;
  const rctx = reveal.getContext('2d')!;
  rctx.lineCap = 'round';
  rctx.lineJoin = 'round';
  rctx.strokeStyle = 'rgba(0,0,0,0.42)';
  rctx.lineWidth = BRUSH;

  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const mctx = tmp.getContext('2d')!;

  const textData = tctx.getImageData(0, 0, W, H).data;
  const samples: number[] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (textData[(y * W + x) * 4 + 3]! > 128) samples.push((y * W + x) * 4 + 3);

  const paper = (() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = '#cfc8b0';
    g.fillRect(0, 0, W, H);
    let a = 7;
    for (let i = 0; i < 2500; i++) {
      a = (a * 1664525 + 1013904223) >>> 0;
      g.fillStyle = a % 3 ? '#b9b197' : '#ddd6bd';
      g.fillRect(a % W, (a >>> 10) % H, 2, 1);
    }
    return c;
  })();

  const render = () => {
    vctx.clearRect(0, 0, W, H);
    vctx.drawImage(paper, 0, 0);
    vctx.globalAlpha = 0.07;
    vctx.drawImage(textCv, 0, 0);
    vctx.globalAlpha = 1;
    mctx.clearRect(0, 0, W, H);
    mctx.globalCompositeOperation = 'source-over';
    mctx.drawImage(textCv, 0, 0);
    mctx.globalCompositeOperation = 'destination-in';
    mctx.drawImage(reveal, 0, 0);
    vctx.drawImage(tmp, 0, 0);
  };
  render();

  let last: { x: number; y: number } | null = null;
  let finished = false;
  let drawing = false;
  const pos = (e: PointerEvent) => {
    const r = view.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    rctx.beginPath();
    rctx.moveTo(a.x, a.y);
    rctx.lineTo(b.x + 0.01, b.y);
    rctx.stroke();
    render();
  };
  view.addEventListener('pointerdown', (e) => {
    drawing = true;
    view.setPointerCapture(e.pointerId);
    last = pos(e);
    stroke(last, last);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drawing || !last) return;
    const p = pos(e);
    stroke(last, p);
    last = p;
  });
  const up = () => {
    drawing = false;
    last = null;
  };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);

  const key = { x: W / 2, y: H / 2 };
  frame.tabIndex = 0;
  frame.addEventListener('keydown', (e) => {
    const step = 14;
    const prev = { ...key };
    if (e.code === 'ArrowLeft') key.x = Math.max(0, key.x - step);
    else if (e.code === 'ArrowRight') key.x = Math.min(W, key.x + step);
    else if (e.code === 'ArrowUp') key.y = Math.max(0, key.y - step);
    else if (e.code === 'ArrowDown') key.y = Math.min(H, key.y + step);
    else return;
    e.preventDefault();
    stroke(prev, key);
  });

  const coverage = (): number => {
    const d = rctx.getImageData(0, 0, W, H).data;
    let ok = 0;
    for (const idx of samples) if (d[idx]! >= 100) ok++;
    return samples.length ? ok / samples.length : 1;
  };

  const timer = window.setInterval(() => {
    if (f.modal.closed || finished) return;
    const c = coverage();
    if (c >= WIN_COVERAGE) {
      finished = true;
      window.clearInterval(timer);
      rctx.fillStyle = '#000';
      rctx.fillRect(0, 0, W, H);
      render();
      view.classList.add('done');
      window.setTimeout(() => f.finish(1), 1000 / game.timeScale);
    }
  }, 300);
  f.modal.promise.finally(() => window.clearInterval(timer));
  (view as HTMLElement & { __solve?: () => void }).__solve = () => {
    rctx.fillStyle = '#000';
    rctx.fillRect(0, 0, W, H);
    render();
  };
  el('div', 'pencil-note', f.root, 'Води грифелем по листу — буквы проступят сами.');
  return f.modal.promise;
}
