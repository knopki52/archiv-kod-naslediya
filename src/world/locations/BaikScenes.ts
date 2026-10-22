import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../../config';
import {
  BUNKER, BUNKER_INTERACTABLES, BUNKER_TRIGGERS, COMMS, COMMS_INTERACTABLES, e3Stage, PAD, PAD_INTERACTABLES, PAD_TRIGGERS,
  type Where,
} from '../../content/epoch3';
import type { Interactable } from '../../content/types';
import { charFrameBuffer } from '../../gfx/Assets';
import { getCharDef } from '../../gfx/characters';
import {
  barrel, blastDoor, BPAD, BROOM, bunkerEntrance, bunkerRoom, bus, camel, ceilingLamp, chairB, controlDesk, crate, erector,
  floodTower, journalDesk, lattice, latticeBeam, oldTruck, operatorDesk, padGround, periscope, powerPole, radioRack, rocket,
  rocketSchema, signPost, tanker, teletype, trailer, tumbleweed, wallClockB, type ShadowCaster,
} from '../../gfx/td/art_baik';
import { portal } from '../../gfx/td/art_hall';
import { beaconPole, rocks, sage, weeds, wheelRut } from '../../gfx/td/art_extra';
import type { Dir } from '../../gfx/td/chars';
import { Px } from '../../gfx/td/px';
import { el } from '../../ui/Ui';
import { crumble, dust, glow } from '../Effects';
import { DEPTH_FX, WorldScene, type PropHandle, type TriggerZone } from '../WorldScene';

const FADED_TINT = 0x8a8a8a;

abstract class BkBase extends WorldScene {
  protected abstract where: Where;
  protected abstract indoor: boolean;
  private domNodes: HTMLElement[] = [];

  protected override themeKey(): 'baik' {
    return 'baik';
  }
  protected override playerChar(): string {
    return 'player_baik';
  }
  protected override stepSound(): 'step_steppe' | 'step_stone' {
    return this.indoor ? 'step_stone' : 'step_steppe';
  }
  protected override onSceneShutdown(): void {
    this.domNodes.forEach((n) => n.remove());
    this.domNodes = [];
  }
  protected track<T extends HTMLElement>(node: T): T {
    this.domNodes.push(node);
    return node;
  }
  protected npc(id: string, x: number, y: number, charId: string, dir: Dir = 'down', flip = false): Phaser.GameObjects.Container {
    return this.makeActor(id, x, y, charId, dir, flip);
  }
  protected applyStage(): void {
    const st = e3Stage(this.g.store.state, this.where);
    this.g.bus.emit('objective:changed', { text: st.objective });
    this.g.hints.setRule(st.rule === 'none' ? null : (this.g.hintRules[st.rule] ?? null));
  }
  override async call(name: string, args: Record<string, unknown> = {}): Promise<void> {
    if (name === 'bk.objectiveByStage') {
      this.applyStage();
      return;
    }
    await this.bkCall(name, args);
  }
  protected async bkCall(_name: string, _args: Record<string, unknown>): Promise<void> {}

  protected afterCreate(data: { resumeRef?: string }, entry?: string): void {
    this.g.audio.music.play('baik', 2);
    this.g.audio.ambience.set(this.indoor ? 'bunker' : 'steppe');
    if (data?.resumeRef) return;
    if (entry) {
      void this.g.runScript(entry);
      return;
    }
    this.applyStage();
  }

  protected async dublerAppearAt(x: number, y: number): Promise<void> {
    const d = this.npc('dubler', x, y, 'dubler', 'side', true);
    d.setAlpha(0);
    this.g.audio.sfx.play('glitch');
    this.cameras.main.flash(220, 255, 211, 107, true);
    if (!this.g.settings.data.reducedEffects) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 900, reverse: true, depth: DEPTH_FX });
    d.setAlpha(1);
    glow(this, d.x, d.y - 18, 0xffd36b, 1.6, 0.25).setDepth(9330);
  }

  protected async dublerLeaveNow(): Promise<void> {
    const d = this.actors.get('dubler');
    if (!d) return;
    this.actors.delete('dubler');
    d.setVisible(false);
    if (!this.g.settings.data.reducedEffects) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 1000, depth: DEPTH_FX });
    d.destroy();
  }
}


