import type { Game } from '../../core/Game';
import { el } from '../Ui';
import { panelModuleUrl, panelTileUrl } from '../uiArt';
import { mulberry, openMinigame, type MinigameResult } from './common';

export const PANEL_ORDER = ['Питание', 'Передатчик', 'Антенна', 'Приёмник', 'Запись'] as const;
const MAX_TRIES = 3;
const SVG_NS = 'http://www.w3.org/2000/svg';

export function isPanelSolved(wires: Map<string, string>): boolean {
  const next = new Map(wires);
  let cur: string | undefined = PANEL_ORDER[0];
  for (let i = 1; i < PANEL_ORDER.length; i++) {
    const n: string | undefined = cur ? next.get(cur) : undefined;
    if (n !== PANEL_ORDER[i]) return false;
    cur = n;
  }
  return next.size === PANEL_ORDER.length - 1;
}

export async function runControlPanel(game: Game): Promise<MinigameResult> {
  const f = openMinigame(game, 'panel', 'Пересобери пульт');
  const panel = el('div', 'cp-panel panel', f.root);
  panel.style.setProperty('--cp-tile', `url(${panelTileUrl()})`);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cp-wires');
  const row = el('div', 'cp-row', panel);
  panel.appendChild(svg);
  const status = el('div', 'cp-status', f.root, 'Порядок: Питание → Передатчик → Антенна → Приёмник → Запись. Тяни провод от ПРАВОГО кружка к ЛЕВОМУ. Клик по проводу убирает его.');
  const fire = el('button', 'btn cp-fire', f.root, 'Подать ток');
  fire.type = 'button';

  const rand = mulberry(Date.now() & 0xffff);
  let order: string[];
  do order = [...PANEL_ORDER].sort(() => rand() - 0.5);
  while (order.every((n, i) => n === PANEL_ORDER[i]));

  const wires = new Map<string, string>();
  const outPorts = new Map<string, HTMLElement>();
  const inPorts = new Map<string, HTMLElement>();
  let selected: string | null = null;
  let attempts = 0;
  let hintPair: [string, string] | null = null;
  let live = false;

  for (const name of order) {
    const block = el('div', 'cp-block', row);
    block.style.backgroundImage = `url(${panelModuleUrl(order.indexOf(name) + 3)})`;
    const pin = el('button', 'cp-port cp-in', block);
    pin.type = 'button';
    pin.setAttribute('aria-label', `Вход блока «${name}»`);
    el('div', 'cp-label', block, name);
    const pout = el('button', 'cp-port cp-out', block);
    pout.type = 'button';
    pout.setAttribute('aria-label', `Выход блока «${name}»`);
    inPorts.set(name, pin);
    outPorts.set(name, pout);
    pout.addEventListener('click', () => {
      selected = selected === name ? null : name;
      refresh();
    });
    pin.addEventListener('click', () => {
      if (!selected || selected === name) return;
      connect(selected, name);
      selected = null;
      refresh();
    });
    pout.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      let moved = false;
      const preview = document.createElementNS(SVG_NS, 'line');
      preview.setAttribute('class', 'cp-wire preview');
      svg.appendChild(preview);
      const a = center(pout);
      const move = (ev: PointerEvent) => {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
        const b = local(ev.clientX, ev.clientY);
        preview.setAttribute('x1', String(a.x));
        preview.setAttribute('y1', String(a.y));
        preview.setAttribute('x2', String(b.x));
        preview.setAttribute('y2', String(b.y));
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        preview.remove();
        if (!moved) return;
        const target = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        for (const [to, port] of inPorts) {
          if (port === target && to !== name) {
            connect(name, to);
            break;
          }
        }
        selected = null;
        refresh();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  const local = (x: number, y: number) => {
    const r = panel.getBoundingClientRect();
    return { x: x - r.left, y: y - r.top };
  };
  const center = (node: HTMLElement) => {
    const r = node.getBoundingClientRect();
    return local(r.left + r.width / 2, r.top + r.height / 2);
  };

  function connect(from: string, to: string): void {
    wires.delete(from);
    for (const [k, v] of [...wires]) if (v === to) wires.delete(k);
    wires.set(from, to);
    hintPair = null;
    game.audioHook?.('snap');
  }

  function drawWires(): void {
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${panel.clientWidth} ${panel.clientHeight}`);
    for (const [from, to] of wires) {
      const a = center(outPorts.get(from)!);
      const b = center(inPorts.get(to)!);
      const path = document.createElementNS(SVG_NS, 'path');
      const mx = (a.x + b.x) / 2;
      path.setAttribute('d', `M${a.x},${a.y} C${mx},${a.y - 30} ${mx},${b.y + 30} ${b.x},${b.y}`);
      path.setAttribute('class', `cp-wire${live ? ' live' : ''}`);
      path.addEventListener('click', () => {
        if (live) return;
        wires.delete(from);
        refresh();
      });
      svg.appendChild(path);
    }
    if (hintPair) {
      const [from, to] = hintPair;
      const a = center(outPorts.get(from)!);
      const b = center(inPorts.get(to)!);
      const l = document.createElementNS(SVG_NS, 'line');
      l.setAttribute('x1', String(a.x));
      l.setAttribute('y1', String(a.y));
      l.setAttribute('x2', String(b.x));
      l.setAttribute('y2', String(b.y));
      l.setAttribute('class', 'cp-wire hint');
      svg.appendChild(l);
    }
  }

  function refresh(): void {
    outPorts.forEach((p, name) => {
      p.classList.toggle('selected', selected === name);
      p.classList.toggle('used', wires.has(name));
    });
    inPorts.forEach((p, name) => p.classList.toggle('used', [...wires.values()].includes(name)));
    drawWires();
  }

  fire.addEventListener('click', async () => {
    if (live) return;
    attempts++;
    if (isPanelSolved(wires)) {
      live = true;
      status.textContent = 'Сигнал пошёл!';
      fire.disabled = true;
      refresh();
      game.audioHook?.('board_ok');
      await game.wait(1400);
      f.finish(attempts);
      return;
    }
    panel.classList.remove('spark');
    void panel.offsetWidth;
    panel.classList.add('spark');
    game.audioHook?.('fail');
    status.textContent = `Не работает. Попытка ${attempts}/${MAX_TRIES}`;
    f.hint('Начни с питания, потом по цепочке.', 'galya');
    if (attempts >= 2) f.offerSkip();
    if (attempts >= MAX_TRIES) {
      for (let i = 0; i < PANEL_ORDER.length - 1; i++) {
        const a = PANEL_ORDER[i]!;
        const b = PANEL_ORDER[i + 1]!;
        if (wires.get(a) !== b) {
          hintPair = [a, b];
          break;
        }
      }
    }
    refresh();
  });

  window.addEventListener('resize', refresh);
  f.modal.promise.finally(() => window.removeEventListener('resize', refresh));
  requestAnimationFrame(refresh);
  return f.modal.promise;
}
