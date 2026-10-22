import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../../config';
import { PORTAL_POS } from '../../content/hall';
import { charFrameBuffer } from '../../gfx/Assets';
import { getCharDef } from '../../gfx/characters';
import { memPurge, memServers, memSplit, slideBirchPx, slideMetronomePx, slideVostokPx } from '../../gfx/td/art_slides';
const memoryServers = () => memServers().toCanvas();
const memoryPurge = () => memPurge().toCanvas();
const memorySplit = () => memSplit().toCanvas();
const slideBirch = () => slideBirchPx(false).toCanvas();
const slideBirchSmile = () => slideBirchPx(true).toCanvas();
const slideMetronome = () => slideMetronomePx().toCanvas();
const slideVostok = () => slideVostokPx(false).toCanvas();
import { PixelCanvas } from '../../gfx/PixelCanvas';
import { CORE, coreGround, editorRoom, keeperRoom, lightColumn, memoryPage, mergeBook, readingDesk } from '../../gfx/td/art_core';
import { armchair, banner, coreDoor, globe, hallGround, HALL, pillar, portal, roundTable, sconce, scrollBasket, serverRack } from '../../gfx/td/art_hall';
import { bookPile, standShelf } from '../../gfx/td/art_common';
import type { Dir } from '../../gfx/td/chars';
import type { EndingId } from '../../core/Save';
import { FrameOverlay, runCoreChoice, runPostCredits } from '../../ui/Endings';
import { el } from '../../ui/Ui';
import { crumble, glow } from '../Effects';
import { DEPTH_FX, WorldScene, type PropHandle } from '../WorldScene';

const COLUMN_X = CORE.CX;
const solid = (color: string): PixelCanvas => new PixelCanvas(4, 4).rect(0, 0, 4, 4, color);
const urlCache = new Map<string, string>();
const url = (key: string, make: () => { toDataURL(): string }): string => {
  let u = urlCache.get(key);
  if (!u) {
    u = make().toDataURL();
    urlCache.set(key, u);
  }
  return u;
};

export class CoreScene extends WorldScene {
  protected override worldW = CORE.W;
  protected override worldH = CORE.H;
  protected override walk = { x: 90, y: 140, w: 460, h: 170 };
  private stageObjs: Phaser.GameObjects.GameObject[] = [];
  private stageProps: PropHandle[] = [];
  private whiteVeil: Phaser.GameObjects.Rectangle | null = null;
  private column: PropHandle | null = null;
  private colGlow: Phaser.GameObjects.Image | null = null;
  private lete: Phaser.GameObjects.Container | null = null;
  private frames: FrameOverlay | null = null;
  private inset: FrameOverlay | null = null;
  private domNodes: HTMLElement[] = [];

  constructor() {
    super('core');
  }

