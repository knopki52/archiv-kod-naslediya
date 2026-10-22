import Phaser from 'phaser';
import { GAME_TITLE, VIEW_H, VIEW_W } from '../config';
import type { Game } from '../core/Game';
import { byteTextureKey, ensureTexture, haloOf } from '../gfx/Assets';
import { coreDoor, hallGround, pillar, portal } from '../gfx/td/art_hall';
import { Lighting } from './Effects';
import { confirmDialog, openAbout, openEndings, openSettings } from '../ui/Menus';
import { el } from '../ui/Ui';

export class TitleScene extends Phaser.Scene {
  private g!: Game;
  private root: HTMLElement | null = null;
  private releaseInput: (() => void) | null = null;

  constructor() {
    super('title');
  }

  create(): void {
    this.g = this.registry.get('game') as Game;
    this.g.world = null;
    this.g.stopScripts();
    this.g.hud.setObjective(null);
    this.g.hud.showMenuButton(false);
    this.g.hints.setRule(null);
    this.g.ui.setTheme('archive');
    let ground: ReturnType<typeof hallGround> | null = null;
    const gr = () => (ground ??= hallGround());
    ensureTexture(this, 'hall_ground', () => gr().p);
    ensureTexture(this, 'hall_ground__e', () => gr().e);
    ensureTexture(this, 'hall_ground__h', () => haloOf(gr().e, 6));
    const light = new Lighting(this, 0x56529a);
    this.add.image(0, 0, 'hall_ground').setOrigin(0).setDepth(0);
    this.add.image(0, 0, 'hall_ground__e').setOrigin(0).setDepth(1);
    this.add.image(-18, -18, 'hall_ground__h').setOrigin(0).setDepth(9310).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
    light.addEmitter('hall_ground__e', 0, 0);
    ensureTexture(this, 'title_door', () => { const d = coreDoor(0, false); const c = d.p.clone(); c.blit(d.e, 0, 0); return c; });
    this.add.image(272, 24, 'title_door').setOrigin(0).setDepth(30);
    ensureTexture(this, 'title_pillar', () => pillar(112));
    for (const x of [32, 108, 252, 370, 516, 590]) this.add.image(x - 12, 18, 'title_pillar').setOrigin(0).setDepth(134);
    const acc = ['#ffb347', '#9fb4c8', '#7dffb0'] as const;
    ([[218, 226], [320, 204], [422, 226]] as const).forEach(([x, y], i) => {
      const keys = [0, 1, 2, 3].map((f) => {
        ensureTexture(this, `title_portal_${i}_${f}`, () => portal(acc[i]!, 'active', 20 + i, f).p);
        ensureTexture(this, `title_portal_e_${i}_${f}`, () => portal(acc[i]!, 'active', 20 + i, f).e);
        return f;
      });
      const img = this.add.image(x - 36, y - 80, `title_portal_${i}_0`).setOrigin(0).setDepth(y);
      const em = this.add.image(x - 36, y - 80, `title_portal_e_${i}_0`).setOrigin(0).setDepth(y + 1);
      const emitter = light.addEmitter(`title_portal_e_${i}_0`, x - 36, y - 80);
      let f = i;
      this.time.addEvent({ delay: 170, loop: true, callback: () => {
        f = (f + 1) % keys.length;
        img.setTexture(`title_portal_${i}_${f}`);
        em.setTexture(`title_portal_e_${i}_${f}`);
        if (emitter) emitter.key = `title_portal_e_${i}_${f}`;
      } });
      light.addLight(x, y - 30, 130, [0xffb347, 0x9fb4c8, 0x7dffb0][i]!, 1.1, 0.1);
    });
    light.addLight(320, 90, 200, 0xffd88a, 0.8, 0.04);
    for (const x of [32, 108, 252, 370, 516, 590]) light.addLight(x, 62, 44, 0xffb870, 0.5, 0.12);
    this.add.particles(0, 0, 'px1', {
      x: { min: 0, max: 640 }, y: { min: 20, max: 430 }, lifespan: 6000, speedY: { min: -10, max: -2 }, speedX: { min: -3, max: 3 },
      alpha: { start: 0.8, end: 0 }, tint: [0x5fe3ff, 0xa88aff, 0xffffff, 0xffd36b], frequency: 70, blendMode: Phaser.BlendModes.ADD,
    }).setDepth(9320);
    light.addLight(VIEW_W * 0.8, 235, 110, 0x5fe3ff, 0.9, 0.05);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, 640, 430);
    cam.scrollY = 34;
    this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, dt: number) => light.update(dt, this.g.settings.data.reducedEffects));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => light.destroy());
    void VIEW_H;
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());

    this.releaseInput = this.g.input.push({ blocksMove: true, action: () => true });
    if (this.g.audio.ready) this.showMenu();
    else this.showStart();
  }

  private addDrone(root: HTMLElement): void {
    const tex = this.textures.get(byteTextureKey('drone'));
    const f0 = tex.get('0');
    const w = f0.cutWidth, h = f0.cutHeight;
    const strip = document.createElement('canvas');
    strip.width = w * 4;
    strip.height = h;
    const c = strip.getContext('2d')!;
    const src = tex.getSourceImage() as CanvasImageSource;
    for (let i = 0; i < 4; i++) {
      const fr = tex.get(String(i));
      c.drawImage(src, fr.cutX, fr.cutY, w, h, i * w, 0, w, h);
    }
    const wrap = el('div', 'title-drone', root);
    wrap.setAttribute('aria-hidden', 'true');
    const d = el('div', 'title-drone-img', wrap);
    d.style.backgroundImage = `url(${strip.toDataURL()})`;
    d.style.setProperty('--fw', String(w));
    d.style.setProperty('--fh', String(h));
  }

  private teardown(): void {
    this.root?.remove();
    this.root = null;
    this.releaseInput?.();
  }

  private showStart(): void {
    this.root?.remove();
    const root = el('div', 'title-root', this.g.ui.layers.modal);
    this.root = root;
    this.addDrone(root);
    el('div', 'title-logo', root, 'АРХИВ');
    el('div', 'title-sub', root, 'Код наследия');
    const b = el('button', 'btn title-start', root, 'Нажми, чтобы начать');
    b.type = 'button';
    el('div', 'title-note', root, 'Лучше в наушниках');
    b.focus();
    b.addEventListener('click', () => {
      this.g.audio.unlock();
      this.g.audio.sfx.play('portal');
      this.g.audio.music.play('archive', 2);
      this.showMenu();
    });
  }

  private showMenu(): void {
    this.root?.remove();
    const root = el('div', 'title-root', this.g.ui.layers.modal);
    this.root = root;
    this.g.audio.music.play('archive', 2);
    this.addDrone(root);
    el('div', 'title-logo', root, 'АРХИВ');
    el('div', 'title-sub', root, 'Код наследия');
    const menu = el('div', 'title-menu', root);
    const hasSave = this.g.save.hasSave();
    const add = (label: string, fn: () => void | Promise<void>) => {
      const b = el('button', 'btn menu-btn', menu, label);
      b.type = 'button';
      b.addEventListener('click', () => void fn());
      return b;
    };
    let first: HTMLButtonElement | null = null;
    if (hasSave) first = add('Продолжить', () => {
      this.g.continueGame();
    });
    const play = add(hasSave ? 'Новая игра' : 'Играть', async () => {
      if (hasSave && !(await confirmDialog(this.g, 'Начать заново? Текущее сохранение будет стёрто.', 'Начать заново'))) return;
      this.g.startNewGame();
    });
    first ??= play;
    add('Настройки', () => openSettings(this.g));
    add('Концовки', () => openEndings(this.g));
    add('Об игре', () => openAbout(this.g));
    el('div', 'title-note', root, GAME_TITLE);
    first.focus();
    this.releaseInput?.();
    this.releaseInput = this.g.input.push({
      blocksMove: true,
      action: () => true,
      key: (e) => {
        if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return false;
        const btns = [...menu.querySelectorAll<HTMLButtonElement>('button')];
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        const n = (i + (e.code === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
        btns[n]?.focus();
        return true;
      },
    });
  }
}
