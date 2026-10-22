import { describe, expect, it } from 'vitest';
import { bayer, fbm, hashString, mulberry32 } from '../../src/gfx/Noise';
import { lerpColor, pack, parseColor, shade, toHex, unpack } from '../../src/gfx/Palette';
import { PixelCanvas } from '../../src/gfx/PixelCanvas';

describe('Palette', () => {
  it('parseColor/toHex туда-обратно, поддержка #rgb и #rrggbbaa', () => {
    expect(toHex(parseColor('#5fe3ff'))).toBe('#5fe3ff');
    expect(toHex(parseColor('#fa0'))).toBe('#ffaa00');
    expect(unpack(parseColor('#11223380'))).toEqual([0x11, 0x22, 0x33, 0x80]);
  });
  it('shade и lerpColor', () => {
    expect(toHex(parseColor(shade('#808080', 1)))).toBe('#ffffff');
    expect(toHex(parseColor(shade('#808080', -1)))).toBe('#000000');
    expect(unpack(lerpColor(pack(0, 0, 0), pack(200, 100, 50), 0.5)).slice(0, 3)).toEqual([100, 50, 25]);
  });
});

describe('Noise', () => {
  it('ГПСЧ детерминирован', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(hashString('abc')).toBe(hashString('abc'));
  });
  it('bayer и fbm в диапазоне 0..1', () => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        for (const s of [4, 8] as const) {
          const v = bayer(x, y, s);
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThan(1);
        }
        const n = fbm(x, y, 8, 3);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('PixelCanvas', () => {
  it('rect, границы и подсчёт пикселей', () => {
    const c = new PixelCanvas(8, 8).rect(2, 2, 3, 2, '#ff0000');
    expect(c.opaqueCount()).toBe(6);
    c.rect(-5, -5, 100, 100, '#00ff00');
    expect(c.opaqueCount()).toBe(64);
  });

  it('line (Брезенхем) соединяет концы', () => {
    const c = new PixelCanvas(10, 10).line(0, 0, 9, 9, '#fff');
    expect(c.get(0, 0) >>> 24).toBe(255);
    expect(c.get(9, 9) >>> 24).toBe(255);
    expect(c.get(5, 5) >>> 24).toBe(255);
  });

  it('circle/ellipse заполняют центр', () => {
    const c = new PixelCanvas(21, 21).circle(10, 10, 6, '#fff');
    expect(c.get(10, 10) >>> 24).toBe(255);
    expect(c.get(0, 0) >>> 24).toBe(0);
  });

  it('poly заливает треугольник', () => {
    const c = new PixelCanvas(20, 20).poly([[2, 2], [18, 2], [10, 18]], '#fff');
    expect(c.get(10, 6) >>> 24).toBe(255);
    expect(c.get(2, 18) >>> 24).toBe(0);
  });

  it('outline обводит силуэт и не трогает внутренность', () => {
    const c = new PixelCanvas(8, 8).rect(3, 3, 2, 2, '#fff').outline('#000');
    expect(c.opaqueCount()).toBe(4 + 8);
    expect(unpack(c.get(2, 3))[0]).toBe(0);
    expect(unpack(c.get(3, 3))[0]).toBe(255);
  });

  it('полупрозрачные пиксели смешиваются', () => {
    const c = new PixelCanvas(2, 2).rect(0, 0, 2, 2, '#000000').px(0, 0, '#ffffff80');
    const [r] = unpack(c.get(0, 0));
    expect(r).toBeGreaterThan(100);
    expect(r).toBeLessThan(160);
  });

  it('градиент и дизеринг детерминированы', () => {
    const a = new PixelCanvas(16, 16).gradientV(0, 0, 16, 16, '#000000', '#ffffff', 4);
    const b = new PixelCanvas(16, 16).gradientV(0, 0, 16, 16, '#000000', '#ffffff', 4);
    expect([...a.data]).toEqual([...b.data]);
    expect(unpack(a.get(3, 15))[0]).toBeGreaterThan(unpack(a.get(3, 0))[0]);
    const d = new PixelCanvas(8, 8).fillDither(0, 0, 8, 8, '#000000', '#ffffff', 0.5);
    const whites = [...d.data].filter((p) => unpack(p)[0] === 255).length;
    expect(whites).toBeGreaterThan(24);
    expect(whites).toBeLessThan(40);
  });

  it('stamp: ASCII-спрайт и зеркало', () => {
    const rows = ['#.', '..'];
    const c = new PixelCanvas(2, 2).stamp(rows, { '#': '#ff0000' }, 0, 0);
    const f = new PixelCanvas(2, 2).stamp(rows, { '#': '#ff0000' }, 0, 0, true);
    expect(c.get(0, 0) >>> 24).toBe(255);
    expect(f.get(1, 0) >>> 24).toBe(255);
    expect(f.get(0, 0) >>> 24).toBe(0);
  });

  it('flipX/crop/blit', () => {
    const c = new PixelCanvas(4, 1).px(0, 0, '#fff');
    expect(c.flipX().get(3, 0) >>> 24).toBe(255);
    expect(c.crop(0, 0, 2, 1).w).toBe(2);
    const dst = new PixelCanvas(4, 4).blit(c, 1, 1);
    expect(dst.get(1, 1) >>> 24).toBe(255);
  });

  it('mapColors инвертирует', () => {
    const c = new PixelCanvas(1, 1).px(0, 0, '#102030').mapColors((r, g, b) => [255 - r, 255 - g, 255 - b]);
    expect(toHex(c.get(0, 0))).toBe('#efdfcf');
  });

  it('speckle воспроизводим по сиду', () => {
    const a = PixelCanvas.textured(16, 16, '#222222', ['#444444', '#666666'], 0.3, 9);
    const b = PixelCanvas.textured(16, 16, '#222222', ['#444444', '#666666'], 0.3, 9);
    expect([...a.data]).toEqual([...b.data]);
  });
});
