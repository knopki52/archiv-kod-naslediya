import Phaser from 'phaser';
import {
  BAKERY_INTERACTABLES, BAKERY_TRIGGERS, e1Stage, HOUSE_INTERACTABLES, SQUARE, SQUARE_INTERACTABLES, SQUARE_TRIGGERS,
  WORKSHOP_INTERACTABLES, WORKSHOP_TRIGGERS,
} from '../../content/epoch1';
import type { Interactable } from '../../content/types';
import { charFrameBuffer, ensureTexture } from '../../gfx/Assets';
import { getCharDef, registerCharDef, villager } from '../../gfx/characters';
import type { Dir } from '../../gfx/td/chars';
import {
  bakeryOven, barrel, bench, birchBarkRolls, breadRack, chest, churchDome, cradle, crow, dog, fence, firewood, flourSacks, hay,
  iconCorner, izba, logsPile, loom, micaWindow, NOVSQ, novRoom, novSquareGround, oilLamp, plankTable, potShelf, ROOM,
  russianStove, scrollRack, sledge, snowShadow, spruce, stall, waxTablets, well, rushnyk, herbs, tub, spinningWheel, broom,
  cat,
} from '../../gfx/td/art_nov';
import { portal } from '../../gfx/td/art_hall';
import { icePatch, rocks, snowMound, streetLantern } from '../../gfx/td/art_extra';
import { Px, type Pt } from '../../gfx/td/px';
import { crumble, embers, glow, snow } from '../Effects';
import { DEPTH_FX, WorldScene, type PropHandle, type TriggerZone } from '../WorldScene';

abstract class NovBase extends WorldScene {
  protected abstract indoor: boolean;

  protected override themeKey(): 'nov' {
    return 'nov';
  }
  protected override playerChar(): string {
    return 'player_nov';
  }
  protected override stepSound(): 'step_snow' | 'step_wood' {
    return this.indoor ? 'step_wood' : 'step_snow';
  }

  protected applyStage(): void {
    const st = e1Stage(this.g.store.state);
    this.g.bus.emit('objective:changed', { text: st.objective });
    this.g.hints.setRule(st.rule === 'none' ? null : (this.g.hintRules[st.rule] ?? null));
  }

  override async call(name: string, args: Record<string, unknown> = {}): Promise<void> {
    if (name === 'nov.objectiveByStage') {
      this.applyStage();
      return;
    }
    await this.novCall(name, args);
  }

  protected async novCall(_name: string, _args: Record<string, unknown>): Promise<void> {}

  protected afterCreate(data: { resumeRef?: string }, entry?: string): void {
    this.g.audio.music.play('nov', 2);
    this.g.audio.ambience.set(this.indoor ? 'nov_room' : 'wind_snow');
    if (data?.resumeRef) return;
    if (entry) {
      void this.g.runScript(entry);
      return;
    }
    this.applyStage();
  }

  protected runTo(actor: Phaser.GameObjects.Container, x: number, y: number, speed: number): Promise<void> {
    const id = [...this.actors.entries()].find(([, a]) => a === actor)?.[0] ?? '';
    return this.perform({ t: 'moveTo', who: id, x, y, speed }).then(() => undefined);
  }
}


const FOOT_LIMIT = 140;
const FROZEN_TINT = 0x8f95a8;
const PATHS: Pt[][] = [
  [[0, 238], [180, 226], [360, 232], [560, 228], [760, 236], [960, 228], [1280, 236]],
  [[SQUARE.house, 186], [SQUARE.house, 270]],
  [[SQUARE.bakery, 186], [SQUARE.bakery, 270]],
  [[SQUARE.workshop, 186], [SQUARE.workshop, 270]],
  [[SQUARE.well - 30, 236], [SQUARE.well, 222], [SQUARE.well + 30, 236]],
  [[200, 298], [160, 360], [120, 420]],
  [[1000, 298], [1060, 360], [1100, 420]],
];

export class NovSquare extends NovBase {
  protected override worldW = NOVSQ.W;
  protected override worldH = NOVSQ.H;
  protected override walk = { x: 8, y: NOVSQ.BASE + 6, w: NOVSQ.W - 16, h: NOVSQ.H - NOVSQ.BASE - 12 };
  protected indoor = false;
  private feet: Phaser.GameObjects.Image[] = [];
  private lastPrint = new Map<string, { x: number; y: number }>();
  private guestHome = { x: SQUARE.well + 38, y: 222 };
  private crowd: string[] = [];
  private workshopH: PropHandle | null = null;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

