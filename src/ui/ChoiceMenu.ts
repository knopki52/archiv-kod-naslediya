import type { ChoiceOption, ChoiceStep } from '../content/types';
import type { Input } from '../core/Input';
import { el, type Ui } from './Ui';

export class ChoiceMenu {
  private box: HTMLElement;
  private buttons: HTMLButtonElement[] = [];
  private enabled: boolean[] = [];
  private index = 0;
  private resolveFn: ((o: ChoiceOption) => void) | null = null;
  private options: ChoiceOption[] = [];
  private armed = false;

  constructor(
    ui: Ui,
    private input: Input,
  ) {
    this.box = el('div', 'choice', ui.layers.dialog);
    this.box.hidden = true;
  }

  get isOpen(): boolean {
    return this.resolveFn !== null;
  }

  choose(step: ChoiceStep, options: ChoiceOption[], delayMs = 350): Promise<ChoiceOption> {
    return new Promise((resolve) => {
      this.options = options;
      this.box.replaceChildren();
      this.buttons = [];
      this.enabled = options.map((o) => !o.locked);
      if (step.prompt) el('div', 'choice-prompt', this.box, step.prompt);
      options.forEach((opt, i) => {
        const b = el('button', 'btn choice-btn', this.box);
        b.type = 'button';
        b.dataset.index = String(i);
        const num = el('span', 'choice-num', b, opt.locked ? '🔒' : String(i + 1));
        num.setAttribute('aria-hidden', 'true');
        el('span', 'choice-text', b, opt.text);
        if (opt.locked) {
          b.disabled = true;
          b.classList.add('locked');
        }
        b.addEventListener('pointerenter', () => this.focus(i));
        b.addEventListener('click', () => this.pick(i));
        this.buttons.push(b);
      });
      this.box.hidden = false;
      this.box.classList.add('arming');
      const first = Math.max(0, this.enabled.indexOf(true));
      this.focus(first);

      this.armed = false;
      const armTimer = window.setTimeout(() => {
        this.armed = true;
        this.box.classList.remove('arming');
      }, delayMs);

      const release = this.input.push({
        blocksMove: true,
        action: (a, ev) => {
          ev?.preventDefault();
          if (a === 'interact' && this.armed) this.pick(this.index);
          return true;
        },
        key: (e) => {
          if (!this.armed) return true;
          if (e.code === 'ArrowDown' || e.code === 'KeyS') return this.step(1);
          if (e.code === 'ArrowUp' || e.code === 'KeyW') return this.step(-1);
          const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
          if (m) {
            this.pick(Number(m[2]) - 1);
            return true;
          }
          return false;
        },
      });

      this.resolveFn = (o) => {
        window.clearTimeout(armTimer);
        release();
        this.input.muteWorld(250);
        this.box.hidden = true;
        this.resolveFn = null;
        resolve(o);
      };
    });
  }

  private step(d: number): boolean {
    const n = this.buttons.length;
    for (let k = 1; k <= n; k++) {
      const j = (this.index + d * k + n * k) % n;
      if (this.enabled[j]) {
        this.focus(j);
        break;
      }
    }
    return true;
  }

  private focus(i: number): void {
    if (!this.enabled[i]) return;
    this.index = i;
    this.buttons.forEach((b, j) => b.classList.toggle('active', j === i));
    this.buttons[i]?.focus({ preventScroll: true });
  }

  private pick(i: number): void {
    if (!this.enabled[i] || !this.armed) return;
    const opt = this.options[i];
    if (opt) this.resolveFn?.(opt);
  }

  answer(i: number): void {
    this.pick(i);
  }
}