const RX = BPAD.RCX - 48;
let ROCKET_ART: ReturnType<typeof rocket> | null = null;
const rocketArt = (): ReturnType<typeof rocket> => (ROCKET_ART ??= rocket());

export class BkPad extends BkBase {
  protected override worldW = BPAD.W;
  protected override worldH = BPAD.H;
  protected override walk = { x: 8, y: 150, w: BPAD.W - 16, h: BPAD.H - 158 };
  protected where: Where = 'pad';
  protected indoor = false;
  private stage = '';
  private rocketH: PropHandle | null = null;
  private puffs: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private lastDust = { x: 0, y: 0 };

  constructor() {
    super('bk_pad');
  }
  protected override interactableDefs(): Interactable[] {
    return PAD_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return PAD_TRIGGERS;
  }
  protected override spawnPoint(from?: string): { x: number; y: number; dir?: Dir; flip?: boolean } {
    if (this.stage === 'launch') return { x: 760, y: 330, dir: 'up' };
    return from === 'bunker' ? { x: PAD.bunker, y: 284, dir: 'down' } : { x: 230, y: 250, dir: 'side' };
  }

  protected buildWorld(): void {
    this.rocketH = null;
    this.lastDust = { x: 0, y: 0 };
    const L = this.setupLighting(0xfff0dc);
    const r = rocketArt();
    const arms = new Px(160, 140);
    latticeBeam(arms, 22, 136, 56, 18, 7, '#6a6250');
    latticeBeam(arms, 138, 136, 104, 18, 7, '#6a6250');
    arms.outline(0, '#1e1c18');
    const cm = lattice(10, 200, '#6a5e4c', [40, 90, 140]);
    const fm = lattice(10, 120, '#6a5e4c', [40, 80]);
    const tk = tanker(), bs = bus(), ot = oldTruck(), er = erector(150), tl = trailer(), sp = signPost();
    const ft1 = floodTower(100), ft2 = floodTower(96);
    const pole = powerPole(54);
    const poles = [[60, 334], [200, 322], [340, 312], [480, 304], [620, 296]] as const;
    const casters: ShadowCaster[] = [
      { spr: r.p, x: RX, y: BPAD.RBOT - r.bot, base: r.bot, a: 0.4 },
      { spr: arms, x: BPAD.RCX - 80, y: BPAD.RBOT - 136, base: 136, a: 0.28 },
      { spr: cm, x: 1060, y: BPAD.RBOT - 200, base: 199, a: 0.3 },
      { spr: fm, x: 880, y: BPAD.RBOT - 120, base: 119, a: 0.3 },
      { spr: ft1.p, x: 723, y: 70, base: 99 },
      { spr: ft2.p, x: 1233, y: 64, base: 95 },
      { spr: tk, x: 500, y: 300, base: 38 },
      { spr: bs, x: 250, y: 184, base: 36 },
      { spr: ot, x: 1150, y: 330, base: 38 },
      { spr: er, x: 380, y: 352, base: 25, a: 0.3 },
      { spr: tl, x: 330, y: 96, base: 25, a: 0.3 },
      { spr: sp, x: 620, y: 270, base: 21, a: 0.3 },
      ...poles.map(([x, y]) => ({ spr: pole, x: x - 11, y: y - 54, base: 53, a: 0.28 })),
    ];
    this.addGround('bk_pad_ground', () => padGround(casters));
    const be = this.addProp('bk_bunker_ent', bunkerEntrance, 16, 180, { depth: 262, solid: { x: 20, y: 214, w: 168, h: 44 } });
    void be;
    this.rocketH = this.addProp('bk_rocket', () => r, RX, BPAD.RBOT - r.bot, { depth: BPAD.RBOT, solid: { x: RX + 8, y: BPAD.RBOT - 10, w: 80, h: 14 } });
    this.addProp('bk_arms', () => arms, BPAD.RCX - 80, BPAD.RBOT - 136, { depth: BPAD.RBOT + 1 });
    this.addProp('bk_cmast', () => cm, 1060, BPAD.RBOT - 200, { depth: BPAD.RBOT - 2, solid: { x: 1062, y: BPAD.RBOT - 8, w: 14, h: 8 } });
    this.addProp('bk_fmast', () => fm, 880, BPAD.RBOT - 120, { depth: BPAD.RBOT - 2, solid: { x: 882, y: BPAD.RBOT - 8, w: 14, h: 8 } });
    this.solids.push({ x: BPAD.RCX - 60, y: BPAD.RBOT - 2, w: 120, h: 40 });
    this.add.graphics().lineStyle(1, 0x2a2a2e, 1).lineBetween(1066, BPAD.RBOT - 168, BPAD.RCX + 7, BPAD.RBOT - 190).lineBetween(1066, BPAD.RBOT - 120, BPAD.RCX + 9, BPAD.RBOT - 136).setDepth(BPAD.RBOT - 1);
    this.addProp('bk_ft1', () => ft1, 723, 70, { depth: 170, solid: { x: 735, y: 162, w: 12, h: 8 } });
    this.addProp('bk_ft2', () => ft2, 1233, 64, { depth: 160 });
    L.addLight(740, 82, 70, 0xfff2d0, 0.5, 0.02);
    L.addLight(1250, 76, 70, 0xfff2d0, 0.5, 0.02);
    this.addProp('bk_tanker', () => tk, 500, 300, { solid: { x: 502, y: 326, w: 74, h: 12 } });
    this.addProp('bk_bus', () => bs, 250, 184, { solid: { x: 252, y: 208, w: 66, h: 12 } });
    this.addProp('bk_truck', () => ot, 1150, 330, { solid: { x: 1150, y: 356, w: 62, h: 12 } });
    this.addProp('bk_erector', () => er, 380, 352, { solid: { x: 380, y: 366, w: 150, h: 10 } });
    this.addProp('bk_trailer', () => tl, 330, 96, { solid: true });
    this.addProp('bk_sign', () => sp, 620, 270, { solid: { x: 626, y: 286, w: 6, h: 6 } });
    poles.forEach(([x, y], i) => this.addProp(`bk_pole${i}`, () => pole, x - 11, y - 54, { solid: { x: x - 2, y: y - 4, w: 4, h: 4 } }));
    ([[760, 236, '#5a6a7a'], [774, 240, '#7a4a3a'], [752, 248, '#5a6a4a']] as const).forEach(([x, y, c], i) => this.addProp(`bk_barrel${i}`, () => barrel(c), x, y, { solid: true }));
    ([[1180, 220], [1168, 226], [1186, 234]] as const).forEach(([x, y], i) => this.addProp(`bk_crate${i}`, () => crate(14, 12), x, y, { solid: true }));
    ([[180, 90], [204, 94]] as const).forEach(([x, y], i) => this.addProp(`bk_camel${i}`, camel, x, y, { depth: y + 13 }));
    ([[160, 380], [860, 400], [1240, 390], [660, 120]] as const).forEach(([x, y], i) => {
      const h = this.addProp(`bk_tw${i}`, tumbleweed, x, y);
      this.tweens.add({ targets: h.img, x: x + 40, angle: 360, duration: 6000 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    ([[420, 130], [560, 190], [90, 330], [700, 360], [980, 390], [1230, 170], [470, 410], [820, 150], [1100, 120], [300, 260], [650, 250], [40, 100]] as const)
      .forEach(([x, y], i) => this.addProp(`bk_sage${i}`, () => sage(60 + i), x, y, { depth: y + 12 }));
    ([[540, 110], [940, 360], [140, 250], [1010, 190], [380, 400]] as const).forEach(([x, y], i) => this.addProp(`bk_rock${i}`, () => rocks(80 + i, '#8e7d62'), x, y, { solid: true }));
    ([[320, 220], [700, 130], [780, 330], [1160, 280], [240, 390]] as const).forEach(([x, y], i) => this.addProp(`bk_weed${i}`, () => weeds(11 + i), x, y, { depth: y + 11 }));
    this.addProp('bk_rut1', () => wheelRut(280), 380, 310, { depth: 3 });
    this.addProp('bk_rut2', () => wheelRut(220), 840, 262, { depth: 3 });
    ([[360, 170], [1090, 330], [660, 340]] as const).forEach(([x, y], i) => {
      this.addProp(`bk_beacon${i}`, () => beaconPole(58), x - 7, y - 56, { depth: y + 2, solid: { x: x - 3, y: y - 2, w: 6, h: 4 } });
      L.addLight(x, y - 50, 60, 0xff5a40, 0.45, 0.35);
    });
    this.add.particles(BPAD.RCX, BPAD.RBOT - 150, 'puff', {
      x: { min: -24, max: 24 }, y: { min: 0, max: 110 }, lifespan: 2600, speedX: { min: -14, max: -4 }, speedY: { min: 2, max: 10 },
      scale: { start: 0.6, end: 1.8 }, alpha: { start: 0.35, end: 0 }, tint: 0xffffff, frequency: 140,
    }).setDepth(BPAD.RBOT + 2);
    dust(this, BPAD.W, BPAD.H);
    this.puffs = this.add.particles(0, 0, 'puff', {
      lifespan: 700, speedX: { min: -12, max: 6 }, speedY: { min: -10, max: -2 },
      scale: { start: 0.35, end: 0.9 }, alpha: { start: 0.45, end: 0 }, tint: 0xd9c29a, emitting: false,
    }).setDepth(300);
    L.addLight(1186, 40, 420, 0xffcf90, 0.35, 0);
    if (this.stage !== 'launch') {
      this.npc('ivan', PAD.ivan, 270, 'ivan', 'side', true);
      for (const [x, y] of [[1040, 292], [1050, 294], [1058, 291], [900, 290]] as const) this.add.rectangle(x, y - 4, 2, 7, 0x2a2a30).setDepth(y);
    }
  }

  override create(data: { resumeRef?: string; from?: string; stage?: string }): void {
    this.stage = data?.stage ?? '';
    super.create(data);
    if (this.stage === 'launch') {
      this.afterCreate(data, data?.resumeRef ? undefined : 'epoch3#launch');
      return;
    }
    if (this.stage === 'intro' && !data?.resumeRef) {
      this.afterCreate(data, 'epoch3#start');
      return;
    }
    this.afterCreate(data);
  }

  override update(t: number, dt: number): void {
    super.update(t, dt);
    const p = this.player;
    if (!this.puffs || this.stage === 'launch') return;
    if (Math.hypot(p.x - this.lastDust.x, p.y - this.lastDust.y) > 14) {
      this.lastDust = { x: p.x, y: p.y };
      this.puffs.emitParticleAt(p.x, p.y - 1, 1);
    }
  }

  protected override async bkCall(name: string): Promise<void> {
    switch (name) {
      case 'bk.arrive': {
        const art = portal('#7dffb0', 'active', 5, 0);
        const p = this.addProp('bk_arrive_portal', () => art, 194, 170, { depth: 252 });
        const lt = this.light?.addLight(230, 230, 110, 0x7dffb0, 0, 0.1);
        p.setAlpha(0);
        this.player.setAlpha(0);
        this.g.audio.sfx.play('portal');
        this.tweens.addCounter({ from: 0, to: 1, duration: 600, onUpdate: (tw) => { const v = tw.getValue() ?? 1; p.setAlpha(v); if (lt) lt.intensity = v; } });
        await this.g.wait(500);
        this.tweens.add({ targets: this.player, alpha: 1, duration: 900 });
        await this.g.wait(1100);
        this.tweens.addCounter({ from: 1, to: 0, duration: 1200, onUpdate: (tw) => { const v = tw.getValue() ?? 0; p.setAlpha(v); if (lt) lt.intensity = v; }, onComplete: () => { p.destroy(); this.light?.removeLight(lt); } });
        return;
      }
      case 'bk.launch':
        await this.launch();
        return;
      default:
    }
  }

  private async launch(): Promise<void> {
    const cam = this.cameras.main;
    const reduced = this.g.settings.data.reducedEffects;
    const agree = this.g.store.state.flags['ep3.choice'] === 'agree';
    const rocketImg = this.rocketH!.img;
    this.g.store.setFlag('stage.e3launch', true);
    this.g.hud.setObjective(null);
    this.g.hints.setRule(null);
    for (const id of [...this.actors.keys()]) {
      if (id === 'player') continue;
      this.actors.get(id)?.destroy();
      this.actors.delete(id);
    }
    this.player.setPosition(760, 330);
    this.setDir(this.player, 'up');
    this.npc('galya', 730, 334, 'galya', 'up');
    this.npc('ivan', 792, 332, 'ivan', 'up');
    cam.stopFollow();
    cam.centerOn(760, 260);
    if (agree) {
      this.light?.setAmbient(0xe4e0d6);
      this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x9a9a9a, 0.28).setOrigin(0).setScrollFactor(0).setDepth(9150);
    }
    this.g.audio.music.stop(1.5);
    await this.g.wait(1800);
    cam.pan(BPAD.RCX, 170, 2400, 'Sine.easeInOut');
    await this.g.wait(2700);

    const count = this.track(el('div', 'countdown', this.g.ui.layers.overlay));
    for (const n of [5, 4, 3, 2, 1]) {
      count.textContent = String(n);
      count.classList.remove('pop');
      void count.offsetWidth;
      count.classList.add('pop');
      if (!agree) this.g.audio.sfx.play('radio_click');
      await this.g.wait(1000);
    }
    count.remove();

    this.g.audio.sfx.play('rocket');
    this.g.audio.music.play('baik', 4);
    const base = { x: BPAD.RCX, y: BPAD.RBOT };
    const flameLight = this.light?.addLight(base.x, base.y, 20, 0xff7a2f, 1.4, 0.25);
    if (flameLight) this.tweens.add({ targets: flameLight, radius: 340, duration: 5200, ease: 'Sine.easeIn' });
    const flame = glow(this, base.x, base.y + 4, 0xff8a3a, 0.6, 0.3).setDepth(9330);
    this.tweens.add({ targets: flame, scale: 4, alpha: 0.85, duration: 5200, ease: 'Sine.easeIn' });
    const smoke = this.add.particles(base.x, base.y + 10, 'puff', {
      lifespan: 5200, speedX: { min: -70, max: 70 }, speedY: { min: -26, max: 14 },
      scale: { start: 1.4, end: 7 }, alpha: { start: 0.75, end: 0 }, tint: [0xd9c29a, 0xcfcfcf, 0xe8e0d0, 0xf4efe6], frequency: 18,
    }).setDepth(BPAD.RBOT + 3);
    const trench = [-1, 1].map((d) =>
      this.add.particles(base.x + d * 30, base.y + 6, 'puff', {
        lifespan: 4200, speedX: d < 0 ? { min: -320, max: -120 } : { min: 120, max: 320 }, speedY: { min: -60, max: 34 },
        scale: { start: 1.6, end: 8 }, alpha: { start: 0.85, end: 0 }, tint: [0xffffff, 0xe8e4dc, 0xd9c8a8, 0xffc070], frequency: 16,
        accelerationX: d * -40,
      }).setDepth(BPAD.RBOT + 4),
    );
    trench.forEach((t) => t.stop());
    const exhaust = this.add.particles(base.x, base.y, 'px', {
      lifespan: 650, speedY: { min: 60, max: 160 }, speedX: { min: -26, max: 26 }, scale: { start: 3.2, end: 0 },
      tint: [0xffffff, 0xffe08a, 0xff9a40, 0xff5a2f], frequency: 6, blendMode: Phaser.BlendModes.ADD,
    }).setDepth(9335);
    const trail = this.add.particles(base.x, base.y, 'puff', {
      lifespan: 6000, speedY: { min: 4, max: 20 }, speedX: { min: -8, max: 8 }, scale: { start: 1.2, end: 4.5 },
      alpha: { start: 0.6, end: 0 }, tint: [0xffffff, 0xf0ece4], frequency: 30,
    }).setDepth(9120);
    trail.stop();
    if (!reduced) cam.flash(260, 255, 210, 150, true);
    this.tweens.addCounter({ from: 0.15, to: 1, duration: 6500, onUpdate: (t) => this.g.audio.music.setIntensity(t.getValue() ?? 0) });
    if (!reduced) {
      cam.shake(2600, 0.0012);
      await this.g.wait(900);
      trench.forEach((t) => t.start());
      await this.g.wait(1700);
      cam.shake(3200, 0.0034);
      await this.g.wait(3200);
    } else {
      trench.forEach((t) => t.start());
      await this.g.wait(5800);
    }
    trail.start();

    const y0 = rocketImg.y;
    this.tweens.add({
      targets: rocketImg, y: y0 - 520, duration: 7600, ease: 'Quad.easeIn',
      onUpdate: () => {
        const ny = rocketImg.y + rocketArt().bot;
        exhaust.setPosition(BPAD.RCX, ny);
        trail.setPosition(BPAD.RCX, ny + 10);
        flame.setPosition(BPAD.RCX, ny + 4);
        if (flameLight) flameLight.y = ny;
      },
    });
    cam.pan(BPAD.RCX, VIEW_H / 2, 6000, 'Sine.easeIn');
    await this.g.wait(1400);
    void this.radioWord(agree);
    await this.g.wait(6200);
    exhaust.stop();
    smoke.stop();
    trench.forEach((t) => t.stop());
    trail.stop();
    this.tweens.add({ targets: [flame], alpha: 0, duration: 1500 });
    if (flameLight) this.tweens.add({ targets: flameLight, intensity: 0, duration: 1500 });
    this.g.audio.music.setIntensity(0);
    this.g.audio.music.stop(4);
    await this.g.wait(4200);
    cam.fadeOut(1000, 0, 0, 0);
    await this.g.wait(1100);
  }

  private async radioWord(clean: boolean): Promise<void> {
    const box = this.track(el('div', `radio-text ${clean ? 'clean' : 'noisy'}`, this.g.ui.layers.overlay));
    el('div', 'radio-tag', box, 'РАДИО');
    el('div', 'radio-word', box, 'Поехали!');
    if (!clean) {
      this.g.audio.sfx.play('radio_click');
      this.g.screenGlitch(140);
      for (let i = 1; i <= 4; i++) window.setTimeout(() => this.g.audio.sfx.play('radio_click'), (i * 700) / this.g.timeScale);
    }
    await this.g.wait(4200);
    box.classList.add('fade');
    await this.g.wait(900);
    box.remove();
  }
}


const TABLE = { x: 272, y: 248 };

export class BkBunker extends BkBase {
  protected override worldW = BROOM.W;
  protected override worldH = BROOM.H;
  protected override walk = { x: BROOM.X0 + 6, y: BROOM.FLOOR_Y + 6, w: BROOM.X1 - BROOM.X0 - 12, h: BROOM.FLOOR_B - BROOM.FLOOR_Y - 8 };
  protected where: Where = 'bunker';
  protected indoor = true;
  private deskH: PropHandle | null = null;

  constructor() {
    super('bk_bunker');
  }
  protected override interactableDefs(): Interactable[] {
    return BUNKER_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return BUNKER_TRIGGERS;
  }
  protected override spawnPoint(from?: string): { x: number; y: number; dir?: Dir } {
    if (from === 'comms') return { x: BUNKER.comms, y: 170, dir: 'down' };
    if (from === 'pad') return { x: BUNKER.pad, y: 170, dir: 'down' };
    return { x: 300, y: 300, dir: 'up' };
  }

  private deskKey(): { key: string; open: boolean; protocol: boolean } {
    const s = this.g.store.state;
    const closed = s.flags['ep3.choice'] === 'agree' && s.flags['stage.e3finale'] === true;
    const protocol = Boolean(s.flags['e3.inspectDone']) && !s.flags['bk.protocolGone'];
    return { key: `bk_jdesk_${closed ? 'c' : 'o'}_${protocol ? 'p' : 'n'}`, open: !closed, protocol };
  }

  protected buildWorld(): void {
    const s = this.g.store.state;
    const L = this.setupLighting(0x80888e);
    this.addGround('bk_bunker_room', () => bunkerRoom(7));
    this.addProp('bk_door_c', blastDoor, BUNKER.comms - 24, 64, { depth: 60 });
    this.addProp('bk_door_p', blastDoor, BUNKER.pad - 24, 64, { depth: 60 });
    this.addAnimProp('bk_desk', [0, 1, 2].map((f) => () => controlDesk(250, 11, f)), 196, 92, 2, { depth: 148, solid: { x: 196, y: 128, w: 250, h: 20 } });
    this.addProp('bk_schema', rocketSchema, 140, 48, { depth: 50 });
    this.addProp('bk_clock', wallClockB, 460, 50, { depth: 50 });
    this.addProp('bk_periscope', periscope, 470, 160, { solid: { x: 474, y: 210, w: 14, h: 8 } });
    for (const x of [200, 320, 440]) {
      this.addProp('bk_ceil', ceilingLamp, x - 14, BROOM.WALL_TOP + 16, { depth: 70 });
      L.addLight(x, 200, 170, 0xfff0c8, 0.75, 0.04);
    }
    L.addLight(320, 118, 120, 0x7dffb0, 0.25, 0.12);
    const dk = this.deskKey();
    this.deskH = this.addProp(dk.key, () => journalDesk(dk.open, dk.protocol), TABLE.x, TABLE.y, { solid: { x: TABLE.x, y: TABLE.y + 16, w: 96, h: 14 } });
    L.addLight(TABLE.x + 60, TABLE.y + 6, 60, 0xffd9a0, 0.6, 0.04);
    for (const [x, y] of [[240, 262], [380, 262], [150, 180], [520, 220]] as const) this.addProp('bk_chair', chairB, x, y, { solid: { x: x + 2, y: y + 14, w: 12, h: 6 } });
    this.addProp('bk_barrelb', () => barrel('#5a6a5a'), 92, 290, { solid: true });
    if (s.flags['e3.started']) {
      this.npc('timofey', BUNKER.timofey, 232, 'timofey', 'side', true);
      if (s.flags['e3.met'] && !s.flags['stage.e3finale']) {
        this.npc('inspector', BUNKER.inspector, 236, 'inspector', 'side', true);
        if (!s.flags['e3.inspectDone']) this.npc('galya', BUNKER.galya, 236, 'galya', 'side', false);
      }
    }
  }

  override create(data: { resumeRef?: string; from?: string; stage?: string }): void {
    super.create(data);
    const s = this.g.store.state;
    if (data?.stage === 'finale' && !data.resumeRef) {
      this.afterCreate(data, 'epoch3#finale');
      return;
    }
    if (!s.flags['e3.started'] && !data?.resumeRef) {
      this.cameras.main.setAlpha(0);
      void this.g.runScript('epoch3#enter');
      return;
    }
    this.afterCreate(data);
  }

  protected override async bkCall(name: string, args: Record<string, unknown>): Promise<void> {
    switch (name) {
      case 'bk.galyaEnters': {
        const g = this.npc('galya', BUNKER.comms, 170, 'galya', 'down');
        g.setAlpha(0);
        this.g.audio.sfx.play('door');
        this.tweens.add({ targets: g, alpha: 1, duration: 200 });
        await this.perform({ t: 'moveTo', who: 'galya', x: BUNKER.galya, y: 236, speed: 52 });
        this.setDir(g, 'side', false);
        return;
      }
      case 'bk.inspectorEnters': {
        const a = this.npc('inspector', BUNKER.pad, 170, 'inspector', 'down');
        a.setAlpha(0);
        this.g.audio.sfx.play('door');
        this.tweens.add({ targets: a, alpha: 1, duration: 200 });
        await this.perform({ t: 'moveTo', who: 'inspector', x: BUNKER.inspector, y: 236, speed: 52 });
        this.setDir(a, 'side', true);
        return;
      }
      case 'bk.finaleSetup':
        this.finaleSetup(Boolean(args['resume']));
        return;
      case 'bk.inspectorFade':
        await this.inspectorFade();
        return;
      case 'bk.dublerAppear': {
        const at = this.actors.get('inspector');
        await this.dublerAppearAt(at?.x ?? BUNKER.inspector, at?.y ?? 236);
        return;
      }
      case 'bk.dublerLeave':
        await this.dublerLeaveNow();
        return;
      case 'bk.journalWrite':
        this.journalWrite();
        return;
      case 'bk.journalClose':
        this.journalClose();
        return;
      default:
    }
  }

  private refreshDesk(): void {
    this.deskH?.destroy();
    const dk = this.deskKey();
    this.deskH = this.addProp(dk.key, () => journalDesk(dk.open, dk.protocol), TABLE.x, TABLE.y);
  }

  private finaleSetup(resume: boolean): void {
    this.g.store.setFlag('stage.e3finale', true);
    this.g.hud.setObjective(null);
    this.g.hints.setRule(null);
    for (const id of [...this.actors.keys()]) {
      if (id === 'player') continue;
      this.actors.get(id)?.destroy();
      this.actors.delete(id);
    }
    this.player.setPosition(270, 236);
    this.setDir(this.player, 'side', false);
    this.npc('galya', 220, 238, 'galya', 'side', false);
    this.npc('timofey', BUNKER.timofey, 232, 'timofey', 'side', true);
    this.refreshDesk();
    this.npc(resume ? 'dubler' : 'inspector', BUNKER.inspector + 14, 236, resume ? 'dubler' : 'inspector', 'side', true);
  }

  private async inspectorFade(): Promise<void> {
    const sp = this.actors.get('inspector')?.getData('sprite') as Phaser.GameObjects.Sprite | undefined;
    if (!sp) return;
    this.g.audio.sfx.play('glitch');
    const from = Phaser.Display.Color.ValueToColor(0xffffff);
    const to = Phaser.Display.Color.ValueToColor(FADED_TINT);
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0, to: 100, duration: this.g.settings.data.reducedEffects ? 300 : 1200,
        onUpdate: (t) => {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, t.getValue() ?? 0);
          sp.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        },
        onComplete: () => resolve(),
      });
    });
  }

  private journalWrite(): void {
    this.g.store.setFlag('bk.protocolGone', true);
    this.refreshDesk();
    this.g.audio.sfx.play('pencil');
    window.setTimeout(() => this.g.audio.sfx.play('pencil'), 220 / this.g.timeScale);
    window.setTimeout(() => this.g.audio.sfx.play('page'), 520 / this.g.timeScale);
    this.cameras.main.flash(400, 255, 236, 170, true);
    glow(this, TABLE.x + 62, TABLE.y + 8, 0xffd23f, 1.2, 0.4).setDepth(9330);
    this.g.hud.toast('В журнале: люк закрывали заново, сбой связи устранён', 'clue', 3600);
  }

  private journalClose(): void {
    this.refreshDesk();
    this.g.audio.sfx.play('board_ok');
    this.cameras.main.flash(500, 255, 236, 170, true);
    this.light?.setAmbient(0xc6c6c4);
  }
}


