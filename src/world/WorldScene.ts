import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config';
import { evalCond } from '../core/State';
import type { Game, WorldHost } from '../core/Game';
import type { ByteForm, Cond, Interactable, Step } from '../content/types';
import { el } from '../ui/Ui';
import { byteBuffer, byteTextureKey, charFrameBuffer, charTextureKey, ensureCharacter, ensureTexture, haloOf } from '../gfx/Assets';
import { getCharDef, SPEAKER_TO_CHAR, type CharId } from '../gfx/characters';
import type { Dir } from '../gfx/td/chars';
import { Px } from '../gfx/td/px';
import { crumble, Lighting, type EmitterDef } from './Effects';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorRect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface ActiveInteractable {
  def: Interactable;
  zone: Phaser.GameObjects.Zone;
  marker: Phaser.GameObjects.Image;
  hl: boolean;
  used: boolean;
}

export interface TriggerZone {
  id: string;
  x0: number;
  x1: number;
  y0?: number;
  y1?: number;
  cond?: Cond;
  onEnter: string;
}

export interface PropOpts {
  depth?: number;
  solid?: Rect | boolean;
  halo?: boolean | number;
  haloAlpha?: number;
  alpha?: number;
  flip?: boolean;
}
export interface PropHandle {
  img: Phaser.GameObjects.Image;
  e?: Phaser.GameObjects.Image;
  halo?: Phaser.GameObjects.Image;
  emitter?: EmitterDef;
  solid?: Rect;
  setVisible(v: boolean): void;
  setAlpha(a: number): void;
  destroy(): void;
}
export type ArtBuild = () => Px | { p: Px; e?: Px };

const PLAYER_SPEED = 84;
const INTERACT_RADIUS = 30;
export const DEPTH_LIGHT = 9200;
export const DEPTH_EMISSIVE = 9300;
export const DEPTH_HALO = 9310;
export const DEPTH_FX = 9400;

export abstract class WorldScene extends Phaser.Scene implements WorldHost {
  protected g!: Game;
  protected worldW = VIEW_W;
  protected worldH = VIEW_H;
  protected walk: Rect = { x: 16, y: 150, w: VIEW_W - 32, h: VIEW_H - 166 };
  protected solids: Rect[] = [];
  protected player!: Phaser.GameObjects.Container;
  protected actors = new Map<string, Phaser.GameObjects.Container>();
  protected interactables: ActiveInteractable[] = [];
  protected light: Lighting | null = null;
  private prompt!: HTMLElement;
  private nearest: ActiveInteractable | null = null;
  private autoTarget: ActiveInteractable | null = null;
  private autoStuck = 0;
  private releaseInput: (() => void) | null = null;
  private tweens2 = new Set<() => void>();
  protected byteActor: Phaser.GameObjects.Sprite | null = null;
  private byteShadow: Phaser.GameObjects.Image | null = null;
  protected byteForm: ByteForm = 'drone';
  private moving = new Set<string>();
  private byteTarget: { x: number; y: number } | null = null;
  protected byteAnchor: { x: number; y: number } | null = null;
  private byteT = 0;
  private stepClock = 0;
  private grain: Phaser.GameObjects.TileSprite | null = null;

  protected abstract buildWorld(): void;
  async call(_name: string, _args?: Record<string, unknown>): Promise<void> {}
  protected onSceneShutdown(): void {}
  protected interactableDefs(): Interactable[] {
    return [];
  }
  protected triggerDefs(): TriggerZone[] {
    return [];
  }
  protected speedMul = 1;
  protected spawnPoint(_from?: string): { x: number; y: number; dir?: Dir; flip?: boolean } {
    return { x: 60, y: this.walk.y + this.walk.h / 2 };
  }

  protected swapChar(actor: Phaser.GameObjects.Container, charId: string): void {
    ensureCharacter(this, charId);
    const sprite = actor.getData('sprite') as Phaser.GameObjects.Sprite;
    actor.setData('charId', charId);
    sprite.setTexture(charTextureKey(charId), `${(actor.getData('dir') as Dir) ?? 'down'}_idle_0`);
    this.setAnim(actor, 'idle', true);
  }