  constructor() {
    super('nov_square');
  }
  protected override interactableDefs(): Interactable[] {
    return SQUARE_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return SQUARE_TRIGGERS;
  }
  protected override spawnPoint(from?: string): { x: number; y: number; dir?: Dir; flip?: boolean } {
    switch (from) {
      case 'house': return { x: SQUARE.house, y: 196, dir: 'down' };
      case 'bakery': return { x: SQUARE.bakery, y: 196, dir: 'down' };
      case 'workshop': return { x: SQUARE.workshop, y: 196, dir: 'down' };
      default: return { x: 96, y: 236, dir: 'side' };
    }
  }

  protected buildWorld(): void {
    this.feet = [];
    this.lastPrint.clear();
    this.crowd = [];
    this.emitters = [];
    const s = this.g.store.state;
    const lit = Boolean(s.flags['e1.workshopOpen']);
    const L = this.setupLighting(0xe0e6fa);
    this.addGround('nov_sq_ground', () => novSquareGround(PATHS));
    const houses: [number, number, number, Parameters<typeof izba>[2], string][] = [
      [-30, 150, 3, { windows: [0.25, 0.75], smoke: true }, 'a'],
      [SQUARE.house - 75, 150, 21, { windows: [0.22, 0.78], smoke: true, wood: '#7a5434' }, 'house'],
      [548, 136, 13, { windows: [0.25, 0.75], smoke: true, wood: '#735032', roofBack: 22 }, 'c'],
      [SQUARE.bakery - 88, 176, 4, { smoke: true, doorGlow: true, windows: [0.2, 0.8], wood: '#80583a', roofBack: 40, sign: 'bread' }, 'bakery'],
      [SQUARE.workshop - 80, 160, 6, { windows: [0.28, 0.74], wood: '#6e4c30', roofBack: 34, sign: 'scroll', dark: !lit }, lit ? 'workshop_lit' : 'workshop'],
      [1230, 150, 9, { windows: [0.3], smoke: true }, 'b'],
    ];
    const smokes: Pt[] = [];
    for (const [x, w, sd, o, id] of houses) {
      const art = izba(w, sd, o);
      const y = NOVSQ.BASE - art.base;
      const h = this.addProp(`nov_izba_${id}`, () => art, x - 7, y, { depth: NOVSQ.BASE - 2, solid: { x: x - 2, y: NOVSQ.BASE - 18, w: w + 4, h: 16 } });
      if (id.startsWith('workshop')) this.workshopH = h;
      if (art.smokeAt) smokes.push([x - 7 + art.smokeAt[0], y + art.smokeAt[1]]);
      if (!o?.dark) for (const [wx, wy] of art.winAt.slice(1)) L.addLight(x - 7 + wx, y + wy + 24, 50, 0xffa040, 0.6, 0.06);
      if (o?.doorGlow) L.addLight(x + w / 2, NOVSQ.BASE + 6, 56, 0xff9a40, 0.75, 0.12);
    }
    this.addGroundShadows();
    this.addProp('nov_church', churchDome, 430, 4, { depth: 40 });
    this.addProp('nov_fence1', () => fence(56), 380, NOVSQ.BASE - 22, { depth: NOVSQ.BASE - 1, solid: { x: 380, y: NOVSQ.BASE - 6, w: 56, h: 6 } });
    this.addProp('nov_fence2', () => fence(70), 960, NOVSQ.BASE - 22, { depth: NOVSQ.BASE - 1, solid: { x: 960, y: NOVSQ.BASE - 6, w: 70, h: 6 } });
    this.addProp('nov_fence3', () => fence(42), 1186, NOVSQ.BASE - 22, { depth: NOVSQ.BASE - 1 });
    this.addProp('nov_well', well, SQUARE.well - 32, 120, { depth: 214, solid: { x: SQUARE.well - 18, y: 198, w: 38, h: 16 } });
    this.addProp('nov_stall', stall, SQUARE.stall - 42, 196, { depth: 252, solid: { x: SQUARE.stall - 40, y: 240, w: 80, h: 12 } });
    ([[488, 236, '#6a4a30'], [500, 244, '#7a5434'], [384, 240, '#5a4030']] as const).forEach(([x, y, c], i) => this.addProp(`nov_barrel${i}`, () => barrel(c), x, y, { solid: true }));
    this.addProp('nov_hay', hay, 720, 196, { solid: true });
    this.addProp('nov_bark', birchBarkRolls, 700, 194, { solid: true });
    this.addProp('nov_wood', firewood, SQUARE.bakery - 70, NOVSQ.BASE - 16, { depth: NOVSQ.BASE + 4 });
    this.addProp('nov_sledge', sledge, 360, 310, { solid: { x: 362, y: 336, w: 44, h: 8 } });
    ([[-14, 300, 90, 4], [1180, 300, 104, 5], [600, 330, 76, 7], [880, 320, 66, 8], [40, 168, 64, 9], [1240, 160, 70, 3]] as const).forEach(([x, y, h, sd], i) =>
      this.addProp(`nov_spruce${i}`, () => spruce(h, sd), x, y, { solid: { x: x + h * 0.31 - 5, y: y + h - 4, w: 10, h: 6 } }),
    );
    ([[40, 40, 0], [360, 30, 1], [980, 50, 0], [1100, 26, 1]] as const).forEach(([x, y, f], i) => {
      const h = this.addProp(`nov_crow${i}`, () => crow(f), x, y, { depth: 60 });
      this.tweens.add({ targets: h.img, y: y - 1, yoyo: true, repeat: -1, duration: 700 + i * 120, delay: i * 300 });
    });
    const dg = this.addAnimProp('nov_dog', [() => dog(0), () => dog(1)], SQUARE.bakery - 120, 222, 3);
    void dg;
    ([[10, 392, 70, 22], [150, 380, 54, 18], [300, 396, 62, 20], [520, 400, 80, 22], [740, 384, 58, 18], [930, 396, 72, 22], [1090, 380, 60, 20], [1200, 398, 70, 22], [420, 250, 44, 14], [1040, 262, 50, 16], [580, 196, 40, 12]] as const)
      .forEach(([x, y, w, h], i) => this.addProp(`nov_mound${i}`, () => snowMound(w, h, 40 + i), x, y, { depth: y + h - 4 }));
    ([[610, 330, 44, 20], [220, 352, 34, 16], [1000, 340, 40, 18]] as const).forEach(([x, y, w, h], i) => this.addProp(`nov_ice${i}`, () => icePatch(w, h, 7 + i), x, y, { depth: 4 }));
    ([[260, 330, 6], [820, 330, 7], [1100, 330, 8]] as const).forEach(([x, y], i) => {
      this.addProp(`nov_stone${i}`, () => rocks(21 + i, '#9aa4b8'), x, y, { solid: true });
    });
    ([[SQUARE.house + 66, 232], [SQUARE.workshop - 60, 232], [SQUARE.bakery + 66, 232], [60, 232], [1180, 232]] as const).forEach(([x, y], i) => {
      this.addProp(`nov_lantern${i}`, () => streetLantern(46, true), x - 10, y - 40, { depth: y + 6, solid: { x: x - 3, y: y + 2, w: 6, h: 4 } });
      L.addLight(x, y - 28, 74, 0xffb860, 0.8, 0.14);
    });
    for (const [cx, cy] of smokes) {
      this.emitters.push(
        this.add.particles(cx, cy, 'puff', {
          lifespan: 4200, speedY: { min: -16, max: -9 }, speedX: { min: 5, max: 12 },
          scale: { start: 0.5, end: 2.2 }, alpha: { start: 0.45, end: 0 }, tint: 0xc0c8d6, frequency: 700,
        }).setDepth(60),
      );
    }
    this.emitters.push(...snow(this, { width: NOVSQ.W, height: NOVSQ.H, wind: 8 }));
    this.spawnWalkers();
    if (s.flags['e1.onfimMet'] && !s.flags['e1.guestDone'] && s.flags['e1.started'] && s.flags['stage.finale'] !== true) this.placeGuest();
    if (s.flags['e1.guestDone'] && !s.flags['e1.minigameDone']) this.spawnOnfim(SQUARE.house + 54, 214);
  }

