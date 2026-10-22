import type { Game } from '../../core/Game';
import { el } from '../Ui';
import { mulberry, openMinigame, type MinigameResult } from './common';

const COLS = 3;
const ROWS = 2;
const IMG_W = 360;
const IMG_H = 240;

function drawRider(): string {
  const c = document.createElement('canvas');
  c.width = IMG_W;
  c.height = IMG_H;
  const g = c.getContext('2d')!;
  const rand = mulberry(77);
  g.fillStyle = '#b48a5a';
  g.fillRect(0, 0, IMG_W, IMG_H);
  for (let y = 0; y < IMG_H; y += 3) {
    g.fillStyle = rand() > 0.5 ? '#a47a4c' : '#c29a68';
    g.fillRect(0, y, IMG_W, 1 + Math.floor(rand() * 2));
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = ['#8a6338', '#d9bc8a', '#6e4a28'][Math.floor(rand() * 3)]!;
    g.fillRect(rand() * IMG_W, rand() * IMG_H, 2, 1);
  }
  g.strokeStyle = '#3a2410';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const path = (pts: [number, number][]) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  path([[90, 150], [100, 120], [180, 112], [240, 118], [260, 140]]);
  path([[90, 150], [96, 190], [110, 196]]);
  path([[130, 150], [132, 200], [144, 204]]);
  path([[220, 140], [226, 196], [240, 200]]);
  path([[250, 140], [262, 190], [276, 192]]);
  path([[240, 118], [262, 92], [280, 96], [286, 112], [270, 118]]);
  path([[100, 120], [76, 112], [64, 130]]);
  path([[170, 112], [172, 70], [186, 66], [190, 112]]);
  g.beginPath();
  g.arc(180, 52, 12, 0, Math.PI * 2);
  g.stroke();
  path([[190, 78], [220, 60], [250, 40]]);
  path([[250, 20], [250, 70]]);
  path([[172, 112], [160, 150], [150, 160]]);
  g.beginPath();
  g.arc(60, 44, 16, 0, Math.PI * 2);
  g.stroke();
  return c.toDataURL();
}

function jaggedClip(rand: () => number, col: number, row: number): string {
  const j = () => (rand() * 6).toFixed(1);
  const pts: string[] = [];
  const top = row > 0;
  const bottom = row < ROWS - 1;
  const left = col > 0;
  const right = col < COLS - 1;
  pts.push(`${left ? j() : 0}% ${top ? j() : 0}%`);
  for (let i = 1; i < 4; i++) pts.push(`${i * 25}% ${top ? j() : 0}%`);
  pts.push(`${right ? 100 - Number(j()) : 100}% ${top ? j() : 0}%`);
  for (let i = 1; i < 3; i++) pts.push(`${right ? 100 - Number(j()) : 100}% ${i * 33}%`);
  pts.push(`${right ? 100 - Number(j()) : 100}% ${bottom ? 100 - Number(j()) : 100}%`);
  for (let i = 3; i > 0; i--) pts.push(`${i * 25}% ${bottom ? 100 - Number(j()) : 100}%`);
  pts.push(`${left ? j() : 0}% ${bottom ? 100 - Number(j()) : 100}%`);
  for (let i = 2; i > 0; i--) pts.push(`${left ? j() : 0}% ${i * 33}%`);
  return `polygon(${pts.join(',')})`;
}

export async function runBirchBark(game: Game): Promise<MinigameResult> {
  const f = openMinigame(game, 'birch', 'Склей берёсту');
  const area = el('div', 'birch-area', f.root);
  const board = el('div', 'birch-board panel', area);
  const img = drawRider();
  const rand = mulberry(2024);

  const pieces: { node: HTMLElement; col: number; row: number; placed: boolean }[] = [];
  let placed = 0;
  let lastAction = performance.now();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const slot = el('div', 'birch-slot', board);
      slot.style.left = `${(c / COLS) * 100}%`;
      slot.style.top = `${(r / ROWS) * 100}%`;
      slot.style.width = `${100 / COLS}%`;
      slot.style.height = `${100 / ROWS}%`;
    }
  }

  const shuffled = Array.from({ length: COLS * ROWS }, (_, i) => i).sort(() => rand() - 0.5);
  shuffled.forEach((idx, n) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const node = el('div', 'birch-piece', area);
    node.style.backgroundImage = `url(${img})`;
    node.style.backgroundSize = `${COLS * 100}% ${ROWS * 100}%`;
    node.style.backgroundPosition = `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
    node.style.clipPath = jaggedClip(rand, col, row);
    node.dataset.col = String(col);
    node.dataset.row = String(row);
    node.style.left = `${1 + (n % 3) * 16.5}%`;
    node.style.top = `${6 + Math.floor(n / 3) * 48}%`;
    node.style.setProperty('--rot', `${Math.round((rand() - 0.5) * 50)}deg`);
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', 'Обрывок бересты');
    const p = { node, col, row, placed: false };
    pieces.push(p);

    let drag: { dx: number; dy: number } | null = null;
    node.addEventListener('pointerdown', (e) => {
      if (p.placed) return;
      const r0 = node.getBoundingClientRect();
      drag = { dx: e.clientX - r0.left, dy: e.clientY - r0.top };
      node.setPointerCapture(e.pointerId);
      node.classList.add('drag');
      node.style.zIndex = '10';
      lastAction = performance.now();
    });
    node.addEventListener('pointermove', (e) => {
      if (!drag || p.placed) return;
      const a = area.getBoundingClientRect();
      node.style.left = `${((e.clientX - drag.dx - a.left) / a.width) * 100}%`;
      node.style.top = `${((e.clientY - drag.dy - a.top) / a.height) * 100}%`;
    });
    node.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = null;
      node.classList.remove('drag');
      lastAction = performance.now();
      const a = area.getBoundingClientRect();
      const b = board.getBoundingClientRect();
      const cell = { w: b.width / COLS, h: b.height / ROWS };
      const target = { x: b.left + col * cell.w, y: b.top + row * cell.h };
      const r1 = node.getBoundingClientRect();
      const cx = r1.left + r1.width / 2;
      const cy = r1.top + r1.height / 2;
      const tx = target.x + cell.w / 2;
      const ty = target.y + cell.h / 2;
      if (Math.hypot(cx - tx, cy - ty) < Math.min(cell.w, cell.h) * 0.45) {
        p.placed = true;
        placed++;
        node.classList.add('placed');
        node.style.setProperty('--rot', '0deg');
        node.style.left = `${((target.x - a.left) / a.width) * 100}%`;
        node.style.top = `${((target.y - a.top) / a.height) * 100}%`;
        node.style.width = `${(cell.w / a.width) * 100}%`;
        node.style.height = `${(cell.h / a.height) * 100}%`;
        node.style.zIndex = '2';
        game.audioHook?.('snap');
        if (placed === pieces.length) {
          board.classList.add('done');
          window.setTimeout(() => f.finish(1), 1100 / game.timeScale);
        }
      } else node.style.zIndex = '5';
    });
  });

  const hintTimer = window.setInterval(() => {
    if (f.modal.closed) {
      window.clearInterval(hintTimer);
      return;
    }
    if (performance.now() - lastAction > 20000 / game.timeScale) {
      f.hint('Начни с рамки по краям.');
      lastAction = performance.now();
    }
  }, 1000);
  f.modal.promise.finally(() => window.clearInterval(hintTimer));
  return f.modal.promise;
}
