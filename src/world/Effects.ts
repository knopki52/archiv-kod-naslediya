import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config';
import { mulberry32, valueNoise } from '../gfx/Noise';
import { unpack } from '../gfx/Palette';
import type { PixelCanvas } from '../gfx/PixelCanvas';

export interface CrumbleOptions {
  block?: number;
  ms?: number;
  seed?: number;
  scale?: number;
  flipX?: boolean;
  origin?: [number, number];
  depth?: number;
  wind?: number;
  reverse?: boolean;
  maxBlocks?: number;
}

export function crumble(scene: Phaser.Scene, buf: PixelCanvas, x: number, y: number, opts: CrumbleOptions = {}): Promise<void> {
  const block = opts.block ?? 2;
  const ms = opts.ms ?? 1000;
  const scale = opts.scale ?? 1;
  const rnd = mulberry32(opts.seed ?? 7);
  const [ox, oy] = opts.origin ?? [0.5, 1];
  const left = x - buf.w * scale * ox;
  const top = y - buf.h * scale * oy;
  const blocks: { r: Phaser.GameObjects.Rectangle; dx: number; dy: number; delay: number; tx: number; ty: number }[] = [];
  const maxBlocks = opts.maxBlocks ?? 700;
  const size = block * scale;
  const cells: { cx: number; cy: number; color: number }[] = [];
  for (let by = 0; by < buf.h; by += block) {
    for (let bx = 0; bx < buf.w; bx += block) {
      const px = buf.get(opts.flipX ? buf.w - 1 - bx : bx, by);
      if (!(px >>> 24)) continue;
      const [r, g, b] = unpack(px);
      cells.push({ cx: bx, cy: by, color: (r << 16) | (g << 8) | b });
    }
  }
  const stride = Math.max(1, Math.ceil(cells.length / maxBlocks));
  for (let i = 0; i < cells.length; i += stride) {
    const c = cells[i]!;
    const bx = left + c.cx * scale;
    const by = top + c.cy * scale;
    const n = valueNoise(c.cx, c.cy, 5, opts.seed ?? 7);
    const delay = (n * 0.55 + (c.cy / buf.h) * 0.25) * ms * 0.7;
    const wind = opts.wind ?? 20;
    const rect = scene.add.rectangle(bx, by, size, size, c.color).setOrigin(0, 0).setDepth(opts.depth ?? 9500);
    const dx = (rnd() - 0.3) * 30 + wind * 0.3;
    const dy = -(10 + rnd() * 36);
    blocks.push({ r: rect, dx, dy, delay, tx: bx, ty: by });
  }
  return new Promise((resolve) => {
    if (blocks.length === 0) {
      resolve();
      return;
    }
    let done = 0;
    const finish = () => {
      if (++done === blocks.length) resolve();
    };
    for (const b of blocks) {
      const fall = ms * 0.45;
      if (opts.reverse) {
        b.r.setPosition(b.tx + b.dx * 2, b.ty + b.dy * 2).setAlpha(0);
        scene.tweens.add({
          targets: b.r, x: b.tx, y: b.ty, alpha: 1,
          delay: b.delay * 0.6, duration: ms * 0.5, ease: 'Cubic.easeOut',
          onComplete: () => {
            b.r.destroy();
            finish();
          },
        });
      } else {
        scene.tweens.add({
          targets: b.r, x: b.tx + b.dx, alpha: 0, delay: b.delay, duration: fall, ease: 'Sine.easeIn',
        });
        scene.tweens.add({
          targets: b.r, y: { value: b.ty + b.dy, duration: fall * 0.4, ease: 'Quad.easeOut' }, delay: b.delay,
          onComplete: () => {
            scene.tweens.add({
              targets: b.r, y: b.ty + b.dy + 18, duration: fall * 0.6, ease: 'Quad.easeIn',
              onComplete: () => {
                b.r.destroy();
                finish();
              },
            });
          },
        });
      }
    }
  });
}

export interface SnowOptions {
  width?: number;
  height?: number;
  quantity?: number;
  wind?: number;
}

export function snow(scene: Phaser.Scene, opts: SnowOptions = {}): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const w = opts.width ?? VIEW_W;
  const h = opts.height ?? VIEW_H;
  const wind = opts.wind ?? 10;
  const layer = (depth: number, speed: number, scale: number, freq: number, alpha: number) =>
    scene.add
      .particles(0, -4, 'px', {
        x: { min: -20, max: w + 20 },
        lifespan: (h / speed) * 1000 + 600,
        speedY: { min: speed * 0.8, max: speed * 1.2 },
        speedX: { min: wind - 6, max: wind + 6 },
        scale,
        alpha: { start: alpha, end: alpha * 0.4 },
        frequency: freq,
        quantity: opts.quantity ?? 1,
      })
      .setDepth(depth);
  return [layer(8000, 22, 0.5, 70, 0.6), layer(9400, 46, 1, 140, 0.95)];
}

export function breath(scene: Phaser.Scene, actor: Phaser.GameObjects.Container, offset = { x: 8, y: -28 }, periodMs = 1900): () => void {
  const emitter = scene.add.particles(0, 0, 'puff', {
    lifespan: 1100,
    speedX: { min: 6, max: 14 },
    speedY: { min: -9, max: -3 },
    scale: { start: 0.45, end: 1.2 },
    alpha: { start: 0.55, end: 0 },
    emitting: false,
  }).setDepth(9000);
  const ev = scene.time.addEvent({
    delay: periodMs + Math.random() * 500,
    loop: true,
    callback: () => {
      if (!actor.active || !actor.visible) return;
      const dir = (actor.getData('dir') as string | undefined) ?? 'down';
      const flip = Boolean(actor.getData('flip'));
      const dx = dir === 'side' ? (flip ? -offset.x : offset.x) : dir === 'up' ? 0 : 2;
      emitter.emitParticleAt(actor.x + dx, actor.y + offset.y + (dir === 'up' ? -2 : 0), 1);
    },
  });
  return () => {
    ev.remove();
    emitter.destroy();
  };
}