  private addGroundShadows(): void {
    ensureTexture(this, 'nov_sq_shadows', () => {
      const A = new Px(NOVSQ.W, NOVSQ.H);
      for (const [x, w] of [[-30, 150], [548, 136], [SQUARE.house - 75, 150], [SQUARE.bakery - 88, 176], [SQUARE.workshop - 80, 160], [1230, 150]] as const) snowShadow(A, x - 2, NOVSQ.BASE - 1, w + 6, 10, 0.36);
      snowShadow(A, SQUARE.well - 20, 214, 44, 7, 0.32);
      snowShadow(A, SQUARE.stall - 44, 252, 88, 8, 0.32);
      snowShadow(A, 360, 342, 48, 5, 0.3);
      return A;
    });
    this.add.image(0, 0, 'nov_sq_shadows').setOrigin(0).setDepth(1);
  }

  private placeGuest(): void {
    if (this.actors.has('guest')) return;
    this.makeActor('guest', this.guestHome.x, this.guestHome.y, 'guest', 'side', true);
  }

  private spawnOnfim(x: number, y: number): Phaser.GameObjects.Container {
    return this.makeActor('onfim', x, y, 'onfim', 'side', true);
  }

  private spawnWalkers(): void {
    const defs = [
      { id: 'vil_a', seed: 11, x0: 160, x1: 470, y: 284 },
      { id: 'vil_b', seed: 12, x0: 720, x1: 1010, y: 290 },
      { id: 'vil_c', seed: 13, x0: 500, x1: 590, y: 236 },
      { id: 'vil_d', seed: 14, x0: 940, x1: 1180, y: 240 },
    ];
    for (const d of defs) {
      registerCharDef(`nov_${d.id}`, villager(d.seed, 'nov'));
      const a = this.makeActor(d.id, d.x0, d.y, `nov_${d.id}`, 'side', false);
      a.setData('ghost', true);
      this.setAnim(a, 'walk');
      this.tweens.add({
        targets: a, x: d.x1, duration: (d.x1 - d.x0) * 55, yoyo: true, repeat: -1, hold: 1200, repeatDelay: 1200, ease: 'Sine.easeInOut',
        onYoyo: () => this.setDir(a, 'side', true),
        onRepeat: () => this.setDir(a, 'side', false),
      });
    }
  }

