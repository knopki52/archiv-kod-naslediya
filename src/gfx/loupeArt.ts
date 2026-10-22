import type { LoupeObject } from '../content/loupe';
import { loupeArt, type LoupeArtOut } from './td/art_ui';

export const LOUPE_W = 320;
export const LOUPE_H = 180;

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

const cache = new Map<string, LoupeArtOut>();

export function drawLoupeArt(kind: LoupeObject['art'], ctx: Ctx, scale: number, detail: boolean): void {
  let art = cache.get(kind);
  if (!art) {
    art = loupeArt(kind);
    cache.set(kind, art);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.px.toCanvas(), 0, 0, LOUPE_W * scale, LOUPE_H * scale);
  ctx.scale(scale, scale);
  for (const t of art.texts) {
    if (t.detailOnly && !detail) continue;
    if (t.baseOnly && detail) continue;
    ctx.globalAlpha = t.alpha ?? 1;
    ctx.fillStyle = t.color;
    ctx.font = `${t.font === 'Caveat' ? '700 ' : ''}${t.size}px "${t.font}", sans-serif`;
    ctx.fillText(t.s, t.x, t.y);
  }
  ctx.restore();
}
