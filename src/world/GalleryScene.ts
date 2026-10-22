import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config';
import type { Game } from '../core/Game';
import { BYTE_FORMS } from '../gfx/byteForms';
import { byteTextureKey, charTextureKey, ensureTexture, charFrameBuffer } from '../gfx/Assets';
import { CHAR_IDS, CHARACTERS } from '../gfx/characters';
import * as props from '../gfx/props';
import { PixelCanvas } from '../gfx/PixelCanvas';
import { AMBIENCE_NAMES } from '../audio/Ambience';
import { SFX_NAMES } from '../audio/Sfx';
import { TRACKS } from '../audio/tracks';
import { ICON_NAMES, iconUrl } from '../gfx/icons';
import { portraitHuman } from '../gfx/td/portraits';
type Mood = 'neutral' | 'nervous' | 'broken';
import { el } from '../ui/Ui';
import { breath, crumble, dust, embers, glow, Lighting, snow } from './Effects';

const PAGES = ['Персонажи', 'Реквизит', 'Эффекты и свет', 'Портреты и иконки', 'Звук'] as const;

export class GalleryScene extends Phaser.Scene {
  private g!: Game;
  private page = 0;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private cleanups: (() => void)[] = [];
  private lighting: Lighting | null = null;
  private movingLight: { x: number; y: number } | null = null;
  private t = 0;
  private title!: Phaser.GameObjects.Text;
  private dom: HTMLElement | null = null;

  constructor() {
    super('gallery');
  }