  override create(data: { resumeRef?: string; from?: string; stage?: string }): void {
    super.create(data);
    const s = this.g.store.state;
    if (data?.stage === 'finale' && !data.resumeRef) {
      this.afterCreate(data, 'epoch1#finale');
      return;
    }
    if (!s.flags['e1.started'] && !data?.resumeRef) {
      this.afterCreate(data, 'epoch1#start');
      return;
    }
    this.afterCreate(data);
  }

  override update(t: number, dt: number): void {
    super.update(t, dt);
    this.footprints();
  }

  private footprints(): void {
    ensureTexture(this, 'foot', () => new Px(3, 2).rect(0, 0, 3, 2, '#7f94b8').set(0, 0, '#9aaccc'));
    for (const [id, a] of this.actors) {
      if (id === 'guest' || id === 'dubler' || !a.visible) continue;
      const last = this.lastPrint.get(id);
      if (!last) {
        this.lastPrint.set(id, { x: a.x, y: a.y });
        continue;
      }
      if (Math.hypot(a.x - last.x, a.y - last.y) < 7) continue;
      const side = (this.lastPrint.size + Math.round(a.x + a.y)) % 2 ? 2 : -2;
      const dir = a.getData('dir') as string;
      const ox = dir === 'side' ? 0 : side, oy = dir === 'side' ? side * 0.5 : 0;
      this.lastPrint.set(id, { x: a.x, y: a.y });
      const f = this.add.image(a.x + ox, a.y - 1 + oy, 'foot').setDepth(2).setAlpha(0.85);
      this.feet.push(f);
      this.tweens.add({ targets: f, alpha: 0, duration: 22000, onComplete: () => f.destroy() });
      if (this.feet.length > FOOT_LIMIT) this.feet.shift()?.destroy();
    }
  }

