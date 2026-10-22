export interface UiLayers {
  hud: HTMLElement;
  dialog: HTMLElement;
  modal: HTMLElement;
  overlay: HTMLElement;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: HTMLElement,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

export class Ui {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly layers: UiLayers;
  modals = 0;

  constructor() {
    this.root = document.getElementById('ui-root') as HTMLElement;
    this.stage = document.getElementById('stage') as HTMLElement;
    this.layers = {
      hud: el('div', 'layer layer-hud', this.root),
      modal: el('div', 'layer layer-modal', this.root),
      dialog: el('div', 'layer layer-dialog', this.root),
      overlay: el('div', 'layer layer-overlay', this.root),
    };
  }

  setTheme(theme: 'archive' | 'nov' | 'len' | 'baik' | 'core'): void {
    this.stage.dataset.theme = theme;
  }
}