  protected override themeKey(): 'core' {
    return 'core';
  }

  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: 170, y: 262, dir: 'side' };
  }

  protected buildWorld(): void {
    this.stageObjs = [];
    this.stageProps = [];
    this.whiteVeil = null;
    this.column = null;
    this.colGlow = null;
    this.lete = null;
    this.frames = null;
    this.inset = null;
    this.domNodes = [];
    const L = this.setupLighting(0x3a3058);
    this.stageProps.push(this.addGround('core_ground', coreGround));
    this.column = this.addAnimProp('core_col', [0, 1, 2, 3].map((f) => () => lightColumn(f)), COLUMN_X - 45, CORE.CY - 250, 6, { depth: CORE.CY + 2, solid: { x: COLUMN_X - 26, y: CORE.CY - 10, w: 52, h: 18 } });
    this.stageProps.push(this.column);
    L.addLight(COLUMN_X, CORE.CY, 300, 0xfff4cf, 1.25, 0.05);
    this.colGlow = glow(this, COLUMN_X, CORE.CY - 60, 0xfff4cf, 4, 0.3).setDepth(9330);
    this.keep(this.colGlow);
    this.tweens.add({ targets: this.colGlow, alpha: { from: 0.25, to: 0.42 }, duration: 2200, yoyo: true, repeat: -1 });
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const rx = 130 + (i % 3) * 40;
      const h = this.addProp(`core_page${i % 5}`, () => memoryPage(i % 5), COLUMN_X + Math.cos(ang) * rx, CORE.CY - 70 + Math.sin(ang) * 50, { depth: 9100 });
      this.tweens.add({ targets: h.img, y: h.img.y - 8 - (i % 4) * 3, duration: 1800 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.stageProps.push(h);
    }
    this.keep(
      this.add.particles(0, 0, 'px1', {
        x: { min: 0, max: CORE.W }, y: { min: 20, max: CORE.H }, lifespan: 5000, speedY: { min: -12, max: -3 },
        alpha: { start: 0.8, end: 0 }, tint: [0xfff4cf, 0xffd36b, 0xa88aff], frequency: 120, blendMode: Phaser.BlendModes.ADD,
      }).setDepth(9320),
    );
  }

  private keep<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.stageObjs.push(o);
    return o;
  }

  override create(data: { resumeRef?: string }): void {
    super.create(data);
    this.byteAnchor = { x: 112, y: 214 };
    this.g.audio.music.play('core', 2);
    this.g.audio.ambience.set('core');
    const named = Boolean(this.g.store.state.flags['core.named']);
    this.lete = this.makeActor('lete', 440, 262, 'lete', named ? 'side' : 'up', named);
    this.light?.addLight(440, 250, 50, 0xffd36b, 0.5, 0.1);
    if (!data?.resumeRef) void this.g.runScript('core#enter');
  }

  protected override onSceneShutdown(): void {
    this.frames?.destroy();
    this.inset?.destroy();
    this.domNodes.forEach((n) => n.remove());
    this.domNodes = [];
  }

  private tw(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve() });
    });
  }

  private pressEnter(): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
  }

  override async call(name: string, args: Record<string, unknown> = {}): Promise<void> {
    const reduced = this.g.settings.data.reducedEffects;
    switch (name) {
      case 'core.leteTurn': {
        if (this.lete) this.setDir(this.lete, 'side', true);
        this.g.audio.sfx.play('assemble');
        if (!reduced) this.cameras.main.flash(300, 255, 244, 207, true);
        await this.g.wait(700);
        return;
      }
      case 'core.memoryStart': {
        this.g.store.setFlag('core.skipMem', false);
        this.frames = new FrameOverlay(this.g, 'full');
        const skip = el('button', 'btn frame-skip', undefined, '⏩ Пропустить');
        skip.type = 'button';
        skip.addEventListener('click', () => {
          this.g.store.setFlag('core.skipMem', true);
          this.pressEnter();
          window.setTimeout(() => this.pressEnter(), 80);
        });
        this.frames.add(skip);
        return;
      }
      case 'core.memory': {
        const n = Number(args['n']);
        const caption = String(args['caption'] ?? '');
        if (this.g.store.state.flags['core.skipMem']) return;
        const make = n === 1 ? memoryServers : n === 2 ? memoryPurge : memorySplit;
        this.g.audio.sfx.play('glitch');
        this.frames?.show(url(`mem${n}`, make), caption);
        await this.g.wait(700);
        return;
      }
      case 'core.memoryEnd': {
        this.frames?.destroy();
        this.frames = null;
        this.g.store.setFlag('core.skipMem', false);
        if (!reduced) this.cameras.main.flash(400, 255, 244, 207, true);
        return;
      }
      case 'core.insert': {
        const kind = String(args['kind']);
        if (kind === 'none') {
          this.inset?.destroy();
          this.inset = null;
          return;
        }
        if (!this.inset) this.inset = new FrameOverlay(this.g, 'inset');
        const pick = {
          birch: [() => slideBirch(), 'Грамота'],
          diary: [() => slideMetronome(), 'Дневник'],
          journal: [() => slideVostok(), 'Журнал'],
        }[kind] as [() => { toDataURL(): string }, string];
        this.inset.show(url(`ins_${kind}`, pick[0]), pick[1]);
        return;
      }
      case 'core.finalChoice': {
        const res = await runCoreChoice(this.g);
        this.g.store.setFlag('core.ending', res);
        return;
      }
      case 'core.keeperErase':
        await this.keeperErase();
        return;
      case 'core.mergeHands':
        await this.mergeHands();
        return;
      case 'core.editorWhite':
        await this.editorWhite();
        return;
      case 'core.montage':
        await this.montage(String(args['kind']) as 'keeper' | 'merge' | 'editor');
        return;
      case 'core.lastScene':
        await this.lastScene(String(args['kind']) as 'keeper' | 'merge' | 'editor');
        return;
      case 'core.finish':
        await this.finish(String(args['ending']) as EndingId);
        return;
      default:
        return;
    }
  }


  private async keeperErase(): Promise<void> {
    const reduced = this.g.settings.data.reducedEffects;
    const l = this.lete;
    if (l) {
      this.actors.delete('lete');
      this.lete = null;
      l.setVisible(false);
      this.g.audio.sfx.play('crumble');
      if (!reduced) await crumble(this, charFrameBuffer(getCharDef('lete')!, 'idle_0', 'lete', 'side'), l.x, l.y, { flipX: true, ms: 3200, depth: DEPTH_FX });
      l.destroy();
    }
    this.tweens.addCounter({ from: 1, to: 0, duration: 2200, onUpdate: (tw) => this.column?.setAlpha(tw.getValue() ?? 0) });
    await this.tw({ targets: this.colGlow, alpha: 0, duration: 2200 });
    if (this.light) this.light.lights.forEach((l) => this.tweens.add({ targets: l, intensity: 0.2, duration: 1500 }));
    await this.g.wait(600);
  }


  private async mergeHands(): Promise<void> {
    const reduced = this.g.settings.data.reducedEffects;
    const lete = this.lete;
    if (lete) {
      this.setAnim(this.player, 'walk');
      this.setAnim(lete, 'walk');
      await Promise.all([
        this.tw({ targets: this.player, x: COLUMN_X - 16, y: CORE.CY + 40, duration: 1100 }),
        this.tw({ targets: lete, x: COLUMN_X + 16, y: CORE.CY + 40, duration: 1100 }),
      ]);
      this.setDir(this.player, 'side', false);
      this.setDir(lete, 'side', true);
      this.setAnim(this.player, 'idle');
      this.setAnim(lete, 'idle');
    }
    this.g.audio.sfx.play('portal');
    const aura = this.keep(glow(this, COLUMN_X, CORE.CY + 24, 0xfff4cf, 0.4, 0.7).setDepth(9330));
    await Promise.all([
      this.tw({ targets: aura, scale: 2.4, alpha: 0.5, duration: 1600 }),
      this.tw({ targets: this.colGlow, alpha: 0.8, scale: 5, duration: 1600 }),
    ]);
    if (!reduced) this.cameras.main.flash(500, 255, 244, 207, true);
  }


  private async editorWhite(): Promise<void> {
    this.whiteVeil = this.keep(this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, 0xffffff).setAlpha(0).setScrollFactor(0).setDepth(9600));
    this.g.audio.sfx.play('page');
    await Promise.all([
      this.tw({ targets: this.whiteVeil, alpha: 0.85, duration: 3200 }),
      this.tw({ targets: this.colGlow, alpha: 0.2, duration: 3200 }),
    ]);
  }


  private async montage(kind: 'keeper' | 'merge' | 'editor'): Promise<void> {
    const reduced = this.g.settings.data.reducedEffects;
    if (kind === 'keeper') {
      const f = new FrameOverlay(this.g, 'full');
      const seq: [string, () => { toDataURL(): string }, string][] = [
        ['k_birch', () => slideBirch(), 'Грамота Онфима'],
        ['k_diary', () => slideMetronome(), 'Тетрадь Зины'],
        ['k_journal', () => slideVostok(), 'Журнал Байконура'],
      ];
      for (const [key, make, cap] of seq) {
        f.show(url(key, make), cap, 'fx-cold');
        await this.g.wait(1700);
      }
      f.show(url('k_white', () => solid('#dfe6ee')), 'Нет милосердия, только факты', 'fx-cold');
      await this.g.wait(2600);
      f.destroy();
      return;
    }
    if (kind === 'merge') {
      this.g.audio.sfx.play('portal');
      if (!reduced) this.cameras.main.flash(700, 255, 244, 207, true);
      if (this.lete) {
        const l = this.lete;
        this.lete = null;
        this.actors.delete('lete');
        await this.tw({ targets: l, alpha: 0, duration: 900 });
        l.destroy();
      }
      const f = new FrameOverlay(this.g, 'full');
      const paper = el('div', 'frame-paper', undefined, 'Завтра будет завтра');
      el('small', '', paper, 'Тетрадь Зины');
      f.show(url('m_blank', () => solid('#2a2018')), '');
      f.add(paper);
      await this.g.wait(2400);
      paper.remove();
      f.show(url('m_smile', () => slideBirchSmile()), 'Всадник Онфима улыбается');
      await this.g.wait(2400);
      f.show(url('m_vostok', () => slideVostok()), '');
      const radio = el('div', 'frame-radio', undefined, 'Поехали!');
      f.add(radio);
      this.g.audio.sfx.play('radio_click');
      await this.g.wait(2600);
      f.destroy();
      return;
    }
    const forget = this.track(el('div', 'frame-forget', this.g.ui.layers.hud));
    forget.style.background = 'transparent';
    forget.style.top = '-18cqh';
    el('div', 'frame-label', forget, 'Имя мальчика с грамотой:');
    el('div', 'frame-cursor', forget);
    await this.g.wait(4600);
    forget.remove();
  }

  private track<T extends HTMLElement>(n: T): T {
    this.domNodes.push(n);
    return n;
  }


  private async lastScene(kind: 'keeper' | 'merge' | 'editor'): Promise<void> {
    const cam = this.cameras.main;
    cam.fadeOut(900, kind === 'keeper' ? 223 : 255, kind === 'keeper' ? 230 : 255, kind === 'keeper' ? 238 : 255);
    await this.g.wait(1000);
    this.stageObjs.forEach((o) => o.destroy());
    this.stageObjs = [];
    this.stageProps.forEach((h) => h.destroy());
    this.stageProps = [];
    this.whiteVeil = null;
    this.column = null;
    this.colGlow = null;
    if (this.light) this.light.lights.length = 0;
    if (this.lete) {
      this.lete.destroy();
      this.actors.delete('lete');
      this.lete = null;
    }
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, 640, 430);
    this.solids = [];
    this.walk = { x: 0, y: 0, w: 640, h: 430 };
    if (kind === 'keeper') {
      this.light?.setAmbient(0xd8e0ec);
      this.stageProps.push(this.addGround('end_keeper_room', keeperRoom));
      this.stageProps.push(this.addProp('end_rdesk', readingDesk, 265, 210));
      this.player.setPosition(320, 206);
      this.setDir(this.player, 'down');
      this.byteAnchor = { x: 270, y: 170 };
      this.cameras.main.centerOn(320, 180);
      this.g.audio.ambience.set(null);
    } else if (kind === 'editor') {
      this.light?.setAmbient(0xffffff);
      this.stageProps.push(this.addGround('end_editor_room', editorRoom));
      this.keep(glow(this, 320, 54, 0xffd36b, 3, 0.3).setDepth(9330));
      this.keep(this.add.text(320, 54, 'ВСЁ ХОРОШО', { fontFamily: '"Press Start 2P", monospace', fontSize: '20px', color: '#e0b030' }).setOrigin(0.5).setStroke('#a87c10', 2).setDepth(9331));
      this.player.setPosition(320, 250);
      this.setDir(this.player, 'up');
      this.byteAnchor = { x: 280, y: 214 };
      this.cameras.main.centerOn(320, 180);
      this.g.audio.ambience.set(null);
    } else {
      this.light?.setAmbient(0x9a8a9a);
      const P = this.stageProps, L = this.light;
      P.push(this.addGround('hall_ground', hallGround));
      P.push(this.addAnimProp('hall_rack_l', [0, 1].map((k) => () => serverRack(38, 100, 11 + k * 7)), 4, HALL.WALL_TOP + 6, 2.5, { depth: 20 }));
      P.push(this.addAnimProp('hall_rack_r', [0, 1].map((k) => () => serverRack(38, 100, 12 + k * 9)), 598, HALL.WALL_TOP + 6, 3, { depth: 20 }));
      P.push(this.addProp('end_core_door', () => coreDoor(3, true), 272, HALL.FLOOR_Y - 104, { depth: 30 }));
      P.push(this.addProp('hall_banner0', () => banner(0), 215, HALL.WALL_TOP + 12, { depth: 25 }));
      P.push(this.addProp('hall_banner1', () => banner(1), 345, HALL.WALL_TOP + 12, { depth: 25 }));
      for (const x of [32, 108, 252, 370, 516, 590]) {
        P.push(this.addProp('hall_pillar', () => pillar(112), x - 12, HALL.WALL_TOP - 4, { depth: HALL.FLOOR_Y + 6 }));
        P.push(this.addProp('hall_sconce', sconce, x - 5, 58, { depth: HALL.FLOOR_Y + 7 }));
        L?.addLight(x, 62, 54, 0xffb870, 0.8, 0.1);
      }
      P.push(this.addProp('hall_armchair', armchair, 160, 140));
      P.push(this.addProp('hall_rtable', roundTable, 188, 148));
      P.push(this.addProp('hall_globe', globe, 470, 140));
      P.push(this.addProp('hall_scrolls', scrollBasket, 500, 146));
      ([[24, 270, 41], [548, 270, 42], [24, 350, 43], [548, 350, 44]] as const).forEach(([x, y, sd]) => P.push(this.addProp(`hall_stand${sd}`, () => standShelf(68, 46, sd, 0.12), x, y)));
      ([[150, 160, 1], [500, 330, 3], [40, 200, 4], [430, 380, 5]] as const).forEach(([x, y, sd]) => P.push(this.addProp(`hall_pile${sd}`, () => bookPile(sd), x, y)));
      const accents = ['#ffb347', '#9fb4c8', '#7dffb0'] as const;
      ([0, 1, 2] as const).forEach((i) => {
        const pos = PORTAL_POS[i];
        P.push(this.addAnimProp(`end_book_${i}`, [0, 1, 2, 3].map((f) => () => portal(accents[i], 'active', 20 + i, f)), pos.x - 36, pos.y - 80, 5, { depth: pos.y + 4 }));
        L?.addLight(pos.x, pos.y - 30, 120, [0xffb347, 0x9fb4c8, 0x7dffb0][i]!, 1.1, 0.08);
      });
      P.push(this.addProp('end_merge_book', mergeBook, 288, 286));
      L?.addLight(320, 300, 130, 0xfff4cf, 1.4, 0.06);
      L?.addLight(320, 120, 220, 0xffd89a, 0.9, 0.04);
      this.keep(glow(this, 320, 300, 0xfff4cf, 1.6, 0.35).setDepth(9330));
      this.keep(
        this.add.particles(0, 0, 'px1', {
          x: { min: 120, max: 520 }, y: { min: 120, max: 400 }, lifespan: 4500, speedY: { min: -10, max: -3 }, speedX: { min: -3, max: 3 },
          alpha: { start: 0.7, end: 0 }, tint: [0xfff4cf, 0xffd36b], frequency: 90, blendMode: Phaser.BlendModes.ADD,
        }).setDepth(9320),
      );
      this.keep(this.add.text(320, 266, 'Помнить и прощать', { fontFamily: 'Caveat, sans-serif', fontSize: '22px', color: '#fff4cf' }).setOrigin(0.5).setStroke('#6a4a1c', 3).setDepth(9331));
      this.player.setPosition(250, 320);
      this.setDir(this.player, 'side', false);
      this.byteAnchor = { x: 226, y: 290 };
      this.cameras.main.centerOn(320, 230);
      this.g.audio.ambience.set('servers');
    }
    cam.fadeIn(1400, 255, 255, 255);
    await this.g.wait(kind === 'merge' ? 6500 : kind === 'keeper' ? 7500 : 6500);
  }


  private async finish(ending: EndingId): Promise<void> {
    this.g.save.markEnding(ending);
    this.g.store.apply({ byteSilent: false });
    this.g.bus.emit('ending:reached', { ending });
    this.g.checkpoint('core.end');
    this.g.audio.sfx.play('page');
    const res = await runPostCredits(this.g, ending);
    this.g.audio.music.stop(1);
    this.g.stopScripts();
    if (res === 'again') this.g.startNewGame();
    else this.g.goto('title');
  }
}
