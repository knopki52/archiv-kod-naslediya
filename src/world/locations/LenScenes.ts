import Phaser from 'phaser';
import {
  CELLAR_INTERACTABLES, CELLAR_TRIGGERS, e2Stage, HALL, HALL_INTERACTABLES, HALL_TRIGGERS, YARD, YARD_INTERACTABLES,
  YARD_TRIGGERS,
} from '../../content/epoch2';
import type { Interactable } from '../../content/types';
import { charFrameBuffer } from '../../gfx/Assets';
import { getCharDef, registerCharDef, villager } from '../../gfx/characters';
import { standShelf } from '../../gfx/td/art_common';
import {
  bookPile, bunk, burzhuika, catalog, CELLAR, cellarGround, chairBlanket, chopBlock, coatRack, furniturePile, kerosene, LHALL,
  lenHallGround, libDoor, LYARD, papersStack, readTable, sandbags, seedBoxes, shed, sled, stairDoor, stool, waterSled,
  woodPile, yardGround, bareTree, archway, streetBench, drift, waterPump, lampPost, noticeBoard,
} from '../../gfx/td/art_len';
import { barrel as barrelL } from '../../gfx/td/art_baik';
import { radioPlate } from '../../gfx/td/art_len';
import type { Dir } from '../../gfx/td/chars';
import { breath, crumble, embers, glow, snow } from '../Effects';
import { DEPTH_FX, WorldScene, type PropHandle, type TriggerZone } from '../WorldScene';

const FROZEN_TINT = 0x8f95a8;

abstract class LenBase extends WorldScene {
  private stops: (() => void)[] = [];
  protected abstract indoor: boolean;

  protected override themeKey(): 'len' {
    return 'len';
  }
  protected override playerChar(): string {
    return 'player_len';
  }
  protected override stepSound(): 'step_stone' | 'step_snow' {
    return this.indoor ? 'step_stone' : 'step_snow';
  }
  protected override onSceneShutdown(): void {
    this.stops.forEach((f) => f());
    this.stops = [];
  }

  protected addBreath(actor: Phaser.GameObjects.Container): void {
    this.stops.push(breath(this, actor, { x: 6, y: -24 }, 2100));
  }

  protected npc(id: string, x: number, y: number, charId: string, dir: Dir = 'down', flip = false, withBreath = true): Phaser.GameObjects.Container {
    const a = this.makeActor(id, x, y, charId, dir, flip);
    if (withBreath) this.addBreath(a);
    return a;
  }

  protected applyStage(): void {
    const st = e2Stage(this.g.store.state);
    this.g.bus.emit('objective:changed', { text: st.objective });
    this.g.hints.setRule(st.rule === 'none' ? null : (this.g.hintRules[st.rule] ?? null));
  }

  override async call(name: string, args: Record<string, unknown> = {}): Promise<void> {
    if (name === 'len.objectiveByStage') {
      this.applyStage();
      return;
    }
    await this.lenCall(name, args);
  }
  protected async lenCall(_name: string, _args: Record<string, unknown>): Promise<void> {}

  protected afterCreate(data: { resumeRef?: string }, entry?: string): void {
    this.g.audio.music.play('len', 2);
    this.g.audio.ambience.set(this.indoor ? 'stove' : 'len_city');
    if (!this.g.audio.metronome.running) this.g.audio.metronome.start(60);
    if (data?.resumeRef) return;
    if (entry) {
      void this.g.runScript(entry);
      return;
    }
    this.applyStage();
  }
}


export class LenHall extends LenBase {
  protected indoor = true;
  protected override worldW = LHALL.W;
  protected override worldH = LHALL.H;
  protected override walk = { x: 12, y: LHALL.FLOOR_Y + 8, w: LHALL.W - 24, h: LHALL.H - LHALL.FLOOR_Y - 14 };
  private plate: Phaser.GameObjects.Image | null = null;
  private frozen = false;

  constructor() {
    super('len_hall');
  }
  protected override interactableDefs(): Interactable[] {
    return HALL_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return HALL_TRIGGERS;
  }
  protected override spawnPoint(from?: string): { x: number; y: number; dir?: Dir; flip?: boolean } {
    return from === 'yard' ? { x: HALL.door, y: 160, dir: 'down' } : { x: 430, y: 300, dir: 'side', flip: true };
  }

