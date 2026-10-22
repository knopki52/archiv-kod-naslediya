import Phaser from 'phaser';
import { HALL_INTERACTABLES, PORTAL_POS } from '../../content/hall';
import type { Interactable } from '../../content/types';
import { bookPile } from '../../gfx/td/art_common';
import {
  armchair, banner, candleStand, coreDoor, desk, globe, HALL, hallGround, holoCube, ladder, lectern, pillar, portal, roundTable,
  scrollBasket, sconce, serverRack, showcase,
} from '../../gfx/td/art_hall';
import { chair, floatingPage, standShelf } from '../../gfx/td/art_common';
import { Px } from '../../gfx/td/px';
import type { Dir } from '../../gfx/td/chars';
import { runCollection } from '../../ui/Screens';
import { crumble, glow, type LightDef } from '../Effects';
import { DEPTH_FX, WorldScene, type PropHandle } from '../WorldScene';

export const EPOCH_SCENES = ['nov_square', 'len_hall', 'bk_bunker'] as const;
const ACCENTS = ['#ffb347', '#9fb4c8', '#7dffb0'] as const;
const ACCENT_NUM = [0xffb347, 0x9fb4c8, 0x7dffb0] as const;
const DARK = 0x1c1a3c;
const LIT = 0x7a6ca6;