  protected override async novCall(name: string, args: Record<string, unknown>): Promise<void> {
    switch (name) {
      case 'nov.arrive': {
        const art = portal('#ffb347', 'active', 3, 0);
        const p = this.addProp('nov_arrive_portal', () => art, 60, 160, { depth: 236 });
        const aura = glow(this, 96, 200, 0xffb347, 2.4, 0).setDepth(9330);
        const lt = this.light?.addLight(96, 210, 120, 0xffb347, 0, 0.1);
        p.setAlpha(0);
        this.player.setAlpha(0);
        this.g.audio.sfx.play('portal');
        this.tweens.addCounter({ from: 0, to: 1, duration: 600, onUpdate: (tw) => { const v = tw.getValue() ?? 1; p.setAlpha(v); aura.setAlpha(v * 0.6); if (lt) lt.intensity = v; } });
        await this.g.wait(500);
        this.tweens.add({ targets: this.player, alpha: 1, duration: 900 });
        await this.g.wait(1100);
        this.tweens.addCounter({ from: 1, to: 0, duration: 1200, onUpdate: (tw) => { const v = tw.getValue() ?? 0; p.setAlpha(v); aura.setAlpha(v * 0.6); if (lt) lt.intensity = v; }, onComplete: () => { p.destroy(); aura.destroy(); this.light?.removeLight(lt); } });
        return;
      }
      case 'nov.onfimRuns': {
        const o = this.spawnOnfim(SQUARE.house, 190);
        await this.runTo(o, this.player.x + 30, this.player.y, 95);
        this.faceTo(o, this.player.x, this.player.y);
        this.faceTo(this.player, o.x, o.y);
        return;
      }
      case 'nov.guestSpawn':
        this.placeGuest();
        return;
      case 'nov.onfimToHouse': {
        const o = this.actors.get('onfim');
        if (!o) return;
        void this.runTo(o, SQUARE.house, 190, 90).then(() => {
          this.actors.delete('onfim');
          this.tweens.add({ targets: o, alpha: 0, duration: 250, onComplete: () => o.destroy() });
        });
        return;
      }
      case 'nov.onfimAtDoor':
        if (!this.actors.has('onfim')) {
          const o = this.spawnOnfim(SQUARE.house, 190);
          o.setAlpha(0);
          this.tweens.add({ targets: o, alpha: 1, duration: 300 });
          void this.runTo(o, SQUARE.house + 54, 214, 60);
        }
        return;
      case 'nov.guestApproach': {
        const g = this.actors.get('guest');
        if (!g) return;
        await this.runTo(g, this.player.x + (this.player.x < g.x ? 28 : -28), this.player.y, 48);
        this.faceTo(g, this.player.x, this.player.y);
        this.faceTo(this.player, g.x, g.y);
        return;
      }
      case 'nov.guestReturn': {
        const g = this.actors.get('guest');
        if (!g) return;
        void this.runTo(g, this.guestHome.x, this.guestHome.y, 40).then(() => this.setDir(g, 'side', true));
        return;
      }
      case 'nov.workshopLight': {
        if (this.workshopH && !this.workshopH.img.texture.key.includes('lit')) {
          const old = this.workshopH;
          const w = 160;
          const art = izba(w, 6, { windows: [0.28, 0.74], wood: '#6e4c30', roofBack: 34, sign: 'scroll' });
          const x = SQUARE.workshop - 80;
          this.workshopH = this.addProp('nov_izba_workshop_lit', () => art, x - 7, NOVSQ.BASE - art.base, { depth: NOVSQ.BASE - 2 });
          this.workshopH.setAlpha(0);
          this.tweens.addCounter({ from: 0, to: 1, duration: 800, onUpdate: (tw) => this.workshopH?.setAlpha(tw.getValue() ?? 1), onComplete: () => old.destroy() });
          for (const [wx, wy] of art.winAt.slice(1)) this.light?.addLight(x - 7 + wx, NOVSQ.BASE - art.base + wy + 24, 50, 0xffa040, 0.6, 0.06);
          this.g.audio.sfx.play('door');
        }
        return;
      }
      case 'nov.finaleSetup':
        this.setupFinale(Boolean(args['resume']));
        return;
      case 'nov.dublerAppear':
        await this.dublerAppear();
        return;
      case 'nov.dublerLeave':
        await this.dublerLeave();
        return;
      case 'nov.beautify':
        this.beautify();
        return;
      default:
    }
  }