  create(): void {
    this.g = this.registry.get('game') as Game;
    this.cameras.main.setBackgroundColor('#1a1438');
    this.title = this.add.text(8, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffd36b' }).setDepth(10000).setScrollFactor(0);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= PAGES.length) this.show(n - 1);
      if (e.key === ' ') this.trigger();
    });
    this.g.input.push({ blocksMove: true, action: () => true });
    this.show(Number(new URLSearchParams(location.search).get('page') ?? 1) - 1 || 0);
  }

  private clear(): void {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.cleanups.forEach((f) => f());
    this.cleanups = [];
    this.dom?.remove();
    this.dom = null;
    this.lighting?.destroy();
    this.lighting = null;
    this.movingLight = null;
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.objs.push(o);
    return o;
  }

  private label(x: number, y: number, text: string): void {
    this.add2(this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '6px', color: '#a9a2c8' }).setOrigin(0.5, 0));
  }

  show(page: number): void {
    this.clear();
    this.page = Math.max(0, Math.min(PAGES.length - 1, page));
    this.title.setText(`[${this.page + 1}/${PAGES.length}] ${PAGES[this.page]}   (клавиши 1–5, пробел — эффект)`);
    this.dom?.remove();
    this.dom = null;
    if (this.page === 0) this.pageCharacters();
    else if (this.page === 1) this.pageProps();
    else if (this.page === 2) this.pageEffects();
    else if (this.page === 3) this.pagePortraits();
    else this.pageSound();
  }

  private pageCharacters(): void {
    this.add2(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x241d44).setOrigin(0));
    this.add2(this.add.rectangle(0, 0, VIEW_W, 1, 0x000000, 0));
    const perRow = 10;
    CHAR_IDS.forEach((id, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = 24 + col * 46;
      const y = 78 + row * 78;
      this.add2(this.add.ellipse(x, y - 1, 20, 5, 0x000000, 0.4));
      const s = this.add2(this.add.sprite(x, y, charTextureKey(id), 'idle_0').setOrigin(0.5, 1).setScale(1.6));
      s.play(`${id}_${i % 3 === 0 ? 'walk' : i % 3 === 1 ? 'talk' : 'idle'}`);
      this.label(x, y + 4, id);
    });
    BYTE_FORMS.forEach((f, i) => {
      const x = 90 + i * 80;
      const s = this.add2(this.add.sprite(x, 214, byteTextureKey(f), '0').setScale(2));
      s.play(`${byteTextureKey(f)}_fly`);
      this.label(x, 232, `Байт: ${f}`);
    });
  }

  private pageProps(): void {
    this.add2(this.add.rectangle(0, 0, VIEW_W, 170, 0x9fb8d8).setOrigin(0));
    ensureTexture(this, 'sky_demo', () => props.sky(VIEW_W, 170, '#9fb8d8', '#e8f1ff', 0));
    this.add2(this.add.image(0, 0, 'sky_demo').setOrigin(0));
    this.add2(this.add.rectangle(0, 170, VIEW_W, VIEW_H - 170, 0xe8f1ff).setOrigin(0));
    const place = (key: string, build: () => PixelCanvas, x: number, y: number, name: string) => {
      ensureTexture(this, key, build);
      this.add2(this.add.image(x, y, key).setOrigin(0.5, 1));
      this.label(x, y + 2, name);
    };
    place('p_pine', () => props.pine(70, 4), 28, 196, 'сосна');
    place('p_izba', () => props.izba(96, 72), 100, 196, 'изба');
    place('p_well', () => props.well(), 168, 196, 'колодец');
    place('p_fence', () => props.fence(40), 218, 196, 'забор');
    place('p_drift', () => props.snowdrift(44, 10), 262, 196, 'сугроб');
    place('p_crate', () => props.crate(), 300, 196, 'ящик');
    place('p_shelf', () => props.bookshelf(36, 64), 336, 196, 'стеллаж');
    place('p_stove', () => props.stove(true), 376, 196, 'буржуйка');
    place('p_lamp', () => props.lamp(true), 404, 196, 'лампа');
    place('p_portal', () => props.bookPortal(true), 442, 196, 'портал');
    place('p_portal_off', () => props.bookPortal(false), 20, 258, 'портал (погас)');
    place('p_rocket', () => props.rocket(70), 70, 258, 'ракета');
    place('p_gantry', () => props.gantry(70), 110, 258, 'ферма');
    place('p_tower', () => props.antennaTower(60), 142, 258, 'антенна');
    place('p_console', () => props.consoleDesk(), 206, 258, 'пульт');
    place('p_desk', () => props.desk(), 268, 258, 'стол');
    place('p_metro', () => props.metronome(), 312, 258, 'метроном');
  }

  private pageEffects(): void {
    this.add2(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x1c2540).setOrigin(0));
    this.add2(this.add.rectangle(0, 190, VIEW_W, VIEW_H - 190, 0x2f3a5c).setOrigin(0));
    const emitters = snow(this, { width: VIEW_W, height: VIEW_H });
    this.cleanups.push(() => emitters.forEach((e) => e.destroy()));
    const d = dust(this, VIEW_W, VIEW_H);
    this.cleanups.push(() => d.destroy());
    const em = embers(this, 70, 200);
    this.cleanups.push(() => em.destroy());
    ensureTexture(this, 'p_stove', () => props.stove(true));
    this.add2(this.add.image(70, 214, 'p_stove').setOrigin(0.5, 1));
    glow(this, 70, 190, 0xff9a40, 1.6, 0.5);
    const actor = this.add2(this.add.container(190, 215));
    const sp = this.add.sprite(0, 0, charTextureKey('zina'), 'idle_0').setOrigin(0.5, 1);
    sp.play('zina_idle');
    actor.add(sp);
    this.cleanups.push(breath(this, actor));
    this.lighting = new Lighting(this, 0x3a4070);
    this.lighting.addLight(70, 200, 55, 0xff9a40, 1, 0.3);
    this.movingLight = { x: 300, y: 190 };
    this.lighting.addLight(300, 190, 60, 0xffe0a0, 0.9, 0.06);
    const cs = this.add2(this.add.sprite(400, 215, charTextureKey('dubler'), 'idle_0').setOrigin(0.5, 1));
    cs.play('dubler_idle');
    this.label(400, 220, 'пробел: рассыпание');
    this.cleanups.push(() => cs.destroy());
    (this as unknown as { crumbleTarget: Phaser.GameObjects.Sprite }).crumbleTarget = cs;
  }

  private panel(): HTMLElement {
    const root = el('div', 'gallery-dom panel', this.g.ui.layers.overlay);
    this.dom = root;
    return root;
  }

  private pagePortraits(): void {
    this.add2(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x120e26).setOrigin(0));
    const root = this.panel();
    el('div', 'gallery-h', root, 'Портреты допроса (нейтраль / нервничает / сломлен)');
    const row = el('div', 'gallery-row', root);
    for (const id of ['ignat', 'prohorov', 'inspector'] as const) {
      for (const mood of ['neutral', 'nervous', 'broken'] as Mood[]) {
        const c = portraitHuman(CHARACTERS[id], mood === 'neutral' ? 'neutral' : 'worried').toCanvas();
        c.className = 'gallery-portrait';
        row.appendChild(c);
      }
    }
    el('div', 'gallery-h', root, 'Иконки улик и интерфейса');
    const icons = el('div', 'gallery-row', root);
    for (const name of ICON_NAMES) {
      const cell = el('div', 'gallery-icon', icons);
      const img = el('img', 'clue-icon', cell);
      img.src = iconUrl(name);
      el('span', '', cell, name);
    }
  }

  private pageSound(): void {
    this.add2(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x120e26).setOrigin(0));
    const root = this.panel();
    const sec = (title: string, names: string[], fn: (n: string) => void) => {
      el('div', 'gallery-h', root, title);
      const row = el('div', 'gallery-row', root);
      for (const n of names) {
        const b = el('button', 'btn gallery-btn', row, n);
        b.type = 'button';
        b.addEventListener('click', () => {
          this.g.audio.unlock();
          fn(n);
        });
      }
    };
    sec('Эффекты', [...SFX_NAMES], (n) => this.g.audio.sfx.play(n));
    sec('Музыка', [...Object.keys(TRACKS), '(стоп)'], (n) => (n === '(стоп)' ? this.g.audio.music.stop() : this.g.audio.music.play(n, 1)));
    sec('Эмбиент', [...AMBIENCE_NAMES, '(стоп)'], (n) => this.g.audio.ambience.set(n === '(стоп)' ? null : n));
    sec('Метроном', ['старт', 'замереть', 'стоп'], (n) => {
      if (n === 'старт') this.g.audio.metronome.start(60);
      else if (n === 'замереть') this.g.audio.metronome.freeze(1);
      else this.g.audio.metronome.stop();
    });
  }

  private trigger(): void {
    const cs = (this as unknown as { crumbleTarget?: Phaser.GameObjects.Sprite }).crumbleTarget;
    if (this.page !== 2 || !cs) return;
    cs.setVisible(false);
    void crumble(this, charFrameBuffer(CHARACTERS['dubler'], 'idle_0', 'dubler'), cs.x, cs.y, { ms: 1100 }).then(() =>
      crumble(this, charFrameBuffer(CHARACTERS['dubler'], 'idle_0', 'dubler'), cs.x, cs.y, { ms: 900, reverse: true }).then(() => cs.setVisible(true)),
    );
  }

  override update(_t: number, dt: number): void {
    this.t += dt / 1000;
    if (this.lighting) {
      if (this.movingLight) this.movingLight.x = 300 + Math.sin(this.t) * 60;
      const moving = this.lighting.lights[1];
      if (moving && this.movingLight) moving.x = this.movingLight.x;
      this.lighting.update(dt, this.g.settings.data.reducedEffects);
    }
  }
}