export class ArchiveHall extends WorldScene {
  protected override worldW = HALL.W;
  protected override worldH = HALL.H;
  protected override walk = { x: 14, y: HALL.FLOOR_Y + 8, w: HALL.W - 28, h: HALL.H - HALL.FLOOR_Y - 22 };
  private lecternH: PropHandle | null = null;
  private deskH: PropHandle | null = null;
  private showcaseH: PropHandle | null = null;
  private doorH: PropHandle | null = null;
  private portalH: (PropHandle | null)[] = [];
  private hubDecor: PropHandle[] = [];
  private ambientT = 0;
  private hubBuilt = false;
  private leafLight: LightDef | null = null;
  private bookLight: LightDef | null = null;
  private portalLights: (LightDef | null)[] = [];
  private byteLight: LightDef | null = null;
  private heroLight: LightDef | null = null;
  private dublerGlow: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('archive_hall');
  }

  protected override themeKey(): 'archive' {
    return 'archive';
  }
  protected override interactableDefs(): Interactable[] {
    return HALL_INTERACTABLES;
  }
  protected override stepSound(): 'step_stone' {
    return 'step_stone';
  }
  private get hub(): boolean {
    return Boolean(this.g.store.state.flags['pro.done']);
  }

  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: 300, y: 318, dir: 'up' };
  }

  protected buildWorld(): void {
    this.hubBuilt = false;
    this.showcaseH = null;
    this.doorH = null;
    this.portalH = [null, null, null];
    this.portalLights = [null, null, null];
    this.hubDecor = [];
    this.dublerGlow = null;
    this.leafLight = null;
    this.bookLight = null;
    this.ambientT = 0;
    const s = this.g.store.state;
    const hub = this.hub;
    this.setupLighting(hub ? LIT : DARK);
    const L = this.light!;
    this.addGround('hall_ground', hallGround);
    this.addAnimProp('hall_rack_l', [0, 1].map((k) => () => serverRack(38, 100, 11 + k * 7)), 4, HALL.WALL_TOP + 6, 2.5, { depth: 20 });
    this.addAnimProp('hall_rack_r', [0, 1].map((k) => () => serverRack(38, 100, 12 + k * 9)), 598, HALL.WALL_TOP + 6, 3, { depth: 20 });
    this.doorH = this.addProp(this.doorKey(), () => coreDoor(Math.min(3, s.cards.length), s.cards.length >= 3 && Boolean(s.flags['hub.doorOpen'])), 272, HALL.FLOOR_Y - 104, { depth: 30, solid: { x: 272, y: HALL.FLOOR_Y - 6, w: 96, h: 8 } });
    this.addProp('hall_banner0', () => banner(0), 215, HALL.WALL_TOP + 12, { depth: 25 });
    this.addProp('hall_banner1', () => banner(1), 345, HALL.WALL_TOP + 12, { depth: 25 });
    for (const x of [32, 108, 252, 370, 516, 590]) {
      this.addProp('hall_pillar', () => pillar(112), x - 12, HALL.WALL_TOP - 4, { depth: HALL.FLOOR_Y + 6, solid: { x: x - 10, y: HALL.FLOOR_Y - 2, w: 22, h: 8 } });
      this.addProp('hall_sconce', sconce, x - 5, 58, { depth: HALL.FLOOR_Y + 7 });
      L.addLight(x, 62, hub ? 62 : 44, 0xffb870, hub ? 0.8 : 0.25, 0.1);
    }
    this.addProp('hall_ladder', () => ladder(96), 440, HALL.WALL_TOP + 10, { depth: HALL.FLOOR_Y + 2 });
    for (const x of [270, 370]) {
      this.addProp('hall_candles', candleStand, x - 8, 112, { solid: { x: x - 5, y: 148, w: 10, h: 5 } });
      L.addLight(x, 118, 60, 0xffb870, 0.9, 0.12);
    }
    this.addProp('hall_armchair', armchair, 160, 140, { solid: true });
    this.addProp('hall_rtable', roundTable, 188, 148, { solid: true });
    L.addLight(203, 148, 40, 0xffcf70, 0.6, 0.15);
    this.addProp('hall_globe', globe, 470, 140, { solid: { x: 472, y: 158, w: 14, h: 6 } });
    this.addProp('hall_scrolls', scrollBasket, 500, 146, { solid: true });
    this.addProp('hall_scrolls2', scrollBasket, 40, 168, { solid: true });
    ([[150, 160, 1], [500, 330, 3], [40, 200, 4], [430, 380, 5], [210, 392, 6]] as const).forEach(([x, y, sd]) =>
      this.addProp(`hall_pile${sd}`, () => bookPile(sd), x, y, { solid: true }),
    );
    ([[24, 270, 41], [548, 270, 42], [24, 350, 43], [548, 350, 44]] as const).forEach(([x, y, sd]) =>
      this.addProp(`hall_stand${sd}`, () => standShelf(68, 46, sd, 0.12), x, y, { solid: { x, y: y + 40, w: 68, h: 13 } }),
    );
    ([[60, 104, 0], [578, 98, 1], [566, 128, 0]] as const).forEach(([x, y, k], i) => {
      this.addAnimProp(`hall_holo${i}`, [0, 1].map((f) => () => holoCube(k, f)), x, y, 1.5, { depth: 9050 });
      L.addLight(x + 7, y + 7, 30, k ? 0xa88aff : 0x5fe3ff, 0.5, 0.05);
    });
    const bookDone = Boolean(s.flags['pro.bookDone']);
    this.lecternH = this.addProp(bookDone ? 'hall_lectern_dead' : 'hall_lectern', () => lectern(!bookDone), 72, 184, { solid: { x: 76, y: 220, w: 24, h: 8 } });
    if (!bookDone) this.bookLight = L.addLight(88, 188, 80, 0x5fe3ff, 0.9, 0.18);
    const leafOn = bookDone && !s.flags['pro.loupeDone'];
    this.deskH = this.addProp(leafOn ? 'hall_desk_leaf' : 'hall_desk', () => desk(leafOn), 520, 180, { solid: { x: 520, y: 210, w: 76, h: 16 } });
    if (leafOn) this.leafLight = L.addLight(565, 196, 40, 0xffd36b, 0.9, 0.1);
    this.addProp('hall_chair', () => chair(), 548, 222, { solid: true });
    L.addLight(586, 186, 90, 0xffd88a, 0.85, 0.04);
    ([[180, 150, 1], [455, 160, 2], [360, 270, 3], [120, 210, 4], [500, 300, 5]] as const).forEach(([x, y, sd], i) => {
      const h = this.addProp(`hall_page${sd}`, () => floatingPage(sd), x, y, { depth: 9100 });
      this.tweens.add({ targets: h.img, y: y - 6, x: x + 3, yoyo: true, repeat: -1, duration: 2200 + i * 300, ease: 'Sine.easeInOut' });
    });
    this.add.particles(0, 0, 'px1', {
      x: { min: 0, max: HALL.W }, y: { min: 40, max: HALL.H }, lifespan: 6000, speedY: { min: -6, max: -1 }, speedX: { min: -3, max: 3 },
      alpha: { start: 0.7, end: 0 }, tint: [0x5fe3ff, 0xa88aff, 0xffffff, 0xffd36b], frequency: 140, blendMode: Phaser.BlendModes.ADD,
    }).setDepth(9320);
    this.byteLight = L.addLight(0, 0, 70, 0x5fe3ff, 0.85, 0.05);
    this.heroLight = L.addLight(0, 0, 46, 0xc8c0ff, 0.45, 0.02);
    if (hub) this.buildHub(false);
    else if (s.flags['pro.loupeDone']) this.makePortal(0, 'active', false);
    this.ambientT = hub ? 1 : 0;
  }

  private doorKey(open = false): string {
    const s = this.g.store.state;
    return `hall_door_${Math.min(3, s.cards.length)}_${open ? 'o' : 'c'}`;
  }

  override create(data: { resumeRef?: string; hubReturn?: number }): void {
    super.create(data);
    this.g.audio.ambience.set('servers');
    this.g.audio.music.play('archive', 2);
    const s = this.g.store.state;
    if (data?.hubReturn) {
      const p = PORTAL_POS[(data.hubReturn - 1) as 0 | 1 | 2];
      if (p) {
        this.setPlayerPos(p.x, p.y + 28);
        this.setDir(this.player, 'down');
        this.cameras.main.centerOn(p.x, p.y);
      }
    }
    if (data?.resumeRef) return;
    if (data?.hubReturn) {
      void this.g.runScript(`hub#afterE${data.hubReturn}`);
      return;
    }
    if (!s.flags['pro.done'] && !s.flags['pro.bookDone'] && s.checkpoint === 'start') {
      void this.g.runScript('prologue#start');
      return;
    }
    if (!s.flags['pro.done']) {
      this.g.hints.setRule(this.g.hintRules[s.flags['pro.bookDone'] ? 'pro_leaf' : 'pro_book'] ?? null);
      this.g.bus.emit('objective:changed', { text: s.flags['pro.bookDone'] ? 'Осмотри листок на столе' : 'Подойди к мерцающей книге у стены' });
    } else void this.g.runScript('hub#enter');
  }

  private buildHub(animate: boolean): void {
    if (this.hubBuilt) return;
    this.hubBuilt = true;
    const s = this.g.store.state;
    this.showcaseH = this.addProp(`hall_showcase_${s.cards.join('')}`, () => showcase(s.cards), 130, 274, { solid: { x: 132, y: 318, w: 52, h: 12 } });
    const done = s.epochDone;
    for (let i = 0; i < 3; i++) {
      const open = !done[i] && (i === 0 || Boolean(done[i - 1]));
      this.makePortal(i, open ? 'active' : done[i] ? 'done' : 'ghost', false);
    }
    if (animate) this.cameras.main.flash(300, 255, 255, 255, true);
    if (s.cards.length >= 3) this.light?.addLight(320, 90, 200, 0xffe7a0, 1, 0.04);
    else this.light?.addLight(320, 90, 170, 0xffd88a, 0.6, 0.03);
  }

  private makePortal(i: number, state: 'active' | 'ghost' | 'done', fadeIn: boolean): PropHandle {
    this.portalH[i]?.destroy();
    const pos = PORTAL_POS[i as 0 | 1 | 2];
    const x = pos.x - 36, y = pos.y - 80;
    const frames = state === 'active' ? [0, 1, 2, 3] : [0];
    const h = this.addAnimProp(`hall_portal_${i}_${state}`, frames.map((f) => () => portal(ACCENTS[i]!, state, 20 + i, f)), x, y, 5, {
      depth: pos.y + 4, solid: { x: pos.x - 26, y: pos.y - 6, w: 52, h: 10 },
    });
    this.portalH[i] = h;
    this.light?.removeLight(this.portalLights[i]);
    this.portalLights[i] = state === 'active' ? this.light!.addLight(pos.x, pos.y - 30, 130, ACCENT_NUM[i]!, 1.15, 0.08) : state === 'done' ? this.light!.addLight(pos.x, pos.y - 20, 60, ACCENT_NUM[i]!, 0.35, 0.03) : null;
    if (fadeIn) {
      h.setAlpha(0);
      this.tweens.addCounter({ from: 0, to: 1, duration: 2000, onUpdate: (tw) => h.setAlpha(tw.getValue() ?? 1) });
    }
    return h;
  }

  private hubObjective(): void {
    const s = this.g.store.state;
    const next = s.epochDone.findIndex((d) => !d);
    this.g.bus.emit('objective:changed', { text: next >= 0 ? 'Войди в портал-книгу' : 'Войди в дверь «Ядро»' });
  }

  override async call(name: string, args: Record<string, unknown> = {}): Promise<void> {
    switch (name) {
      case 'hall.dark':
        this.player.setAlpha(0);
        this.byteActor?.setAlpha(0);
        if (this.byteLight) this.byteLight.intensity = 0;
        if (this.heroLight) this.heroLight.intensity = 0;
        this.cameras.main.fadeIn(1200, 0, 0, 0);
        return;
      case 'hall.byteSpark':
        if (this.byteActor) {
          this.tweens.add({ targets: this.byteActor, alpha: 1, duration: 700 });
          if (this.byteLight) this.tweens.add({ targets: this.byteLight, intensity: 0.85, duration: 900 });
          this.g.audio.sfx.play('loupe_ping');
        }
        return;
      case 'hall.heroFadeIn':
        this.tweens.add({ targets: this.player, alpha: 1, duration: 1400 });
        if (this.heroLight) this.tweens.add({ targets: this.heroLight, intensity: 0.45, duration: 1400 });
        this.tweens.add({ targets: this, ambientT: 0.25, duration: 1400, onUpdate: () => this.applyAmbient() });
        return;
      case 'hall.bookCrumble': {
        const art = lectern(true);
        const buf = art.p.clone().blit(art.e, 0, 0).toPixelCanvas();
        this.lecternH?.destroy();
        this.g.audio.sfx.play('crumble');
        this.light?.removeLight(this.bookLight);
        this.bookLight = null;
        await crumble(this, buf, 88, 228, { ms: 1400, block: 2, wind: 40, depth: DEPTH_FX });
        this.lecternH = this.addProp('hall_lectern_dead', () => lectern(false), 72, 184);
        this.deskH?.destroy();
        this.deskH = this.addProp('hall_desk_leaf', () => desk(true), 520, 180);
        this.leafLight = this.light!.addLight(565, 196, 40, 0xffd36b, 0.9, 0.1);
        return;
      }
      case 'hall.dublerGlow': {
        const on = Boolean(args['on']);
        if (on) {
          this.dublerGlow = glow(this, 320, 70, 0xffd36b, 5, 0).setDepth(9330);
          this.tweens.add({ targets: this.dublerGlow, alpha: 0.6, duration: 600 });
        } else if (this.dublerGlow) {
          const g = this.dublerGlow;
          this.dublerGlow = null;
          this.tweens.add({ targets: g, alpha: 0, duration: 800, onComplete: () => g.destroy() });
        }
        return;
      }
      case 'hall.giveLoupe':
        this.g.store.setFlag('hasLoupe', true);
        this.g.hud.setLoupe(true);
        this.g.hud.toast('Получена Лупа правды', 'clue', 3200);
        this.g.audio.sfx.play('clue');
        return;
      case 'hall.openPortal': {
        const i = Number(args['index'] ?? 0);
        this.deskH?.destroy();
        this.deskH = this.addProp('hall_desk', () => desk(false), 520, 180);
        this.light?.removeLight(this.leafLight);
        this.leafLight = null;
        this.g.audio.sfx.play('portal');
        const pos = PORTAL_POS[i as 0 | 1 | 2];
        const art = portal(ACCENTS[i]!, 'active', 20 + i, 0);
        const buf = art.p.clone().blit(art.e, 0, 0).toPixelCanvas();
        await crumble(this, buf, pos.x, pos.y + 16, { ms: 1100, block: 2, reverse: true, depth: DEPTH_FX });
        this.makePortal(i, 'active', false);
        return;
      }
      case 'hall.toHub': {
        this.hubBuilt = true;
        const s = this.g.store.state;
        this.showcaseH = this.addProp(`hall_showcase_${s.cards.join('')}`, () => showcase(s.cards), 130, 274, { solid: { x: 132, y: 318, w: 52, h: 12 } });
        this.showcaseH.setAlpha(0);
        this.tweens.addCounter({ from: 0, to: 1, duration: 2200, onUpdate: (tw) => this.showcaseH?.setAlpha(tw.getValue() ?? 1) });
        for (const i of [1, 2]) this.makePortal(i, 'ghost', true);
        this.light?.addLight(320, 90, 170, 0xffd88a, 0.6, 0.03);
        await new Promise<void>((resolve) => {
          this.tweens.add({ targets: this, ambientT: 1, duration: 2500, onUpdate: () => this.applyAmbient(), onComplete: () => resolve() });
        });
        return;
      }
      case 'hall.hubObjective':
        this.hubObjective();
        return;
      case 'hall.openDoor':
        this.g.audio.sfx.play('door');
        this.g.store.setFlag('hub.doorOpen', true);
        this.doorH?.destroy();
        this.doorH = this.addProp(this.doorKey(true), () => coreDoor(3, true), 272, HALL.FLOOR_Y - 104, { depth: 30 });
        this.cameras.main.flash(500, 255, 244, 207, true);
        this.light?.addLight(320, 110, 220, 0xfff4cf, 1.3, 0.04);
        return;
      case 'hall.collection':
        await runCollection(this.g);
        return;
      case 'hall.enterPortal': {
        const i = Number(args['index']);
        const scene = EPOCH_SCENES[i];
        if (!scene) return;
        this.g.audio.sfx.play('portal');
        const pos = PORTAL_POS[i as 0 | 1 | 2];
        await this.perform({ t: 'moveTo', who: 'player', x: pos.x, y: pos.y + 6, speed: 60 });
        this.tweens.add({ targets: this.player, alpha: 0, y: this.player.y - 10, duration: 500 });
        const c = Phaser.Display.Color.IntegerToRGB(ACCENT_NUM[i as 0 | 1 | 2]);
        this.cameras.main.flash(250, c.r, c.g, c.b, true);
        this.cameras.main.fadeOut(700, 255, 255, 255);
        await this.g.wait(750);
        this.g.goto(scene);
        return;
      }
      case 'hall.enterCore':
        this.g.audio.sfx.play('portal');
        await this.perform({ t: 'moveTo', who: 'player', x: 320, y: 140, speed: 60 });
        this.cameras.main.fadeOut(900, 255, 244, 207);
        await this.g.wait(950);
        this.g.goto('core');
        return;
      default:
        return;
    }
  }

  private applyAmbient(): void {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(DARK), Phaser.Display.Color.ValueToColor(LIT), 100, Math.round(this.ambientT * 100));
    this.light?.setAmbient(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
  }

  override update(t: number, dt: number): void {
    super.update(t, dt);
    const b = this.byteActor;
    if (b && this.byteLight) {
      this.byteLight.x = b.x;
      this.byteLight.y = b.y + 20;
    }
    if (this.heroLight) {
      this.heroLight.x = this.player.x;
      this.heroLight.y = this.player.y - 14;
    }
  }
}

export function buildHallBackground(): Px {
  const g = hallGround();
  const c = g.p.clone();
  c.blit(g.e, 0, 0);
  return c;
}