export function dust(scene: Phaser.Scene, width = 960, height = VIEW_H): Phaser.GameObjects.Particles.ParticleEmitter {
  return scene.add
    .particles(0, 0, 'px', {
      x: { min: -10, max: width },
      y: { min: height * 0.55, max: height },
      lifespan: 3200,
      speedX: { min: 40, max: 90 },
      speedY: { min: -4, max: 6 },
      scale: { start: 1, end: 2 },
      alpha: { start: 0.35, end: 0 },
      tint: 0xd9c29a,
      frequency: 45,
    })
    .setDepth(8500);
}

export function embers(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
  return scene.add
    .particles(x, y, 'px', {
      lifespan: { min: 600, max: 1400 },
      speedY: { min: -28, max: -10 },
      speedX: { min: -8, max: 8 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xff7a2f, 0xffcf70, 0xff9a40],
      frequency: 220,
    })
    .setDepth(9000);
}

export function glow(scene: Phaser.Scene, x: number, y: number, color = 0xffb347, scale = 1.2, alpha = 0.55): Phaser.GameObjects.Image {
  return scene.add.image(x, y, 'halo').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setScale(scale).setAlpha(alpha).setDepth(8200);
}

export interface LightDef {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
  flicker: number;
  phase: number;
  sq: number;
}

export interface EmitterDef {
  key: string;
  x: number;
  y: number;
  alpha: number;
  visible: boolean;
  flip: boolean;
}

export class Lighting {
  private rt: Phaser.GameObjects.RenderTexture;
  readonly lights: LightDef[] = [];
  readonly emitters: EmitterDef[] = [];
  private mask: Phaser.GameObjects.Image;
  private t = 0;
  private stamp: Phaser.GameObjects.Image;

  constructor(
    private scene: Phaser.Scene,
    private ambient = 0x2a2f55,
    private ambientAlpha = 1,
  ) {
    this.rt = scene.add.renderTexture(0, 0, VIEW_W, VIEW_H).setOrigin(0, 0).setScrollFactor(0).setDepth(9200).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.stamp = scene.make.image({ key: 'light', add: false }).setOrigin(0.5);
    this.stamp.setBlendMode(Phaser.BlendModes.ADD);
    this.mask = scene.make.image({ key: 'light', add: false }).setOrigin(0);
    this.mask.setBlendMode(Phaser.BlendModes.ADD).setTintFill(0xffffff);
  }

  addEmitter(key: string, x: number, y: number, alpha = 1, flip = false): EmitterDef {
    const e: EmitterDef = { key, x, y, alpha, visible: true, flip };
    this.emitters.push(e);
    return e;
  }

  setAmbient(color: number, alpha = 1): void {
    this.ambient = color;
    this.ambientAlpha = alpha;
  }

  get ambientColor(): number {
    return this.ambient;
  }

  addLight(x: number, y: number, radius = 60, color = 0xffc070, intensity = 1, flicker = 0.08, sq = 1.35): LightDef {
    const l: LightDef = { x, y, radius, color, intensity, flicker, phase: Math.random() * 10, sq };
    this.lights.push(l);
    return l;
  }

  removeLight(l: LightDef | null | undefined): void {
    if (!l) return;
    const i = this.lights.indexOf(l);
    if (i >= 0) this.lights.splice(i, 1);
  }

  update(dtMs: number, reduced: boolean): void {
    this.t += dtMs / 1000;
    const cam = this.scene.cameras.main;
    this.rt.fill(this.ambient, this.ambientAlpha);
    for (const l of this.lights) {
      if (l.intensity <= 0) continue;
      const f = reduced ? 1 : 1 + Math.sin(this.t * 9 + l.phase) * l.flicker * 0.5 + Math.sin(this.t * 23 + l.phase * 2) * l.flicker * 0.5;
      const s = (l.radius * 2 * f) / 128;
      const sx = l.x - cam.scrollX, sy = l.y - cam.scrollY;
      if (sx < -l.radius || sy < -l.radius || sx > VIEW_W + l.radius || sy > VIEW_H + l.radius) continue;
      this.stamp.setScale(s, s / l.sq).setTint(l.color).setAlpha(Math.min(1, l.intensity));
      this.rt.draw(this.stamp, sx, sy);
      if (l.intensity > 1) {
        this.stamp.setAlpha(Math.min(1, l.intensity - 1));
        this.rt.draw(this.stamp, sx, sy);
      }
    }
    for (const e of this.emitters) {
      if (!e.visible || e.alpha <= 0) continue;
      this.mask.setTexture(e.key).setTintFill(0xffffff).setAlpha(e.alpha).setFlipX(e.flip);
      const sx = e.x - cam.scrollX, sy = e.y - cam.scrollY;
      if (sx > VIEW_W || sy > VIEW_H || sx + this.mask.width < 0 || sy + this.mask.height < 0) continue;
      this.rt.draw(this.mask, sx, sy);
      this.rt.draw(this.mask, sx, sy);
    }
  }

  destroy(): void {
    this.rt.destroy();
    this.stamp.destroy();
    this.mask.destroy();
  }
}
