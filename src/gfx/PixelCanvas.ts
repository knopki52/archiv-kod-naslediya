import { bayer, mulberry32, type Rng } from './Noise';
import { lerpColor, OUTLINE, pack, parseColor, ramp, unpack, type Packed } from './Palette';

type ColorIn = string | number;

export class PixelCanvas {
  readonly data: Uint32Array;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint32Array(w * h);
  }

  clone(): PixelCanvas {
    const c = new PixelCanvas(this.w, this.h);
    c.data.set(this.data);
    return c;
  }

  clear(): this {
    this.data.fill(0);
    return this;
  }

  px(x: number, y: number, color: ColorIn): this {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const c = parseColor(color);
    const a = c >>> 24;
    if (a === 0) return this;
    const i = y * this.w + x;
    if (a === 255) this.data[i] = c;
    else {
      const dst = this.data[i]!;
      const da = dst >>> 24;
      if (da === 0) this.data[i] = c;
      else {
        const [r1, g1, b1] = unpack(dst);
        const [r2, g2, b2] = unpack(c);
        const t = a / 255;
        this.data[i] = pack(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t, Math.max(da, a));
      }
    }
    return this;
  }

  get(x: number, y: number): Packed {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y | 0) * this.w + (x | 0)]!;
  }

  rect(x: number, y: number, w: number, h: number, color: ColorIn): this {
    const c = parseColor(color);
    const opaque = c >>> 24 === 255;
    for (let yy = Math.max(0, y | 0); yy < Math.min(this.h, (y | 0) + h); yy++) {
      for (let xx = Math.max(0, x | 0); xx < Math.min(this.w, (x | 0) + w); xx++) {
        if (opaque) this.data[yy * this.w + xx] = c;
        else this.px(xx, yy, c);
      }
    }
    return this;
  }

  strokeRect(x: number, y: number, w: number, h: number, color: ColorIn): this {
    this.rect(x, y, w, 1, color);
    this.rect(x, y + h - 1, w, 1, color);
    this.rect(x, y, 1, h, color);
    this.rect(x + w - 1, y, 1, h, color);
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, color: ColorIn): this {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: ColorIn, fill = true): this {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx + 0.25) + (y * y) / (ry * ry + 0.25);
        if (fill ? d <= 1 : d <= 1 && d > 1 - 2 / Math.max(rx, ry)) this.px(cx + x, cy + y, color);
      }
    }
    return this;
  }

  circle(cx: number, cy: number, r: number, color: ColorIn, fill = true): this {
    return this.ellipse(cx, cy, r, r, color, fill);
  }

  poly(points: [number, number][], color: ColorIn): this {
    const ys = points.map((p) => p[1]);
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i]!;
        const [x2, y2] = points[(i + 1) % points.length]!;
        if ((y1 <= y + 0.5 && y2 > y + 0.5) || (y2 <= y + 0.5 && y1 > y + 0.5)) {
          xs.push(x1 + ((y + 0.5 - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let x = Math.round(xs[i]!); x < Math.round(xs[i + 1]!); x++) this.px(x, y, color);
      }
    }
    return this;
  }

  fillDither(x: number, y: number, w: number, h: number, a: ColorIn, b: ColorIn, level: number, size: 4 | 8 = 4): this {
    const ca = parseColor(a);
    const cb = parseColor(b);
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, bayer(xx, yy, size) < level ? cb : ca);
    }
    return this;
  }

  gradientV(x: number, y: number, w: number, h: number, top: ColorIn, bottom: ColorIn, steps = 5): this {
    const ct = parseColor(top);
    const cb = parseColor(bottom);
    const colors = Array.from({ length: steps }, (_, i) => lerpColor(ct, cb, steps === 1 ? 0 : i / (steps - 1)));
    for (let yy = 0; yy < h; yy++) {
      const pos = (yy / Math.max(1, h - 1)) * (steps - 1);
      const lo = Math.floor(pos);
      const frac = pos - lo;
      for (let xx = 0; xx < w; xx++) {
        const idx = bayer(x + xx, y + yy, 8) < frac ? Math.min(steps - 1, lo + 1) : lo;
        this.px(x + xx, y + yy, colors[idx]!);
      }
    }
    return this;
  }

  gradientH(x: number, y: number, w: number, h: number, left: ColorIn, right: ColorIn, steps = 5): this {
    const tmp = new PixelCanvas(h, w).gradientV(0, 0, h, w, left, right, steps);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.px(x + xx, y + yy, tmp.get(yy, xx));
    return this;
  }

  speckle(rng: Rng, colors: ColorIn[], density: number, x = 0, y = 0, w = this.w, h = this.h): this {
    const n = Math.floor(w * h * density);
    for (let i = 0; i < n; i++) this.px(x + Math.floor(rng() * w), y + Math.floor(rng() * h), colors[Math.floor(rng() * colors.length)]!);
    return this;
  }

  stamp(rows: string[], legend: Record<string, ColorIn | null>, x: number, y: number, flip = false): this {
    rows.forEach((row, ry) => {
      const len = row.length;
      for (let rx = 0; rx < len; rx++) {
        const ch = row[flip ? len - 1 - rx : rx]!;
        const col = legend[ch];
        if (col) this.px(x + rx, y + ry, col);
      }
    });
    return this;
  }

  blit(src: PixelCanvas, x = 0, y = 0, flipX = false): this {
    for (let yy = 0; yy < src.h; yy++) {
      for (let xx = 0; xx < src.w; xx++) {
        const c = src.data[yy * src.w + (flipX ? src.w - 1 - xx : xx)]!;
        if (c >>> 24) this.px(x + xx, y + yy, c);
      }
    }
    return this;
  }

  flipX(): PixelCanvas {
    const out = new PixelCanvas(this.w, this.h);
    out.blit(this, 0, 0, true);
    return out;
  }

  crop(x: number, y: number, w: number, h: number): PixelCanvas {
    const out = new PixelCanvas(w, h);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) out.data[yy * w + xx] = this.get(x + xx, y + yy);
    return out;
  }

  outline(color: ColorIn = OUTLINE, diagonals = false): this {
    const c = parseColor(color);
    const src = this.data.slice();
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[y * this.w + x]! >>> 24);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        const near = at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || (diagonals && (at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1)));
        if (near) this.data[y * this.w + x] = c;
      }
    }
    return this;
  }

  mapColors(fn: (r: number, g: number, b: number) => [number, number, number]): this {
    for (let i = 0; i < this.data.length; i++) {
      const p = this.data[i]!;
      if (!(p >>> 24)) continue;
      const [r, g, b, a] = unpack(p);
      const [nr, ng, nb] = fn(r, g, b);
      this.data[i] = pack(nr, ng, nb, a);
    }
    return this;
  }

  shadow(cx: number, cy: number, rx: number, ry: number, alpha = 90): this {
    return this.ellipse(cx, cy, rx, ry, pack(0, 0, 0, alpha));
  }

  opaqueCount(): number {
    let n = 0;
    for (const p of this.data) if (p >>> 24) n++;
    return n;
  }

  toImageData(): ImageData {
    const bytes = new Uint8ClampedArray(this.data.length * 4);
    bytes.set(new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength));
    return new ImageData(bytes, this.w, this.h);
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    c.getContext('2d')!.putImageData(this.toImageData(), 0, 0);
    return c;
  }

  toDataURL(): string {
    return this.toCanvas().toDataURL();
  }

  static textured(w: number, h: number, base: ColorIn, speck: ColorIn[], density: number, seed: number): PixelCanvas {
    return new PixelCanvas(w, h).rect(0, 0, w, h, base).speckle(mulberry32(seed), speck, density);
  }

  static rampOf(base: string, steps = 4): string[] {
    return ramp(base, steps);
  }
}
