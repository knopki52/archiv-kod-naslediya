import type { SpeakerId } from '../../content/types';
import type { Game } from '../../core/Game';
import { openModal, type ModalHandle } from '../Modal';
import { el } from '../Ui';

export interface MinigameResult {
  solved: true;
  attempts: number;
  skipped: boolean;
}

export interface MinigameFrame {
  modal: ModalHandle<MinigameResult>;
  root: HTMLElement;
  hint(text: string, who?: SpeakerId): void;
  offerSkip(): void;
  finish(attempts: number, skipped?: boolean): void;
}

export function openMinigame(game: Game, id: string, title: string): MinigameFrame {
  const modal = openModal<MinigameResult>(game, `minigame minigame-${id}`);
  el('div', 'minigame-title', modal.root, title);
  let skipBtn: HTMLButtonElement | null = null;
  let elapsed = 0;
  const timer = window.setInterval(() => {
    elapsed += 500 * game.timeScale;
    if (elapsed >= 60000) frame.offerSkip();
  }, 500);

  const frame: MinigameFrame = {
    modal,
    root: modal.root,
    hint(text, who = 'byte') {
      if (who === 'byte' && game.store.state.byteSilent) return;
      void game.dialog.show({ who, text, wait: false });
    },
    offerSkip() {
      if (skipBtn || modal.closed) return;
      skipBtn = el('button', 'btn minigame-skip', modal.root, 'Пропустить');
      skipBtn.type = 'button';
      skipBtn.addEventListener('click', () => {
        game.store.state.stats.skipped++;
        frame.finish(0, true);
      });
    },
    finish(attempts, skipped = false) {
      window.clearInterval(timer);
      game.dialog.hide();
      modal.close({ solved: true, attempts, skipped });
    },
  };
  return frame;
}

export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
