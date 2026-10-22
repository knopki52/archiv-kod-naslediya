import type { Game } from '../core/Game';
import type { InputAction } from '../core/Input';
import { el } from './Ui';

export interface ModalHandle<T> {
  root: HTMLElement;
  promise: Promise<T>;
  close(value: T): void;
  readonly closed: boolean;
}

export interface ModalOptions {
  onAction?: (a: InputAction) => void;
  onKey?: (e: KeyboardEvent) => boolean | void;
  escapeValue?: unknown;
  theme?: string;
}

export function openModal<T = void>(game: Game, className: string, options: ModalOptions = {}): ModalHandle<T> {
  const root = el('div', `modal ${className}`, game.ui.layers.modal);
  let closed = false;
  let resolveFn!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolveFn = r));
  game.ui.modals++;
  game.audioHook?.('open');

  const release = game.input.push({
    blocksMove: true,
    action: (a) => {
      if (a === 'pause' && 'escapeValue' in options) {
        handle.close(options.escapeValue as T);
        return true;
      }
      options.onAction?.(a);
      return true;
    },
    key: options.onKey,
  });

  const handle: ModalHandle<T> = {
    root,
    promise,
    get closed() {
      return closed;
    },
    close(value: T) {
      if (closed) return;
      closed = true;
      release();
      game.input.muteWorld(250);
      game.ui.modals--;
      game.audioHook?.('close');
      root.remove();
      resolveFn(value);
    },
  };
  return handle;
}
