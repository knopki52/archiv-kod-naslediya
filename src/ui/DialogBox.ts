import { portraitUrl, type ThemeKey } from './uiArt';
import { SEEN_KEY, TEXT_SPEEDS } from '../config';
import { SPEAKERS } from '../content/speakers';
import type { SayInput } from '../content/types';
import type { Input, InputAction } from '../core/Input';
import type { Settings } from '../core/Settings';
import { readJSON, writeJSON } from '../core/Storage';
import { el, type Ui } from './Ui';

const MAX_CHUNK = 150;
const GLITCH_CHARS = '▓▒░#%&@';

export function splitText(text: string, max = MAX_CHUNK): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > max) {
      out.push(cur.trim());
      cur = s;
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}

export interface HistoryLine {
  who: string;
  name: string;
  text: string;
}

export class DialogBox {
  readonly history: HistoryLine[] = [];
  private panel: HTMLElement;
  private nameEl: HTMLElement;
  private asideEl: HTMLElement;
  private textEl: HTMLElement;
  private nextEl: HTMLElement;
  private seen: Set<number>;

  private open = false;
  private typing = false;
  private full = '';
  private shown = 0;
  private acc = 0;
  private raf = 0;
  private last = 0;
  private resolveLine: (() => void) | null = null;
  private autoTimer = 0;
  private currentMood = 'normal';
  private currentWho = 'narrator';
  private forceSeen = false;
  private portraitEl!: HTMLElement;
  private portraitImg!: HTMLImageElement;

  onBlip: ((who: string, ch: string) => void) | null = null;
  onSpeak: ((who: string, text: string, mood: string) => void) | null = null;
  onSilence: (() => void) | null = null;
  onLine: ((who: string, speaking: boolean) => void) | null = null;
  timeScale = () => 1;