export class BkComms extends BkBase {
  protected override worldW = BROOM.W;
  protected override worldH = BROOM.H;
  protected override walk = { x: BROOM.X0 + 6, y: BROOM.FLOOR_Y + 6, w: BROOM.X1 - BROOM.X0 - 12, h: BROOM.FLOOR_B - BROOM.FLOOR_Y - 8 };
  protected where: Where = 'comms';
  protected indoor = true;

  constructor() {
    super('bk_comms');
  }
  protected override interactableDefs(): Interactable[] {
    return COMMS_INTERACTABLES;
  }
  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: COMMS.door, y: 170, dir: 'down' };
  }

  protected buildWorld(): void {
    const L = this.setupLighting(0x7a8a84);
    this.addGround('bk_comms_room', () => bunkerRoom(13));
    this.addProp('bk_door_cb', blastDoor, COMMS.door - 24, 64, { depth: 60 });
    [76, 132, 188, 244, 400].forEach((x, i) => {
      this.addAnimProp(`bk_rack${i}`, [0, 1, 2].map((f) => () => radioRack(20 + i, f)), x, 46, 3 + i * 0.4, { depth: 142, solid: { x, y: 130, w: 52, h: 12 } });
      L.addLight(x + 26, 120, 50, 0x7dffb0, 0.5, 0.2);
    });
    this.addProp('bk_opdesk', operatorDesk, COMMS.panel - 55, 176, { solid: { x: COMMS.panel - 55, y: 196, w: 110, h: 16 } });
    L.addLight(COMMS.panel, 190, 70, 0xffd23f, 0.7, 0.14);
    this.addProp('bk_tty', teletype, 460, 230, { solid: { x: 460, y: 250, w: 34, h: 10 } });
    this.addProp('bk_cchair', chairB, COMMS.panel - 8, 214);
    for (const x of [200, 380]) {
      this.addProp('bk_ceil', ceilingLamp, x - 14, BROOM.WALL_TOP + 16, { depth: 70 });
      L.addLight(x, 200, 160, 0xe8f0d8, 0.7, 0.05);
    }
    this.addProp('bk_cclock', wallClockB, 330, 50, { depth: 50 });
    this.npc('galya', COMMS.galya, 236, 'galya', 'side', false);
  }

  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    this.afterCreate(data);
  }
}

export const BAIK_SCENES = [BkPad, BkBunker, BkComms];