  private setupFinale(resume: boolean): void {
    this.g.store.setFlag('stage.finale', true);
    this.g.hud.setObjective(null);
    this.g.hints.setRule(null);
    for (const id of ['vil_a', 'vil_b', 'vil_c', 'vil_d']) {
      const a = this.actors.get(id);
      if (a) {
        this.tweens.killTweensOf(a);
        a.destroy();
        this.actors.delete(id);
      }
    }
    for (const id of ['guest', 'onfim']) {
      this.actors.get(id)?.destroy();
      this.actors.delete(id);
    }
    const W = SQUARE.well;
    this.player.setPosition(W - 74, 240);
    this.setDir(this.player, 'side', false);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(W, 230, 700, 'Sine.easeInOut');
    this.makeActor('onfim', W - 44, 246, 'onfim', 'side', false);
    this.makeActor('nastasya', W - 104, 230, 'nastasya', 'side', false);
    const spots: [number, number, number][] = [
      [W - 140, 248, 21], [W + 96, 236, 22], [W + 124, 252, 23], [W + 70, 262, 24], [W - 10, 266, 25], [W + 150, 232, 26], [W - 70, 268, 27],
    ];
    spots.forEach(([x, y, seed], i) => {
      const key = `nov_f${i}`;
      registerCharDef(key, villager(seed, 'nov'));
      const a = this.makeActor(key, x, y, key);
      this.faceTo(a, W + 38, 222);
      this.crowd.push(key);
    });
    this.makeActor(resume ? 'dubler' : 'guest', this.guestHome.x, this.guestHome.y, resume ? 'dubler' : 'guest', 'side', true);
  }

  private freezeCrowd(on: boolean): void {
    for (const id of [...this.crowd, 'nastasya', 'onfim']) {
      const sp = this.actors.get(id)?.getData('sprite') as Phaser.GameObjects.Sprite | undefined;
      if (!sp) continue;
      if (on) sp.setTint(FROZEN_TINT).anims.pause();
      else sp.clearTint().anims.resume();
    }
  }

  private async dublerAppear(): Promise<void> {
    const reduced = this.g.settings.data.reducedEffects;
    const d = this.makeActor('dubler', this.guestHome.x, this.guestHome.y, 'dubler', 'side', true);
    d.setAlpha(0);
    this.freezeCrowd(true);
    this.g.audio.sfx.play('glitch');
    this.cameras.main.flash(250, 255, 211, 107, true);
    if (!reduced) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 900, reverse: true, depth: DEPTH_FX });
    d.setAlpha(1);
    glow(this, d.x, d.y - 18, 0xffd36b, 1.8, 0.3).setDepth(9330);
    this.light?.addLight(d.x, d.y - 10, 70, 0xffd36b, 0.8, 0.15);
  }

  private async dublerLeave(): Promise<void> {
    const d = this.actors.get('dubler');
    this.freezeCrowd(false);
    if (!d) return;
    this.actors.delete('dubler');
    d.setVisible(false);
    if (!this.g.settings.data.reducedEffects) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 1100, depth: DEPTH_FX });
    d.destroy();
  }

  private beautify(): void {
    this.freezeCrowd(false);
    this.g.audio.sfx.play('board_ok');
    this.cameras.main.flash(600, 255, 236, 170, true);
    this.light?.setAmbient(0xffe9b0);
    for (const a of this.actors.values()) {
      const sp = a.getData('sprite') as Phaser.GameObjects.Sprite | undefined;
      if (sp && a !== this.player) sp.setTint(0xffe9b0);
    }
  }
}


abstract class NovRoom extends NovBase {
  protected indoor = true;
  protected override worldW = ROOM.W;
  protected override worldH = ROOM.H;
  protected override walk = { x: ROOM.X0 + 8, y: ROOM.FLOOR_Y + 8, w: ROOM.X1 - ROOM.X0 - 16, h: ROOM.FLOOR_B - ROOM.FLOOR_Y + 16 };

  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: 320, y: 314, dir: 'up' };
  }

  protected roomBase(key: string, seed: number, ambient: number, wood?: string, floor?: string): void {
    this.setupLighting(ambient);
    this.addGround(key, () => novRoom(seed, wood, floor));
    this.light!.addLight(320, 334, 80, 0xcfe0ff, 0.9, 0);
    this.solids.push({ x: 0, y: ROOM.FLOOR_B + 2, w: 300, h: 40 }, { x: 340, y: ROOM.FLOOR_B + 2, w: 300, h: 40 });
    this.add.particles(0, 0, 'px1', {
      x: { min: ROOM.X0, max: ROOM.X1 }, y: { min: 60, max: 300 }, lifespan: 6000, speedY: { min: -3, max: 2 }, speedX: { min: -3, max: 3 },
      alpha: { start: 0.45, end: 0 }, tint: 0xffe8c0, frequency: 320,
    }).setDepth(9000);
  }

  protected npc(id: string, x: number, y: number, charId: string, dir: Dir = 'down', flip = false): Phaser.GameObjects.Container {
    return this.makeActor(id, x, y, charId, dir, flip);
  }

  protected window(x: number): void {
    this.addProp('nov_mica', micaWindow, x - 13, 56, { depth: 40 });
    this.light!.addLight(x, 110, 110, 0xcfe0ff, 0.6, 0.02, 1);
  }
  protected wallDecor(items: [ArtKind, number, number][]): void {
    for (const [k, x, y] of items) {
      if (k === 'rush') this.addProp('nov_rush', rushnyk, x, y, { depth: 41 });
      if (k === 'herbs') this.addProp('nov_herbs', herbs, x, y, { depth: 41 });
      if (k === 'icon') {
        this.addProp('nov_iconc', iconCorner, x, y, { depth: 41 });
        this.light!.addLight(x + 11, y + 26, 34, 0xff9a40, 0.7, 0.2);
      }
      if (k === 'pots') this.addProp('nov_pots', () => potShelf(80), x, y, { depth: 45 });
      if (k === 'broom') this.addProp('nov_broom', broom, x, y, { solid: true });
      if (k === 'tub') this.addProp('nov_tub', tub, x, y, { solid: true });
    }
  }
}
type ArtKind = 'rush' | 'herbs' | 'icon' | 'pots' | 'broom' | 'tub';

