import type { EventBus } from '../core/EventBus';
import type { Settings } from '../core/Settings';
import type { Input } from '../core/Input';
import { iconUrl } from '../gfx/icons';
import { el, type Ui } from './Ui';

export class Hud {
  private objective: HTMLElement;
  private toasts: HTMLElement;
  private saveIcon: HTMLElement;
  private menuBtn: HTMLButtonElement;
  private onMenu: (() => void) | null = null;
  private loupeIcon: HTMLImageElement;
  private current: string | null = null;
  private objectiveText!: HTMLElement;

  constructor(ui: Ui, bus: EventBus, private settings: Settings) {
    this.objective = el('div', 'objective', ui.layers.hud);
    this.objective.hidden = true;
    el('div', 'objective-icon', this.objective);
    const ot = el('div', 'objective-body', this.objective);
    el('div', 'objective-label', ot, 'Цель');
    this.objectiveText = el('div', 'objective-text', ot);
    this.toasts = el('div', 'toasts', ui.layers.hud);
    this.saveIcon = el('div', 'save-icon', ui.layers.hud, '💾');
    this.saveIcon.hidden = true;
    this.menuBtn = el('button', 'btn hud-menu', ui.layers.hud);
    this.menuBtn.type = 'button';
    this.menuBtn.setAttribute('aria-label', 'Меню');
    this.menuBtn.hidden = true;
    this.menuBtn.addEventListener('click', () => this.onMenu?.());
    this.loupeIcon = el('img', 'hud-loupe', ui.layers.hud);
    this.loupeIcon.src = iconUrl('eye');
    this.loupeIcon.alt = 'Лупа правды';
    this.loupeIcon.hidden = true;

    bus.on('objective:changed', ({ text }) => this.setObjective(text));
    bus.on('save:written', () => this.flashSave());
    settings.onChange(() => this.render());
  }

  showMenuButton(on: boolean, handler?: () => void): void {
    this.menuBtn.hidden = !on;
    if (handler) this.onMenu = handler;
  }

  setLoupe(on: boolean): void {
    this.loupeIcon.hidden = !on;
  }

  setObjective(text: string | null): void {
    this.current = text;
    this.render();
  }

  private render(): void {
    const show = Boolean(this.current) && this.settings.data.showObjective;
    this.objective.hidden = !show;
    this.objectiveText.textContent = this.current ?? '';
  }

  pulseObjective(): void {
    this.objective.classList.remove('pulse');
    void this.objective.offsetWidth;
    this.objective.classList.add('pulse');
  }

  toast(text: string, kind: 'clue' | 'info' = 'info', ms = 2400): void {
    const t = el('div', `toast toast-${kind}`, this.toasts, text);
    window.setTimeout(() => t.classList.add('out'), ms);
    window.setTimeout(() => t.remove(), ms + 400);
  }

  private flashSave(): void {
    this.saveIcon.hidden = false;
    this.saveIcon.classList.remove('flash');
    void this.saveIcon.offsetWidth;
    this.saveIcon.classList.add('flash');
    window.setTimeout(() => (this.saveIcon.hidden = true), 1100);
  }
}

export class TouchControls {
  private ring: HTMLElement;
  private thumb: HTMLElement;
  private action: HTMLButtonElement;
  private pointerId: number | null = null;
  private origin = { x: 0, y: 0 };

  constructor(ui: Ui, private input: Input) {
    this.ring = el('div', 'joy-ring', ui.layers.hud);
    this.thumb = el('div', 'joy-thumb', this.ring);
    this.ring.hidden = true;
    this.action = el('button', 'btn touch-action', ui.layers.hud, 'E');
    this.action.type = 'button';
    this.action.setAttribute('aria-label', 'Действие');
    this.action.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.trigger('interact');
    });

    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    ui.stage.classList.toggle('touch', coarse);
    window.addEventListener('touchstart', () => ui.stage.classList.add('touch'), { once: true, passive: true });

    const stage = ui.stage;
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || this.pointerId !== null) return;
      if ((e.target as HTMLElement).closest('.btn, .panel, .choice')) return;
      const r = stage.getBoundingClientRect();
      if (e.clientX - r.left > r.width * 0.5) return;
      this.pointerId = e.pointerId;
      this.origin = { x: e.clientX, y: e.clientY };
      const ringR = this.ring.getBoundingClientRect();
      const size = ringR.width || r.width * 0.16;
      this.ring.hidden = false;
      this.ring.style.left = `${e.clientX - r.left - size / 2}px`;
      this.ring.style.top = `${e.clientY - r.top - size / 2}px`;
      this.thumb.style.transform = 'translate(0,0)';
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.pointerId) return;
      const r = stage.getBoundingClientRect();
      const max = r.width * 0.07;
      let dx = e.clientX - this.origin.x;
      let dy = e.clientY - this.origin.y;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      const dead = max * 0.2;
      this.input.setJoystick(Math.abs(dx) < dead ? 0 : dx / max, Math.abs(dy) < dead ? 0 : dy / max);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.ring.hidden = true;
      this.input.setJoystick(0, 0);
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }
}