  protected buildWorld(): void {
    this.frozen = false;
    const L = this.setupLighting(0x5a6684);
    this.addGround('len_hall_ground', lenHallGround);
    this.addProp('len_libdoor', libDoor, HALL.door - 20, 58, { depth: 60 });
    this.addAnimProp('len_stove', [0, 1, 2].map((f) => () => burzhuika(f)), HALL.stove - 20, 96, 6, { depth: 214, solid: { x: HALL.stove - 14, y: 204, w: 28, h: 12 } });
    this.add.rectangle(HALL.stove - 4, 14, 74, 7, 0x2e2e36).setOrigin(0).setDepth(5);
    L.addLight(HALL.stove, 196, 210, 0xff9a50, 1.5, 0.14);
    L.addLight(HALL.stove, 200, 70, 0xffc070, 0.7, 0.2);
    embers(this, HALL.stove, 186).setDepth(9320);
    [44, 268, 492].forEach((x) => L.addLight(x + 90, 176, 130, 0x7a92c0, 0.45, 0.02));
    this.addProp('len_wood', woodPile, HALL.stove - 66, 200, { solid: true });
    this.addProp('len_stool', stool, HALL.stove + 28, 220, { solid: true });
    this.addProp('len_catalog', catalog, 42, 136, { solid: { x: 42, y: 170, w: 44, h: 12 } });
    this.addProp('len_rack', coatRack, 112, 128, { solid: { x: 116, y: 176, w: 12, h: 6 } });
    this.addProp('len_stack1', () => standShelf(64, 40, 81, 0, 0.45, '#3a2a20'), 300, 140, { solid: { x: 300, y: 178, w: 64, h: 9 } });
    this.addProp('len_stack2', () => standShelf(64, 40, 82, 0, 0.45, '#3a2a20'), 560, 214, { solid: { x: 560, y: 252, w: 64, h: 9 } });
    const desk = readTable(70, 9, { books: 1, candle: 54 });
    this.addProp('len_desk', () => desk, 22, 200, { solid: { x: 22, y: 216, w: 70, h: 14 } });
    L.addLight(78, 200, 54, 0xffcf70, 0.75, 0.15);
    this.addProp('len_wsled', waterSled, 520, 150, { solid: true });
    this.addProp('len_chairb', chairBlanket, 344, 190, { solid: true });
    ([[350, 164, 1], [100, 290, 5], [560, 300, 7]] as const).forEach(([x, y, sd]) => this.addProp(`len_pile${sd}`, () => bookPile(sd, 0.45), x, y, { solid: true }));
    const t1 = readTable(186, 3, { lamp: 40, books: 3, candle: 128 }), t2 = readTable(186, 4, { lamp: 150, books: 4 });
    this.addProp('len_t1', () => t1, 400, 170, { solid: { x: 400, y: 186, w: 186, h: 14 } });
    this.addProp('len_t2', () => t2, 360, 262, { solid: { x: 360, y: 278, w: 186, h: 14 } });
    L.addLight(530, 172, 80, 0xffcf70, 0.9, 0.14);
    ([[444, 178, 31], [520, 178, 32], [456, 270, 33]] as const).forEach(([x, y, sd], i) => {
      registerCharDef(`len_reader${i}`, villager(sd, 'len'));
      const a = this.npc(`reader${i}`, x, y, `len_reader${i}`, 'down');
      a.setDepth(y - 1);
      a.setData('ghost', true);
    });
    const plateH = this.addProp('len_plate_flash', () => {
      const p = radioPlate();
      p.map((r, g, b) => [Math.min(255, r + 90), Math.min(255, g + 90), Math.min(255, b + 110)]);
      return p;
    }, 236, 30, { depth: 5 });
    this.plate = plateH.img.setAlpha(0);
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.frozen || !this.plate) return;
        this.plate.setAlpha(0.6);
        this.tweens.add({ targets: this.plate, alpha: 0, duration: 260 });
      },
    });
    const s = this.g.store.state;
    if (!s.flags['stage.e2finale']) {
      this.npc('zina', HALL.zina, 224, 'zina', 'down');
      this.npc('maria', HALL.maria, 226, 'maria', 'side', true);
    }
  }

  override update(t: number, dt: number): void {
    super.update(t, dt);
    for (const [id, a] of this.actors) if (id.startsWith('reader')) a.setDepth(a.y - 4);
  }

  override create(data: { resumeRef?: string; from?: string; stage?: string }): void {
    super.create(data);
    this.addBreath(this.player);
    const s = this.g.store.state;
    if (data?.stage === 'finale' && !data.resumeRef) {
      this.afterCreate(data, 'epoch2#finale');
      return;
    }
    if (!s.flags['e2.started'] && !data?.resumeRef) {
      this.afterCreate(data, 'epoch2#start');
      return;
    }
    this.afterCreate(data);
  }

  protected override async lenCall(name: string, args: Record<string, unknown>): Promise<void> {
    switch (name) {
      case 'len.arrive':
        this.player.setAlpha(0);
        this.g.audio.sfx.play('portal');
        this.cameras.main.flash(500, 190, 205, 230, true);
        this.tweens.add({ targets: this.player, alpha: 1, duration: 900 });
        await this.g.wait(1000);
        return;
      case 'len.meetCamera':
        return;
      case 'len.finaleSetup':
        await this.finaleSetup(Boolean(args['resume']));
        return;
      case 'len.dublerAppear':
        await this.dublerAppear();
        return;
      case 'len.dublerLeave':
        await this.dublerLeave();
        return;
      case 'len.pagesBack':
        this.g.audio.sfx.play('page');
        this.cameras.main.flash(400, 232, 240, 255, true);
        glow(this, HALL.zina, 204, 0xe8f1ff, 1.4, 0.45).setDepth(9330);
        return;
      case 'len.pagesSmooth':
        this.g.audio.sfx.play('board_ok');
        this.cameras.main.flash(500, 255, 236, 170, true);
        this.frozen = true;
        this.light?.setAmbient(0xb09a8a);
        return;
      default:
    }
  }

  private async finaleSetup(resume: boolean): Promise<void> {
    this.g.store.setFlag('stage.e2finale', true);
    this.g.hud.setObjective(null);
    this.g.hints.setRule(null);
    for (const id of ['zina', 'maria']) {
      this.actors.get(id)?.destroy();
      this.actors.delete(id);
    }
    this.player.setPosition(300, 250);
    this.setDir(this.player, 'side', false);
    this.npc('zina', 206, 244, 'zina', 'side', false);
    this.npc('maria', 236, 236, 'maria', 'side', false);
    this.npc('prohorov', 352, 232, 'prohorov', 'side', true);
    if (resume) {
      this.npc('dubler', 420, 244, 'dubler', 'side', true, false);
      return;
    }
    this.npc('correspondent', HALL.door, 150, 'correspondent', 'down', false, false);
    this.g.audio.sfx.play('door');
    await this.perform({ t: 'moveTo', who: 'correspondent', x: 420, y: 244, speed: 46 });
    this.setDir(this.actors.get('correspondent')!, 'side', true);
  }

  private freeze(on: boolean): void {
    for (const id of ['zina', 'maria', 'prohorov']) {
      const sp = this.actors.get(id)?.getData('sprite') as Phaser.GameObjects.Sprite | undefined;
      if (!sp) continue;
      if (on) sp.setTint(FROZEN_TINT).anims.pause();
      else sp.clearTint().anims.resume();
    }
  }

  private async dublerAppear(): Promise<void> {
    const pos = this.actors.get('correspondent');
    const x = pos?.x ?? 420, y = pos?.y ?? 244;
    const d = this.npc('dubler', x, y, 'dubler', 'side', true, false);
    d.setAlpha(0);
    this.freeze(true);
    this.g.audio.sfx.play('glitch');
    this.cameras.main.flash(220, 255, 211, 107, true);
    if (!this.g.settings.data.reducedEffects) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 900, reverse: true, depth: DEPTH_FX });
    d.setAlpha(1);
    glow(this, d.x, d.y - 18, 0xffd36b, 1.6, 0.25).setDepth(9330);
  }

  private async dublerLeave(): Promise<void> {
    this.freeze(false);
    const d = this.actors.get('dubler');
    if (!d) return;
    this.actors.delete('dubler');
    d.setVisible(false);
    if (!this.g.settings.data.reducedEffects) await crumble(this, charFrameBuffer(getCharDef('dubler')!, 'idle_0', 'dubler', 'side'), d.x, d.y, { flipX: true, ms: 1000, depth: DEPTH_FX });
    d.destroy();
  }
}