export class NovHouse extends NovRoom {
  constructor() {
    super('nov_house');
  }
  protected override interactableDefs(): Interactable[] {
    return HOUSE_INTERACTABLES;
  }
  protected buildWorld(): void {
    this.roomBase('nov_house_room', 31, 0x7a6670);
    const L = this.light!;
    this.addAnimProp('nov_rstove', [0, 1, 2].map((f) => () => russianStove(f)), 104, 60, 6, { solid: { x: 104, y: 116, w: 64, h: 22 } });
    L.addLight(136, 120, 140, 0xff8a3a, 1.3, 0.16);
    embers(this, 136, 108).setDepth(9320);
    this.window(300);
    this.wallDecor([['rush', 250, 60], ['herbs', 340, 52], ['icon', 512, 50], ['pots', 380, 74], ['broom', 180, 104], ['tub', 470, 290]]);
    this.addProp('nov_bench_l', () => bench(80), 180, 140, { solid: true });
    this.addProp('nov_htable', () => plankTable(96, 22, 'food'), 236, 196, { solid: { x: 236, y: 210, w: 96, h: 18 } });
    this.addProp('nov_hbench2', () => bench(80), 244, 236, { solid: true });
    this.addProp('nov_loom', loom, 500, 140, { solid: { x: 500, y: 178, w: 36, h: 8 } });
    this.addProp('nov_spin', spinningWheel, 112, 220, { solid: { x: 112, y: 244, w: 26, h: 10 } });
    this.addProp('nov_cradle', cradle, 116, 270, { solid: true });
    this.addAnimProp('nov_cat', [0, 1].map((f) => () => cat(f)), 176, 124, 0.7, { depth: 150 });
    const opened = Boolean(this.g.store.state.flags['e1.chestDone']);
    this.addProp(opened ? 'nov_chest_o' : 'nov_chest', () => chest(opened), 426, 180, { solid: { x: 428, y: 196, w: 34, h: 12 } });
    this.addProp('nov_hpile', logsPile, 180, 286, { solid: true });
    const s = this.g.store.state;
    if (s.flags['e1.onfimMet'] && !s.flags['e1.guestDone']) this.npc('onfim', 396, 216, 'onfim', 'side', false);
  }
  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    this.afterCreate(data);
  }
}