  protected themeKey(): 'archive' | 'nov' | 'len' | 'baik' | 'core' {
    return 'archive';
  }
  protected stepSound(): 'step_snow' | 'step_wood' | 'step_stone' | 'step_steppe' {
    return 'step_stone';
  }

  create(data: { resumeRef?: string; from?: string }): void {
    this.g = this.registry.get('game') as Game;
    this.g.world = this;
    this.actors = new Map();
    this.interactables = [];
    this.solids = [];
    this.moving.clear();
    this.nearest = null;
    this.autoTarget = null;
    this.byteTarget = null;
    this.byteAnchor = null;
    this.byteShadow = null;
    this.grain = null;
    this.light = null;
    this.tweens2.clear();
    this.cameras.main.setBackgroundColor('#05040a');
    this.g.ui.setTheme(this.themeKey());
    this.g.hud.showMenuButton(true);
    this.g.hud.setLoupe(Boolean(this.g.store.state.flags['hasLoupe']));
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.buildWorld();
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setRoundPixels(true);
    const sp = this.spawnPoint(data?.from);
    this.speedMul = 1;
    this.player = this.makeActor('player', sp.x, sp.y, this.playerChar());
    if (sp.dir) this.setDir(this.player, sp.dir, sp.flip);
    this.cameras.main.startFollow(this.player, true, 1, 1).setDeadzone(40, 24);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.byteActor = this.makeByte();
    this.interactableDefs().forEach((d) => this.addInteractable(d));
    this.addPost();

    this.prompt = el('div', 'panel world-prompt', this.g.ui.layers.hud);
    this.prompt.hidden = true;

    this.releaseInput = this.g.input.push({
      blocksMove: false,
      action: (a) => {
        if (a === 'interact' && this.nearest && !this.g.input.worldMuted) this.use(this.nearest);
        else if (a === 'journal') void this.g.openJournal();
        else if (a === 'pause') void this.g.openPause();
        return true;
      },
    });
    this.g.bus.emit('scene:enter', { key: this.scene.key });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onShutdown());
    if (data?.resumeRef) void this.g.runScript(data.resumeRef);
  }

  private onShutdown(): void {
    this.onSceneShutdown();
    this.light?.destroy();
    this.light = null;
    this.releaseInput?.();
    this.byteActor = null;
    this.prompt?.remove();
    this.tweens2.forEach((f) => f());
    this.g.bus.emit('scene:exit', { key: this.scene.key });
    if (this.g.world === this) this.g.world = null;
  }

  protected setupLighting(ambient: number): Lighting {
    this.light = new Lighting(this, ambient);
    return this.light;
  }

  private addPost(): void {
    ensureTexture(this, 'post_vignette', () => {
      const p = new Px(VIEW_W, VIEW_H);
      for (let y = 0; y < VIEW_H; y++)
        for (let x = 0; x < VIEW_W; x++) {
          const nx = (x / VIEW_W - 0.5) * 2, ny = (y / VIEW_H - 0.5) * 2;
          const v = Math.pow(Math.min(1, (nx * nx * 0.8 + ny * ny) / 1.7), 1.6);
          if (v > 0.02) p.set(x, y, '#05040c', v * 0.55);
        }
      return p;
    });
    ensureTexture(this, 'post_grain', () => {
      const p = new Px(128, 128);
      for (let i = 0; i < 128 * 128; i++) {
        const v = Math.random();
        if (v < 0.5) p.set(i % 128, Math.floor(i / 128), v < 0.25 ? '#000000' : '#ffffff', 0.5);
      }
      return p;
    });
    this.add.image(0, 0, 'post_vignette').setOrigin(0).setScrollFactor(0).setDepth(9700);
    this.addGrade();
    if (!this.g.settings.data.reducedEffects) {
      this.grain = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'post_grain').setOrigin(0).setScrollFactor(0).setDepth(9710).setAlpha(0.045);
    }
  }

  private addGrade(): void {
    const reduced = this.g.settings.data.reducedEffects;
    const theme = this.themeKey();
    const cam = this.cameras.main;
    if (!reduced && this.renderer.type === Phaser.WEBGL && cam.postFX) {
      const cm = cam.postFX.addColorMatrix();
      const sat = { archive: 1.18, nov: 1.14, len: 1.12, baik: 1.2, core: 1.25 }[theme];
      const con = { archive: 0.1, nov: 0.07, len: 0.12, baik: 0.08, core: 0.12 }[theme];
      cm.saturate(sat - 1, true);
      cm.contrast(con, true);
          }
    ensureTexture(this, 'fx_shaft', () => {
      const p = new Px(64, 256);
      for (let y = 0; y < 256; y++)
        for (let x = 0; x < 64; x++) {
          const edge = 1 - Math.abs(x / 63 - 0.5) * 2;
          const a = Math.pow(edge, 1.6) * (1 - y / 256) * 0.9;
          if (a > 0.01) p.set(x, y, '#ffffff', a);
        }
      return p;
    });
    ensureTexture(this, 'fx_fogband', () => {
      const p = new Px(VIEW_W, 90);
      for (let y = 0; y < 90; y++)
        for (let x = 0; x < VIEW_W; x++) {
          const v = Math.sin((y / 89) * Math.PI);
          const n = 0.55 + 0.45 * Math.sin(x / 37 + y / 11) * Math.sin(x / 91 - y / 7);
          p.set(x, y, '#ffffff', Math.max(0, v * v * n) * 0.5);
        }
      return p;
    });
    if (reduced) return;
    const shafts: Record<string, { color: number; xs: number[]; a: number } | undefined> = {
      archive: { color: 0xffd890, xs: [120, 300, 480, 640, 780], a: 0.1 },
      len: { color: 0xa8c4ff, xs: [150, 330, 520], a: 0.09 },
      core: { color: 0x9fe8ff, xs: [200, 440, 700], a: 0.09 },
    };
    const sh = shafts[theme];
    if (sh) {
      sh.xs.forEach((x, i) => {
        const img = this.add.image(x, -20, 'fx_shaft').setOrigin(0.5, 0).setScrollFactor(0).setDepth(9650)
          .setBlendMode(Phaser.BlendModes.ADD).setTint(sh.color).setAlpha(sh.a).setScale(1.7 + (i % 2) * 0.6, 1.5).setAngle(-14 + i * 3);
        this.tweens.add({ targets: img, alpha: sh.a * 0.45, duration: 2600 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 400 });
      });
    }
    const fog: Record<string, { color: number; a: number; y: number } | undefined> = {
      nov: { color: 0xdfe8ff, a: 0.14, y: VIEW_H - 120 },
      baik: { color: 0xffe2a8, a: 0.1, y: VIEW_H - 150 },
      len: { color: 0x8fa0c8, a: 0.1, y: VIEW_H - 110 },
    };
    const fg = fog[theme];
    if (fg) {
      const tile = this.add.tileSprite(0, fg.y, VIEW_W, 90, 'fx_fogband').setOrigin(0).setScrollFactor(0).setDepth(9640).setTint(fg.color).setAlpha(fg.a);
      this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, dt: number) => { tile.tilePositionX += dt * 0.012; });
    }
  }

  protected addProp(key: string, build: ArtBuild, x: number, y: number, opts: PropOpts = {}): PropHandle {
    let built: { p: Px; e?: Px } | null = null;
    const get = () => {
      if (!built) {
        const b = build();
        built = b instanceof Px ? { p: b } : b;
      }
      return built;
    };
    ensureTexture(this, key, () => get().p);
    const tex = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const h = tex.height;
    const depth = opts.depth ?? y + h;
    const img = this.add.image(x, y, key).setOrigin(0).setDepth(depth).setAlpha(opts.alpha ?? 1).setFlipX(Boolean(opts.flip));
    const handle: PropHandle = {
      img,
      setVisible(v: boolean) {
        img.setVisible(v);
        handle.e?.setVisible(v);
        handle.halo?.setVisible(v);
        if (handle.emitter) handle.emitter.visible = v;
      },
      setAlpha(a: number) {
        img.setAlpha(a);
        handle.e?.setAlpha(a);
        handle.halo?.setAlpha(a * ((handle.halo.getData('a0') as number | undefined) ?? 0.85));
        if (handle.emitter) handle.emitter.alpha = a;
      },
      destroy() {
        if (handle.emitter) handle.emitter.visible = false;
        img.destroy();
        handle.e?.destroy();
        handle.halo?.destroy();
      },
    };
    const eKey = `${key}__e`;
    if (!this.textures.exists(eKey) && !this.textures.exists(`${eKey}_none`)) {
      const e = get().e;
      if (e && !e.isEmpty()) {
        this.textures.addCanvas(eKey, e.toCanvas());
        const R = typeof opts.halo === 'number' ? opts.halo : 5;
        this.textures.addCanvas(`${key}__h`, haloOf(e, R).toCanvas());
      } else this.textures.addCanvas(`${eKey}_none`, new Px(1, 1).toCanvas());
    }
    if (this.textures.exists(eKey)) {
      handle.e = this.add.image(x, y, eKey).setOrigin(0).setDepth(this.light ? depth + 0.5 : DEPTH_EMISSIVE).setFlipX(Boolean(opts.flip));
      const em = this.light?.addEmitter(eKey, x, y, 1, Boolean(opts.flip));
      if (em) handle.emitter = em;
      if (opts.halo !== false) {
        const R = typeof opts.halo === 'number' ? opts.halo : 5;
        handle.halo = this.add.image(x - R * 3, y - R * 3, `${key}__h`).setOrigin(0).setDepth(DEPTH_HALO).setBlendMode(Phaser.BlendModes.ADD).setAlpha(opts.haloAlpha ?? 0.85).setFlipX(Boolean(opts.flip));
        handle.halo.setData('a0', opts.haloAlpha ?? 0.85);
      }
    }
    if (opts.solid) {
      const r = opts.solid === true ? { x: x + 2, y: y + h - 8, w: tex.width - 4, h: 8 } : opts.solid;
      this.solids.push(r);
      handle.solid = r;
    }
    return handle;
  }

  protected addAnimProp(key: string, frames: ArtBuild[], x: number, y: number, fps: number, opts: PropOpts = {}): PropHandle {
    const handles = frames.map((b, i) => this.addProp(`${key}_${i}`, b, x, y, { ...opts, solid: i === 0 ? opts.solid : undefined }));
    handles.forEach((h, i) => h.setVisible(i === 0));
    let cur = 0;
    let shown = true;
    const ev = this.time.addEvent({
      delay: 1000 / fps,
      loop: true,
      callback: () => {
        if (!shown) return;
        handles[cur]!.setVisible(false);
        cur = (cur + 1) % handles.length;
        handles[cur]!.setVisible(true);
      },
    });
    const first = handles[0]!;
    const handle: PropHandle = {
      img: first.img,
      e: first.e,
      halo: first.halo,
      solid: first.solid,
      setVisible(v: boolean) {
        shown = v;
        handles.forEach((h, i) => h.setVisible(v && i === cur));
      },
      setAlpha(a: number) {
        handles.forEach((h) => h.setAlpha(a));
      },
      destroy() {
        ev.remove();
        handles.forEach((h) => h.destroy());
      },
    };
    return handle;
  }

  protected addGround(key: string, build: ArtBuild, x = 0, y = 0, depth = 0): PropHandle {
    return this.addProp(key, build, x, y, { depth, halo: 6, haloAlpha: 0.5 });
  }

  setPlayerPos(x: number, y?: number): void {
    this.player.x = x;
    if (y !== undefined) this.player.y = y;
  }

  playerPos(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  protected playerChar(): string {
    return 'player';
  }

  protected makeActor(id: string, x: number, y: number, charId: string, dir: Dir = 'down', flip = false): Phaser.GameObjects.Container {
    ensureCharacter(this, charId);
    const def = getCharDef(charId)!;
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (!def.noShadow) parts.push(this.add.image(0, -1, 'shadow').setOrigin(0.5, 0.5));
    const sprite = this.add.sprite(0, 0, charTextureKey(charId), `${dir}_idle_0`).setOrigin(0.5, 1);
    parts.push(sprite);
    const c = this.add.container(Math.round(x), Math.round(y), parts);
    c.setDepth(y);
    c.setData('sprite', sprite);
    c.setData('charId', charId);
    c.setData('dir', dir);
    c.setData('flip', flip);
    sprite.setFlipX(flip);
    this.actors.set(id, c);
    this.setAnim(c, 'idle', true);
    return c;
  }

  protected setDir(actor: Phaser.GameObjects.Container, dir: Dir, flip = false): void {
    actor.setData('dir', dir);
    actor.setData('flip', dir === 'side' ? flip : false);
    (actor.getData('sprite') as Phaser.GameObjects.Sprite | undefined)?.setFlipX(dir === 'side' ? flip : false);
    const cur = (actor.getData('anim') as string | undefined) ?? 'idle';
    this.setAnim(actor, cur as 'idle', true);
  }

  protected faceTo(actor: Phaser.GameObjects.Container, x: number, y: number): void {
    const dx = x - actor.x, dy = y - actor.y;
    if (Math.abs(dx) >= Math.abs(dy) * 0.8) this.setDir(actor, 'side', dx < 0);
    else this.setDir(actor, dy < 0 ? 'up' : 'down');
  }

  protected setAnim(actor: Phaser.GameObjects.Container, anim: 'idle' | 'walk' | 'talk' | 'react', force = false): void {
    const sprite = actor.getData('sprite') as Phaser.GameObjects.Sprite | undefined;
    const charId = actor.getData('charId') as CharId | undefined;
    if (!sprite || !charId) return;
    const dir = (actor.getData('dir') as Dir | undefined) ?? 'down';
    actor.setData('anim', anim);
    const key = `${charId}_${anim}_${dir}`;
    if (force || sprite.anims.currentAnim?.key !== key) sprite.play(key);
  }

  setTalking(who: string, on: boolean): void {
    const id = who === 'mnema' ? 'player' : who;
    const actor = this.actors.get(id) ?? this.actors.get(SPEAKER_TO_CHAR[who] ?? '');
    if (!actor || this.moving.has(id)) return;
    this.setAnim(actor, on ? 'talk' : 'idle');
  }

  private makeByte(): Phaser.GameObjects.Sprite {
    const key = byteTextureKey(this.byteForm);
    this.byteShadow = this.add.image(this.player.x - 16, this.player.y, 'shadow').setScale(0.6).setAlpha(0.6).setDepth(this.player.y - 1);
    const sp = this.add.sprite(this.player.x - 16, this.player.y - 34, key, '0');
    sp.play(`${key}_fly`);
    sp.setDepth(9250);
    return sp;
  }

  protected async morphByte(form: ByteForm): Promise<void> {
    const b = this.byteActor;
    if (!b || form === this.byteForm) return;
    const reduced = this.g.settings.data.reducedEffects;
    b.setVisible(false);
    if (!reduced) await crumble(this, byteBuffer(this.byteForm), b.x, b.y, { block: 2, ms: 600, origin: [0.5, 0.5], depth: DEPTH_FX });
    this.byteForm = form;
    const key = byteTextureKey(form);
    b.setTexture(key, '0');
    b.play(`${key}_fly`);
    if (!reduced) await crumble(this, byteBuffer(form), b.x, b.y, { block: 2, ms: 600, origin: [0.5, 0.5], reverse: true, depth: DEPTH_FX });
    b.setVisible(true);
  }

  highlight(targetId: string, fly: boolean): void {
    const it = this.interactables.find((i) => i.def.id === targetId);
    const actor = this.actors.get(targetId);
    const x = it?.def.x ?? actor?.x;
    const y = it?.def.y ?? actor?.y;
    if (x === undefined || y === undefined) return;
    if (it) {
      it.hl = true;
      this.time.delayedCall(3200, () => {
        it.hl = false;
      });
    }
    this.byteTarget = fly ? { x, y: y - 40 } : null;
  }

  protected addInteractable(def: Interactable): void {
    const w = def.w ?? 24;
    const h = def.h ?? 24;
    const zone = this.add.zone(def.x, def.y - h / 2, w, h).setInteractive({ useHandCursor: true });
    ensureTexture(this, 'ui_mark', () => {
      const p = new Px(9, 9);
      p.poly([[4.5, 0], [9, 4.5], [4.5, 9], [0, 4.5]], '#1a1208');
      p.poly([[4.5, 1], [8, 4.5], [4.5, 8], [1, 4.5]], '#ffd36b');
      p.poly([[4.5, 2], [6, 3.5], [4.5, 5], [3, 3.5]], '#fff6d0');
      return p;
    });
    const marker = this.add.image(def.x, def.y - h - 6, 'ui_mark').setDepth(DEPTH_FX + 1).setVisible(false);
    this.tweens.add({ targets: marker, y: marker.y - 3, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.easeInOut' });
    const item: ActiveInteractable = { def, zone, marker, used: false, hl: false };
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const target = pointer.event?.target as HTMLElement | null | undefined;
      if (target && target.closest?.('#ui-root')) return;
      if (this.g.busy || this.g.choiceMenu.isOpen || this.g.input.worldMuted) return;
      if (this.g.input.move().x !== 0 || this.g.input.move().y !== 0) return;
      this.autoTarget = item;
      this.autoStuck = 0;
    });
    this.interactables.push(item);
  }

  private isEnabled(it: ActiveInteractable): boolean {
    const s = this.g.store.state;
    if (it.used && it.def.once) return false;
    if (it.def.visibleIf && !evalCond(s, it.def.visibleIf)) return false;
    return true;
  }

  private use(it: ActiveInteractable): void {
    const s = this.g.store.state;
    if (it.def.enabledIf && !evalCond(s, it.def.enabledIf)) {
      if (it.def.disabledHint) this.g.hud.toast(it.def.disabledHint);
      return;
    }
    it.used = true;
    this.prompt.hidden = true;
    this.faceTo(this.player, it.def.x, it.def.y - 4);
    void this.g.runScript(it.def.onUse);
  }

  override update(_t: number, dtMs: number): void {
    if (!this.player) return;
    const dt = (dtMs / 1000) * this.g.timeScale;
    const mv = this.g.input.move();
    let vx = mv.x;
    let vy = mv.y;
    if (this.autoTarget && vx === 0 && vy === 0 && !this.g.director.isRunning) {
      const t = this.autoTarget;
      const dx = t.def.x - this.player.x;
      const dy = t.def.y + 4 - this.player.y;
      if (Math.hypot(dx, dy) > INTERACT_RADIUS * 0.7 && this.autoStuck < 0.6) {
        const len = Math.hypot(dx, dy);
        vx = dx / len;
        vy = dy / len;
      } else {
        this.autoTarget = null;
        if (Math.hypot(dx, dy) < INTERACT_RADIUS * 1.4) this.use(t);
      }
    } else if (vx !== 0 || vy !== 0) this.autoTarget = null;

    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    if (vx !== 0 || vy !== 0) {
      this.g.hints.activity();
      this.byteTarget = null;
    }
    this.movePlayer(vx, vy, dt);
    this.updateByte(dt);
    this.checkTriggers();
    this.updatePrompt();
    this.actors.forEach((a) => a.setDepth(a.y));
    this.light?.update(dtMs, this.g.settings.data.reducedEffects);
    if (this.grain) this.grain.setTilePosition(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128));
  }

  private checkTriggers(): void {
    if (this.g.busy || this.g.director.isRunning) return;
    const s = this.g.store.state;
    for (const t of this.triggerDefs()) {
      const key = `trigger.${t.id}`;
      if (s.flags[key]) continue;
      if (t.cond && !evalCond(s, t.cond)) continue;
      if (this.player.x < t.x0 || this.player.x > t.x1) continue;
      if (t.y0 !== undefined && this.player.y < t.y0) continue;
      if (t.y1 !== undefined && this.player.y > t.y1) continue;
      this.g.store.setFlag(key, true);
      void this.g.runScript(t.onEnter);
      break;
    }
  }

  private updateByte(dt: number): void {
    const b = this.byteActor;
    if (!b) return;
    this.byteT += dt;
    const dir = (this.player.getData('dir') as Dir) ?? 'down';
    const flip = Boolean(this.player.getData('flip'));
    const behind = dir === 'side' ? (flip ? 16 : -16) : dir === 'up' ? 12 : -16;
    const goal = this.byteTarget ?? this.byteAnchor ?? { x: this.player.x + behind, y: this.player.y - 36 };
    const k = Math.min(1, dt * 3.5);
    b.x += (goal.x - b.x) * k;
    b.y += (goal.y + Math.sin(this.byteT * 3) * 2 - b.y) * k;
    if (this.byteShadow) {
      this.byteShadow.setPosition(Math.round(b.x), Math.round(b.y + 34)).setVisible(b.visible && b.alpha > 0.2 && this.byteForm !== 'collar');
      this.byteShadow.setDepth(b.y + 33);
    }
  }

  protected isFree(x: number, y: number): boolean {
    const w = this.walk;
    if (x < w.x || x > w.x + w.w || y < w.y || y > w.y + w.h) return false;
    const bx0 = x - 5, bx1 = x + 5, by0 = y - 4, by1 = y + 1;
    for (const r of this.solids) if (bx1 > r.x && bx0 < r.x + r.w && by1 > r.y && by0 < r.y + r.h) return false;
    for (const [id, a] of this.actors) {
      if (id === 'player' || !a.visible || a.getData('ghost')) continue;
      if (Math.abs(a.x - x) < 9 && Math.abs(a.y - y) < 5) return false;
    }
    return true;
  }

  private movePlayer(vx: number, vy: number, dt: number): void {
    const p = this.player;
    const sp = PLAYER_SPEED * this.speedMul * dt;
    const walking = vx !== 0 || vy !== 0;
    if (walking) {
      const ox = p.x, oy = p.y;
      const nx = p.x + vx * sp;
      if (this.isFree(nx, p.y)) p.x = nx;
      const ny = p.y + vy * sp;
      if (this.isFree(p.x, ny)) p.y = ny;
      const moved = Math.hypot(p.x - ox, p.y - oy);
      if (this.autoTarget && moved < sp * 0.2) this.autoStuck += dt;
      if (Math.abs(vx) > Math.abs(vy) * 0.9) this.setDirQuiet(p, 'side', vx < 0);
      else this.setDirQuiet(p, vy < 0 ? 'up' : 'down', false);
    }
    this.setAnim(p, walking ? 'walk' : 'idle');
    if (walking) {
      this.stepClock += dt;
      if (this.stepClock > 0.3) {
        this.stepClock = 0;
        this.g.audio.sfx.play(this.stepSound());
      }
    } else this.stepClock = 0.22;
  }

  private setDirQuiet(actor: Phaser.GameObjects.Container, dir: Dir, flip: boolean): void {
    if (actor.getData('dir') === dir && Boolean(actor.getData('flip')) === flip) return;
    actor.setData('dir', dir);
    actor.setData('flip', flip);
    (actor.getData('sprite') as Phaser.GameObjects.Sprite).setFlipX(flip);
    this.setAnim(actor, (actor.getData('anim') as 'idle') ?? 'idle', true);
  }

  private updatePrompt(): void {
    let best: ActiveInteractable | null = null;
    let bestD = INTERACT_RADIUS;
    for (const it of this.interactables) {
      if (!this.isEnabled(it)) {
        it.marker.setVisible(false);
        continue;
      }
      const d = Math.hypot(it.def.x - this.player.x, (it.def.y - this.player.y) * 1.2);
      if (d < bestD) {
        best = it;
        bestD = d;
      }
    }
    this.nearest = this.g.director.isRunning ? null : best;
    for (const it of this.interactables) if (this.isEnabled(it)) it.marker.setVisible(it === this.nearest || it.hl);
    if (this.nearest) {
      this.prompt.innerHTML = '';
      el('span', 'key', this.prompt).textContent = 'E';
      el('span', 'lbl', this.prompt).textContent = this.nearest.def.prompt;
      this.prompt.hidden = false;
    } else this.prompt.hidden = true;
  }

  async perform(step: Step): Promise<boolean> {
    switch (step.t) {
      case 'moveTo': {
        const actor = this.actors.get(step.who);
        if (!actor) return false;
        const p = this.moveActor(actor, step.x, step.y ?? actor.y, step.speed ?? PLAYER_SPEED);
        if (step.wait !== false) await p;
        return true;
      }
      case 'face': {
        const actor = this.actors.get(step.who);
        if (!actor) return false;
        const d = step.dir as string;
        if (d === 'u') this.setDir(actor, 'up');
        else if (d === 'd') this.setDir(actor, 'down');
        else this.setDir(actor, 'side', d === 'l');
        return true;
      }
      case 'morphByte':
        await this.morphByte(step.form);
        return true;
      case 'spawn': {
        const charId = (SPEAKER_TO_CHAR[step.npc] ?? step.npc) as string;
        if (!getCharDef(charId)) return false;
        const a = this.makeActor(step.npc, step.x ?? this.player.x + 30, step.y ?? this.player.y, charId);
        this.faceTo(a, this.player.x, this.player.y);
        return true;
      }
      case 'despawn': {
        const a = this.actors.get(step.npc);
        if (!a) return false;
        const charId = a.getData('charId') as string;
        this.actors.delete(step.npc);
        a.setVisible(false);
        if (!this.g.settings.data.reducedEffects) {
          await crumble(this, charFrameBuffer(getCharDef(charId)!, 'idle_0', charId, (a.getData('dir') as Dir) ?? 'down'), a.x, a.y, { flipX: Boolean(a.getData('flip')), ms: 900, depth: DEPTH_FX });
        }
        a.destroy();
        return true;
      }
      case 'fx':
        return this.playFx(step);
      case 'camera':
        if (step.action === 'shake') {
          if (!this.g.settings.data.reducedEffects) this.cameras.main.shake(step.ms ?? 300, 0.004);
          return true;
        }
        if (step.action === 'pan' && step.x !== undefined) {
          this.cameras.main.stopFollow();
          this.cameras.main.pan(step.x, step.y ?? this.cameras.main.midPoint.y, step.ms ?? 800, 'Sine.easeInOut');
          await this.g.wait(step.ms ?? 800);
          return true;
        }
        if (step.action === 'follow') {
          this.cameras.main.startFollow(this.player, true, 1, 1).setDeadzone(40, 24);
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  protected moveActor(actor: Phaser.GameObjects.Container, x: number, y: number, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const dist = Math.hypot(x - actor.x, y - actor.y);
      const id = [...this.actors.entries()].find(([, a]) => a === actor)?.[0] ?? '';
      if (dist < 1) {
        resolve();
        return;
      }
      this.faceTo(actor, x, y);
      this.moving.add(id);
      this.setAnim(actor, 'walk');
      const tween = this.tweens.add({
        targets: actor,
        x,
        y,
        duration: (dist / (speed * this.g.timeScale)) * 1000,
        onComplete: () => {
          this.moving.delete(id);
          this.setAnim(actor, 'idle');
          resolve();
        },
      });
      this.tweens2.add(() => tween.stop());
    });
  }

  private playFx(step: Extract<Step, { t: 'fx' }>): Promise<boolean> {
    const ms = step.ms ?? 400;
    const cam = this.cameras.main;
    return new Promise((resolve) => {
      switch (step.name) {
        case 'fade':
          cam.fadeOut(ms, 0, 0, 0);
          cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve(true));
          return;
        case 'flash':
          if (!this.g.settings.data.reducedEffects) cam.flash(ms, 255, 255, 255);
          resolve(true);
          return;
        case 'shake':
          if (!this.g.settings.data.reducedEffects) cam.shake(ms, 0.004);
          resolve(true);
          return;
        case 'glitch':
          this.g.screenGlitch(ms);
          resolve(true);
          return;
        case 'crumble': {
          const a = this.actors.get(step.target ?? '');
          if (!a) {
            resolve(false);
            return;
          }
          const charId = a.getData('charId') as string;
          a.setVisible(false);
          void crumble(this, charFrameBuffer(getCharDef(charId)!, 'idle_0', charId, (a.getData('dir') as Dir) ?? 'down'), a.x, a.y, { flipX: Boolean(a.getData('flip')), ms, depth: DEPTH_FX }).then(() => resolve(true));
          return;
        }
        default:
          resolve(false);
      }
    });
  }
}