  constructor(
    ui: Ui,
    private input: Input,
    private settings: Settings,
  ) {
    this.seen = new Set(readJSON<number[]>(SEEN_KEY) ?? []);
    this.panel = el('div', 'panel dialog', ui.layers.dialog);
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-live', 'polite');
    this.portraitEl = el('div', 'dialog-portrait', this.panel);
    this.portraitImg = el('img', 'dialog-portrait-img', this.portraitEl);
    this.portraitImg.alt = '';
    el('div', 'dialog-orn', this.panel);
    this.nameEl = el('div', 'dialog-name', this.panel);
    this.asideEl = el('div', 'dialog-aside', this.panel);
    this.textEl = el('div', 'dialog-text', this.panel);
    this.nextEl = el('div', 'dialog-next', this.panel, '▼');
    this.panel.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.advance();
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  async show(step: SayInput): Promise<void> {
    const def = SPEAKERS[step.who];
    const chunks = splitText(step.text);
    this.history.push({ who: step.who, name: def.name, text: step.text });
    if (this.history.length > 60) this.history.shift();
    for (let i = 0; i < chunks.length; i++) {
      await this.showChunk(step, chunks[i]!, i === 0);
    }
  }

  private showChunk(step: SayInput, text: string, first: boolean): Promise<void> {
    return new Promise((resolve) => {
      const def = SPEAKERS[step.who];
      (document.activeElement as HTMLElement | null)?.blur?.();
      this.open = true;
      this.currentMood = step.mood ?? 'normal';
      this.currentWho = step.who;
      this.onLine?.(step.who, true);
      this.panel.hidden = false;
      this.panel.dataset.mood = this.currentMood;
      this.panel.dataset.who = step.who;
      this.panel.style.setProperty('--speaker', def.color);
      this.nameEl.textContent = def.name;
      this.nameEl.hidden = !def.name;
      const theme = (document.getElementById('stage')?.dataset.theme ?? 'archive') as ThemeKey;
      const purl = def.name ? portraitUrl(step.who, this.currentMood, theme) : null;
      this.portraitEl.hidden = !purl;
      this.panel.classList.toggle('has-portrait', Boolean(purl));
      if (purl) this.portraitImg.src = purl;
      this.asideEl.textContent = first && step.aside ? `(${step.aside})` : '';
      this.asideEl.hidden = !this.asideEl.textContent;
      this.nextEl.style.visibility = 'hidden';
      this.full = text;
      this.shown = 0;
      this.acc = 0;
      this.textEl.textContent = '';
      this.typing = true;
      this.forceSeen = this.seen.has(hash(`${step.who}|${text}`));
      this.seen.add(hash(`${step.who}|${text}`));
      this.persistSeen();

      const releaseInput = step.wait === false ? () => undefined : this.input.push({
        blocksMove: true,
        action: (a: InputAction, ev?: KeyboardEvent) => {
          ev?.preventDefault();
          if (a === 'interact') this.advance();
          return true;
        },
      });

      this.onSpeak?.(step.who, text, this.currentMood);
      this.resolveLine = () => {
        this.onSilence?.();
        this.onLine?.(step.who, false);
        releaseInput();
        this.input.muteWorld(250);
        this.resolveLine = null;
        resolve();
      };

      cancelAnimationFrame(this.raf);
      this.last = performance.now();
      const speed = TEXT_SPEEDS[this.settings.data.textSpeed];
      if (speed === 0) this.finishTyping();
      else this.raf = requestAnimationFrame((t) => this.tick(t));

      if (step.wait === false) {
        const ms = Math.max(1400, text.length * 55) / this.timeScale();
        this.autoTimer = window.setTimeout(() => this.advance(true), ms);
      }
    });
  }

  private tick(now: number): void {
    const dt = Math.min(0.1, (now - this.last) / 1000) * this.timeScale();
    this.last = now;
    const speed = TEXT_SPEEDS[this.settings.data.textSpeed] * (this.currentMood === 'quiet' ? 0.75 : 1);
    this.acc += dt * speed;
    const target = Math.min(this.full.length, Math.floor(this.acc));
    if (target > this.shown) {
      const ch = this.full[target - 1] ?? '';
      if (/\S/.test(ch) && target % 2 === 0 && this.currentMood !== 'whisper') this.onBlip?.(this.currentWho, ch);
      this.shown = target;
    }
    let out = this.full.slice(0, this.shown);
    if (this.currentMood === 'glitch' && !this.settings.data.reducedEffects && out.length > 3 && Math.random() < 0.06) {
      const idx = Math.floor(Math.random() * out.length);
      out = out.slice(0, idx) + GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] + out.slice(idx + 1);
    }
    this.textEl.textContent = out;
    if (this.shown >= this.full.length) {
      this.textEl.textContent = this.full;
      this.endTyping();
      return;
    }
    if (this.input.skipHeld && this.forceSeen) {
      this.finishTyping();
      setTimeout(() => this.advance(), 60);
      return;
    }
    this.raf = requestAnimationFrame((t) => this.tick(t));
  }

  private endTyping(): void {
    this.typing = false;
    this.nextEl.style.visibility = 'visible';
  }

  private finishTyping(): void {
    cancelAnimationFrame(this.raf);
    this.shown = this.full.length;
    this.textEl.textContent = this.full;
    this.endTyping();
  }

  advance(auto = false): void {
    if (!this.open) return;
    if (this.typing && !auto) {
      this.finishTyping();
      return;
    }
    clearTimeout(this.autoTimer);
    cancelAnimationFrame(this.raf);
    this.typing = false;
    this.resolveLine?.();
    this.open = false;
    window.setTimeout(() => {
      if (!this.open) this.panel.hidden = true;
    }, 40);
  }

  hide(): void {
    this.onSilence?.();
    this.open = false;
    this.panel.hidden = true;
    clearTimeout(this.autoTimer);
    cancelAnimationFrame(this.raf);
  }

  closeIfIdle(): void {
    if (!this.resolveLine) this.hide();
  }

  private persistSeen(): void {
    if (this.seen.size > 4000) this.seen = new Set([...this.seen].slice(-3000));
    writeJSON(SEEN_KEY, [...this.seen]);
  }
}