export class NovBakery extends NovRoom {
  private logsH: PropHandle | null = null;
  private ovenFx: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super('nov_bakery');
  }
  protected override interactableDefs(): Interactable[] {
    return BAKERY_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return BAKERY_TRIGGERS;
  }
  protected buildWorld(): void {
    this.speedMul = 1;
    this.roomBase('nov_bakery_room', 41, 0x806a64, '#7a5434', '#9a7650');
    const L = this.light!;
    this.addAnimProp('nov_boven', [0, 1, 2, 3].map((f) => () => bakeryOven(f)), 438, 46, 7, { solid: { x: 438, y: 116, w: 96, h: 22 } });
    L.addLight(486, 130, 180, 0xff7a2f, 1.45, 0.16);
    this.ovenFx = embers(this, 486, 112).setDepth(9320);
    this.window(260);
    this.wallDecor([['rush', 330, 60], ['herbs', 200, 52], ['broom', 400, 104], ['tub', 110, 290]]);
    this.addProp('nov_rack', breadRack, 104, 86, { depth: 132, solid: { x: 104, y: 124, w: 52, h: 10 } });
    this.addProp('nov_sacks', flourSacks, 170, 114, { solid: true });
    this.addProp('nov_sacks2', flourSacks, 470, 286, { solid: true });
    this.addProp('nov_dough', () => plankTable(100, 26, 'dough'), 250, 160, { solid: { x: 250, y: 180, w: 100, h: 16 } });
    this.addProp('nov_bbench', () => bench(70), 120, 220, { solid: true });
    this.addAnimProp('nov_cat2', [0, 1].map((f) => () => cat(f, '#5a5258')), 412, 128, 0.6, { depth: 150 });
    const s = this.g.store.state;
    this.logsH = this.addProp('nov_logs', logsPile, 168, 280, { solid: { x: 170, y: 294, w: 30, h: 8 } });
    this.logsH.setVisible(!s.flags['e1.logs'] && !s.flags['e1.bakeryDone']);
    this.npc('nastasya', 420, 214, 'nastasya', 'side', true);
    this.add.particles(0, 0, 'px1', {
      x: { min: 200, max: 420 }, y: { min: 150, max: 260 }, lifespan: 5000, speedY: { min: -3, max: 3 }, speedX: { min: -4, max: 4 },
      alpha: { start: 0.6, end: 0 }, tint: 0xffffff, frequency: 200,
    }).setDepth(9000);
  }
  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    if (this.g.store.state.flags['e1.logs'] && !this.g.store.state.flags['e1.bakeryDone']) this.carry(true);
    this.afterCreate(data);
  }
  private carry(on: boolean): void {
    this.swapChar(this.player, on ? 'player_nov_logs' : 'player_nov');
    this.speedMul = on ? 0.85 : 1;
    this.logsH?.setVisible(!on && !this.g.store.state.flags['e1.bakeryDone'] && !this.g.store.state.flags['e1.logs']);
  }
  protected override async novCall(name: string): Promise<void> {
    switch (name) {
      case 'nov.takeLogs':
        this.logsH?.setVisible(false);
        this.g.audio.sfx.play('step_wood');
        this.carry(true);
        return;
      case 'nov.putLogs':
        this.carry(false);
        this.g.audio.sfx.play('sparks');
        this.cameras.main.flash(250, 255, 154, 64, true);
        this.ovenFx?.explode(16);
        return;
      default:
    }
  }
}

export class NovWorkshop extends NovRoom {
  constructor() {
    super('nov_workshop');
  }
  protected override interactableDefs(): Interactable[] {
    return WORKSHOP_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return WORKSHOP_TRIGGERS;
  }
  protected buildWorld(): void {
    this.roomBase('nov_workshop_room', 51, 0x6a5c70, '#5e4430', '#7a5a40');
    const L = this.light!;
    this.window(150);
    this.addProp('nov_scrolls1', () => scrollRack(84), 236, 66, { depth: 132, solid: { x: 236, y: 122, w: 84, h: 10 } });
    this.addProp('nov_scrolls2', () => scrollRack(84), 330, 66, { depth: 132, solid: { x: 330, y: 122, w: 84, h: 10 } });
    this.wallDecor([['icon', 500, 50], ['herbs', 430, 52], ['broom', 112, 112]]);
    this.addProp('nov_wtable', () => plankTable(130, 26, 'bark'), 356, 158, { solid: { x: 356, y: 176, w: 130, h: 18 } });
    this.addProp('nov_lamp', oilLamp, 466, 156, { depth: 9001 });
    L.addLight(472, 162, 130, 0xffcf70, 1.2, 0.14);
    this.addProp('nov_wax', waxTablets, 376, 162, { depth: 9001 });
    this.addProp('nov_wbench', () => bench(80), 380, 232, { solid: true });
    this.addProp('nov_wbark', birchBarkRolls, 130, 170, { solid: true });
    this.addProp('nov_wbark2', birchBarkRolls, 160, 176, { solid: true });
    this.addProp('nov_wpile', logsPile, 470, 284, { solid: true });
    this.npc('ignat', 420, 202, 'ignat', 'down');
  }
  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    this.afterCreate(data);
  }
}

export const NOV_SCENES = [NovSquare, NovHouse, NovBakery, NovWorkshop];
