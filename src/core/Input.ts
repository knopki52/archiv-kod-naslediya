export type InputAction = 'interact' | 'pause' | 'journal' | 'history' | 'skip';

export interface InputHandler {
  action(a: InputAction, ev?: KeyboardEvent): boolean | void;
  key?(ev: KeyboardEvent): boolean | void;
  blocksMove: boolean;
}

const ACTION_KEYS: Record<string, InputAction> = {
  KeyE: 'interact',
  Enter: 'interact',
  Space: 'interact',
  Escape: 'pause',
  KeyJ: 'journal',
  KeyH: 'history',
};

export class Input {
  private keys = new Set<string>();
  private stack: InputHandler[] = [];
  private joy = { x: 0, y: 0 };
  private mutedUntil = 0;
  skipHeld = false;
  private worldMutedUntil = 0;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.skipHeld = e.ctrlKey || e.shiftKey;
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  push(handler: InputHandler): () => void {
    this.stack.push(handler);
    return () => {
      const i = this.stack.indexOf(handler);
      if (i >= 0) this.stack.splice(i, 1);
    };
  }

  trigger(a: InputAction): void {
    if (performance.now() < this.mutedUntil) return;
    this.stack[this.stack.length - 1]?.action(a);
  }

  mute(ms: number): void {
    this.mutedUntil = performance.now() + ms;
  }

  muteWorld(ms = 250): void {
    this.worldMutedUntil = performance.now() + ms;
  }

  get worldMuted(): boolean {
    return performance.now() < this.worldMutedUntil;
  }

  setJoystick(x: number, y: number): void {
    this.joy.x = x;
    this.joy.y = y;
  }

  move(): { x: number; y: number } {
    const top = this.stack[this.stack.length - 1];
    if (top?.blocksMove) return { x: 0, y: 0 };
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let y = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    x += this.joy.x;
    y += this.joy.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private onKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if (typing && e.code !== 'Escape') return;
    this.skipHeld = e.ctrlKey || e.shiftKey;
    if (e.repeat && ACTION_KEYS[e.code] === 'interact') {
      e.preventDefault();
      return;
    }
    this.keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const top = this.stack[this.stack.length - 1];
    if (!top) return;
    if (top.key?.(e)) return;
    const action = ACTION_KEYS[e.code];
    if (action && performance.now() >= this.mutedUntil) top.action(action, e);
  }
}