export class LenYard extends LenBase {
  protected override worldW = LYARD.W;
  protected override worldH = LYARD.H;
  protected override walk = { x: 12, y: LYARD.BASE + 14, w: LYARD.W - 24, h: LYARD.H - LYARD.BASE - 22 };
  protected indoor = false;

  constructor() {
    super('len_yard');
  }
  protected override interactableDefs(): Interactable[] {
    return YARD_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return YARD_TRIGGERS;
  }
  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: YARD.doorHall, y: 176, dir: 'down' };
  }

  protected buildWorld(): void {
    const L = this.setupLighting(0x8a96b4);
    this.addGround('len_yard_ground', yardGround);
    this.addProp('len_stairdoor', stairDoor, YARD.doorHall - 22, LYARD.BASE - 66, { depth: LYARD.BASE });
    this.addProp('len_shed', shed, 650, 96, { solid: { x: 650, y: 150, w: 96, h: 16 } });
    this.addProp('len_furn', furniturePile, YARD.block - 80, 210, { solid: { x: YARD.block - 78, y: 230, w: 56, h: 12 } });
    this.addProp('len_block', chopBlock, YARD.block + 4, 226, { solid: { x: YARD.block + 6, y: 234, w: 18, h: 8 } });
    this.addProp('len_ysled', waterSled, 240, 300, { solid: true });
    this.addProp('len_ysand', () => sandbags(80), 140, 330, { solid: true });
    this.addProp('len_ywood', woodPile, 600, 300, { solid: true });
    this.addProp('len_arch', archway, 330, LYARD.BASE - 96, { depth: LYARD.BASE - 1 });
    this.addProp('len_tree', () => bareTree(110, 3), 120, 160, { solid: { x: 162, y: 264, w: 10, h: 6 } });
    this.addProp('len_tree2', () => bareTree(90, 9), 700, 220, { solid: { x: 734, y: 306, w: 10, h: 6 } });
    this.addProp('len_bench', streetBench, 420, 300, { solid: true });
    this.addProp('len_pump', waterPump, 520, 296, { solid: { x: 522, y: 326, w: 22, h: 8 } });
    this.addProp('len_lamp1', lampPost, 250, 150, { solid: { x: 256, y: 214, w: 8, h: 6 } });
    this.addProp('len_lamp2', lampPost, 690, 150, { solid: { x: 696, y: 214, w: 8, h: 6 } });
    this.addProp('len_notice', noticeBoard, 486, LYARD.BASE - 40, { depth: LYARD.BASE });
    ([[40, 200, 70], [460, 180, 90], [300, 360, 120], [620, 350, 100]] as const).forEach(([x, y, w], i) => this.addProp(`len_drift${i}`, () => drift(w), x, y, { depth: y + 2 }));
    ([[560, 176], [574, 182]] as const).forEach(([x, y], i) => this.addProp(`len_barrel${i}`, () => barrelL(), x, y, { solid: true }));
    L.addLight(400, 0, 400, 0xb8c8e8, 0.4, 0, 0.8);
    snow(this, { width: LYARD.W, height: LYARD.H, wind: 4 });
    const p = this.npc('prohorov', YARD.block + 24, 236, 'prohorov', 'side', true);
    this.setAnim(p, 'talk');
    this.time.addEvent({ delay: 2400, loop: true, callback: () => {
      this.g.audio.sfx.play('step_wood');
      this.cameras.main.shake(60, 0.0008);
    } });
  }

  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    this.addBreath(this.player);
    this.afterCreate(data);
  }
}


