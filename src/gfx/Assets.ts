import Phaser from 'phaser';
import type { ByteForm } from '../content/types';
import { CHAR_IDS, getCharDef, type CharDef } from './characters';
import type { PixelCanvas } from './PixelCanvas';
import { byteSprite, drawChar, FH, FW, type Dir } from './td/chars';
import { blurPx, bayer, Px } from './td/px';

export function ensureTexture(scene: Phaser.Scene, key: string, build: () => PixelCanvas | Px): void {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, build().toCanvas());
}

export const DIRS: Dir[] = ['down', 'up', 'side'];
export const FRAME_NAMES = ['idle_0', 'idle_1', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'talk_0', 'talk_1', 'react_0'] as const;
export type FrameName = (typeof FRAME_NAMES)[number];

function frameOf(def: CharDef, dir: Dir, name: FrameName): Px {
  switch (name) {
    case 'idle_1': return drawChar(def, dir, 0, { blink: true });
    case 'walk_0': return drawChar(def, dir, 0);
    case 'walk_1': return drawChar(def, dir, 1);
    case 'walk_2': return drawChar(def, dir, 2);
    case 'walk_3': return drawChar(def, dir, 3);
    case 'talk_0': return drawChar(def, dir, 0, { talk: true });
    case 'react_0': return drawChar(def, dir, 2);
    default: return drawChar(def, dir, 0);
  }
}

const frameCache = new Map<string, PixelCanvas>();

export function charFrameBuffer(def: CharDef, _name: string = 'idle_0', key?: string, dir: Dir = 'down'): PixelCanvas {
  const k = key ? `${key}:${dir}` : '';
  if (k && frameCache.has(k)) return frameCache.get(k)!;
  const buf = drawChar(def, dir, 0).toPixelCanvas();
  if (k) frameCache.set(k, buf);
  return buf;
}

export function charTextureKey(id: string): string {
  return `char_${id}`;
}

export function byteTextureKey(form: ByteForm): string {
  return `byte_${form}`;
}

export function ensureCharacter(scene: Phaser.Scene, id: string): boolean {
  const def = getCharDef(id);
  if (!def) return false;
  const key = charTextureKey(id);
  if (scene.textures.exists(key)) return true;
  const n = FRAME_NAMES.length;
  const sheet = new Px(FW * n, FH * DIRS.length);
  DIRS.forEach((dir, j) => FRAME_NAMES.forEach((name, i) => sheet.blit(frameOf(def, dir, name), i * FW, j * FH)));
  const tex = scene.textures.addCanvas(key, sheet.toCanvas())!;
  DIRS.forEach((dir, j) => FRAME_NAMES.forEach((name, i) => tex.add(`${dir}_${name}`, 0, i * FW, j * FH, FW, FH)));
  const anims = scene.anims;
  for (const dir of DIRS) {
    const f = (names: string[]) => names.map((frame) => ({ key, frame: `${dir}_${frame}` }));
    anims.create({ key: `${id}_idle_${dir}`, frames: [{ key, frame: `${dir}_idle_0`, duration: 2400 + Math.floor(Math.random() * 1400) }, { key, frame: `${dir}_idle_1`, duration: 130 }], repeat: -1 });
    anims.create({ key: `${id}_walk_${dir}`, frames: f(['walk_0', 'walk_1', 'walk_2', 'walk_3']), frameRate: 9, repeat: -1 });
    anims.create({ key: `${id}_talk_${dir}`, frames: f(['talk_0', 'talk_1']), frameRate: 7, repeat: -1 });
    anims.create({ key: `${id}_react_${dir}`, frames: f(['react_0']), frameRate: 1, repeat: -1 });
  }
  return true;
}

export const BYTE_FORMS: ByteForm[] = ['drone', 'raven', 'collar', 'kestrel'];
const BYTE_FRAMES = 4;

export function byteBuffer(form: ByteForm): PixelCanvas {
  const s = byteSprite(form, 0);
  const c = s.p.clone();
  c.blit(s.e, 0, 0);
  return c.toPixelCanvas();
}

function registerByte(scene: Phaser.Scene, form: ByteForm): void {
  const key = byteTextureKey(form);
  if (scene.textures.exists(key)) return;
  const first = byteSprite(form, 0);
  const w = first.p.w, h = first.p.h;
  const sheet = new Px(w * BYTE_FRAMES, h);
  for (let i = 0; i < BYTE_FRAMES; i++) {
    const s = byteSprite(form, i);
    sheet.blit(s.p, i * w, 0).blit(s.e, i * w, 0);
  }
  const tex = scene.textures.addCanvas(key, sheet.toCanvas())!;
  for (let i = 0; i < BYTE_FRAMES; i++) tex.add(String(i), 0, i * w, 0, w, h);
  scene.anims.create({ key: `${key}_fly`, frames: Array.from({ length: BYTE_FRAMES }, (_, i) => ({ key, frame: String(i) })), frameRate: form === 'collar' ? 3 : 10, repeat: -1 });
}

function lightStamp(): Px {
  const S = 128, p = new Px(S, S), bands = 7;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const t = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2);
      if (t >= 1) continue;
      let f = (1 - t) * (1 - t);
      f = Math.floor(f * bands + bayer(x, y)) / bands;
      if (f <= 0) continue;
      p.set(x, y, '#ffffff', f);
    }
  return p;
}
function softStamp(): Px {
  const S = 64, p = new Px(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const t = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2);
      if (t < 1) p.set(x, y, '#ffffff', Math.pow(1 - t, 2.2));
    }
  return p;
}

function registerParticles(scene: Phaser.Scene): void {
  ensureTexture(scene, 'px', () => new Px(2, 2).rect(0, 0, 2, 2, '#ffffff'));
  ensureTexture(scene, 'px1', () => new Px(1, 1).rect(0, 0, 1, 1, '#ffffff'));
  ensureTexture(scene, 'soft', () => {
    const p = new Px(8, 8);
    p.ellipse(4, 4, 3.5, 3.5, '#ffffff', 0.6);
    p.ellipse(4, 4, 2, 2, '#ffffff');
    return p;
  });
  ensureTexture(scene, 'puff', () => {
    const p = new Px(12, 10);
    p.ellipse(6, 5, 5.5, 4.5, '#ffffff', 0.35);
    p.ellipse(6, 5, 3.5, 2.8, '#ffffff', 0.6);
    return p;
  });
  ensureTexture(scene, 'flake', () => new Px(3, 3).set(1, 0, '#ffffff').set(0, 1, '#ffffff').set(1, 1, '#ffffff').set(2, 1, '#ffffff').set(1, 2, '#ffffff'));
  ensureTexture(scene, 'light', lightStamp);
  ensureTexture(scene, 'halo', softStamp);
  ensureTexture(scene, 'shadow', () => {
    const p = new Px(16, 6);
    p.ellipseF(8, 3, 8, 3, (_nx, _ny, r2) => ['#000000', r2 < 0.45 ? 0.5 : 0.3]);
    return p;
  });
}

export function haloOf(e: Px, R = 5, gain = 1.6): Px {
  const pad = R * 3;
  const big = new Px(e.w + pad * 2, e.h + pad * 2);
  big.blit(e, pad, pad);
  return blurPx(big, R, 3, gain);
}

export function registerAllAssets(scene: Phaser.Scene): void {
  registerParticles(scene);
  CHAR_IDS.forEach((id) => ensureCharacter(scene, id));
  BYTE_FORMS.forEach((f) => registerByte(scene, f));
}
