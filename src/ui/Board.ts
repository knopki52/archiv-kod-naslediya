import { CLUES } from '../content/clues';
import type { ClueId, EpochNo } from '../content/types';
import { iconUrl } from '../gfx/icons';
import { BOARDS, evaluateBoard, seededShuffle } from '../core/Board';
import type { Game } from '../core/Game';
import { openModal } from './Modal';
import { el } from './Ui';

const BOARD_TITLES: Record<EpochNo, string> = {
  1: 'Доска улик',
  2: 'Тихий суд',
  3: 'Доска улик',
};

export async function runBoard(game: Game, epoch: EpochNo): Promise<void> {
  const def = BOARDS[epoch];
  const state = game.store.state;
  const owned = state.clues[epoch].filter((c) => c !== 'ep1.F1' || Boolean(state.flags['ep1.believedGuest']));
  const modal = openModal<void>(game, `board board-ep${epoch}`);
  const root = modal.root;
  el('div', 'board-title', root, BOARD_TITLES[epoch]);
  const cork = el('div', 'board-cork panel', root);
  const grid = el('div', 'board-grid', cork);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'board-threads');
  cork.appendChild(svg);
  const status = el('div', 'board-status', root);
  const accuse = el('button', 'btn board-accuse', root, 'Обвинить');
  accuse.type = 'button';
  accuse.disabled = true;

  let attempts = 0;
  const selected: ClueId[] = [];
  let busy = false;
  const order = seededShuffle(owned, epoch * 101 + (state.stats.wrongBoardTries + 1));
  const cards = new Map<ClueId, HTMLButtonElement>();

  const refresh = () => {
    cards.forEach((b, id) => {
      const idx = selected.indexOf(id);
      b.classList.toggle('selected', idx >= 0);
      (b.querySelector('.card-badge') as HTMLElement).dataset.order = idx >= 0 ? String(idx + 1) : '';
      b.setAttribute('aria-pressed', String(idx >= 0));
    });
    accuse.disabled = selected.length !== 3 || busy;
    status.textContent = `Выбрано: ${selected.length}/3`;
  };

  for (const id of order) {
    const c = CLUES[id];
    const b = el('button', 'card clue-card', grid);
    b.type = 'button';
    b.dataset.clue = id;
    const ic = el('img', 'clue-icon', b);
    ic.src = iconUrl(c.icon);
    ic.alt = '';
    el('div', 'card-title', b, c.title);
    el('div', 'card-text', b, c.text);
    el('span', 'card-badge', b);
    b.addEventListener('click', () => {
      if (busy) return;
      const i = selected.indexOf(id);
      if (i >= 0) selected.splice(i, 1);
      else if (selected.length < 3) selected.push(id);
      refresh();
    });
    cards.set(id, b);
  }

  const drawThreads = () => {
    const rect = cork.getBoundingClientRect();
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    const pts = selected.map((id) => {
      const r = cards.get(id)!.getBoundingClientRect();
      return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
    });
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.setAttribute('class', 'thread');
      svg.appendChild(line);
    }
  };

  accuse.addEventListener('click', async () => {
    if (selected.length !== 3 || busy) return;
    busy = true;
    attempts++;
    const res = evaluateBoard(epoch, selected, attempts);
    if (res.ok) {
      drawThreads();
      game.audioHook?.('board_ok');
      status.textContent = 'Связка найдена';
      game.bus.emit('board:solved', { epoch });
      await game.wait(1400);
      modal.close();
      return;
    }
    state.stats.wrongBoardTries++;
    status.textContent = 'Не сходится';
    if (attempts >= 4 && attempts % 2 === 0) {
      const hint = def.correct.find((c) => !selected.includes(c)) ?? def.correct[0]!;
      cards.get(hint)?.classList.add('glow');
    } else if (attempts >= 2) {
      const hint = def.correct.find((c) => !selected.includes(c));
      if (hint) cards.get(hint)?.classList.add('glow');
    }
    if (res.message && !state.byteSilent) {
      await game.say({ who: 'byte', text: res.message });
      game.dialog.hide();
    }
    busy = false;
    refresh();
  });

  refresh();
  (grid.firstElementChild as HTMLElement | null)?.focus();
  await modal.promise;
}