export class LenCellar extends LenBase {
  protected indoor = true;
  protected override worldW = CELLAR.W;
  protected override worldH = CELLAR.H;
  protected override walk = { x: 14, y: CELLAR.FLOOR_Y + 8, w: CELLAR.W - 28, h: CELLAR.H - CELLAR.FLOOR_Y - 16 };
  private sledH: PropHandle | null = null;

  constructor() {
    super('len_cellar');
  }
  protected override interactableDefs(): Interactable[] {
    return CELLAR_INTERACTABLES;
  }
  protected override triggerDefs(): TriggerZone[] {
    return CELLAR_TRIGGERS;
  }
  protected override spawnPoint(): { x: number; y: number; dir?: Dir } {
    return { x: 120, y: 290, dir: 'up' };
  }

  protected buildWorld(): void {
    const L = this.setupLighting(0x4a4a66);
    this.addGround('len_cellar_ground', cellarGround);
    for (const [x, i] of [[180, 0], [320, 1], [480, 2]] as const) {
      this.addProp('len_lamp', kerosene, x - 6, 40, { depth: 60 });
      L.addLight(x, 160, 190, 0xffcf70, 1.2 - i * 0.1, 0.12);
    }
    this.addProp('len_bunk1', bunk, 20, 90, { solid: { x: 20, y: 132, w: 70, h: 10 } });
    this.addProp('len_bunk2', bunk, 100, 90, { solid: { x: 100, y: 132, w: 70, h: 10 } });
    this.addProp('len_cchair1', chairBlanket, 196, 112, { solid: { x: 198, y: 140, w: 20, h: 8 } });
    this.addProp('len_cstool1', stool, 236, 128, { solid: true });
    this.addProp('len_cbooks', () => bookPile(7), 256, 122, { solid: true });
    this.addProp('len_ccoat', coatRack, 440, 76, { depth: 132 });
    this.addProp('len_cchair2', chairBlanket, 470, 112, { solid: { x: 472, y: 140, w: 20, h: 8 } });
    this.addProp('len_cwater', waterSled, 580, 290, { solid: true });
    this.addProp('len_cbooks2', () => bookPile(8), 40, 300, { solid: true });
    this.addProp('len_cstool2', stool, 120, 316, { solid: true });
    this.addProp('len_sand', () => sandbags(110), 530, 150, { solid: { x: 530, y: 156, w: 110, h: 12 } });
    this.addProp('len_seeds', seedBoxes, 180, 236, { solid: true });
    this.addProp('len_papers', papersStack, 284, 238, { solid: true });
    this.addProp('len_logs', woodPile, 484, 244, { solid: true });
    this.sledH = this.addProp('len_sled', sled, 372, 244, { solid: { x: 374, y: 258, w: 50, h: 8 } });
    this.npc('prohorov', 80, 220, 'prohorov', 'down');
    this.npc('botanist', 200, 226, 'botanist', 'down');
    this.npc('maria', 300, 226, 'maria', 'down');
    this.npc('antonina', 500, 226, 'antonina', 'down');
  }

  override create(data: { resumeRef?: string; from?: string }): void {
    super.create(data);
    this.addBreath(this.player);
    this.afterCreate(data);
  }

  protected override applyStage(): void {
    this.g.bus.emit('objective:changed', { text: 'Реши, что спасти' });
    this.g.hints.setRule(this.g.hintRules['e2_night'] ?? null);
  }

  protected override async lenCall(name: string, args: Record<string, unknown>): Promise<void> {
    if (name !== 'len.load') return;
    const what = String(args['what']);
    this.g.audio.sfx.play('step_wood');
    const cargoArt = what === 'grain' ? seedBoxes : what === 'voices' ? papersStack : woodPile;
    const cargo = this.addProp(`len_cargo_${what}`, cargoArt, 380, 226, { depth: 262 });
    await this.g.wait(600);
    const targets = [this.sledH?.img, cargo.img].filter(Boolean);
    await new Promise<void>((resolve) => {
      this.tweens.add({ targets, x: '+=240', y: '-=110', duration: 2400 / this.g.timeScale, ease: 'Sine.easeIn', onComplete: () => resolve() });
    });
    cargo.destroy();
    this.sledH?.destroy();
    this.sledH = null;
  }
}

export const LEN_SCENES = [LenHall, LenYard, LenCellar];
