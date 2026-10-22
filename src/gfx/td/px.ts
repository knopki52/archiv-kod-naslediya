import { PixelCanvas } from '../PixelCanvas';

export type RGB = number[];
export type Col = string | readonly number[] | undefined;
export type Rng = () => number;
export type Pt = readonly [number, number];

export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(x: number, y: number, s: number): number {
  let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vnoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, s: number, oct = 4): number {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += vnoise(x * f, y * f, s + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number): number => BAYER4[(y & 3) * 4 + (x & 3)]!;

const hexCache = new Map<string, RGB>();
export function C(c: Col): RGB {
  if (c === undefined) return [0, 0, 0, 0];
  if (typeof c !== 'string') return c as RGB;
  let v = hexCache.get(c);
  if (v) return v;
  const s = c.replace('#', '');
  v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  if (s.length === 8) v.push(parseInt(s.slice(6, 8), 16) / 255);
  hexCache.set(c, v);
  return v;
}
export function rgb2hsl(c: RGB): [number, number, number] {
  const r = c[0]! / 255, g = c[1]! / 255, b = c[2]! / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function hsl2rgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r: number, g: number, b: number;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function toward(h: number, target: number, amt: number): number {
  const d = ((target - h + 540) % 360) - 180;
  return h + Math.sign(d) * Math.min(Math.abs(d), amt);
}
export function sh(c: Col, k: number): RGB {
  const [h, s, l] = rgb2hsl(C(c));
  if (k < 0) return hsl2rgb(toward(h, 255, -k * 40), Math.min(1, s + -k * 0.12), Math.max(0, l + k * 0.5 * Math.max(l, 0.25)));
  return hsl2rgb(toward(h, 50, k * 30), Math.max(0, s - k * 0.05), Math.min(1, l + k * 0.55 * (1 - l) + k * 0.05));
}
export type Ramp = [RGB, RGB, RGB, RGB, RGB];
export function ramp(c: Col): Ramp {
  return [sh(c, -0.55), sh(c, -0.28), C(c), sh(c, 0.3), sh(c, 0.6)];
}
export function mix(a: Col, b: Col, t: number): RGB {
  const x = C(a), y = C(b);
  return [Math.round(x[0]! + (y[0]! - x[0]!) * t), Math.round(x[1]! + (y[1]! - x[1]!) * t), Math.round(x[2]! + (y[2]! - x[2]!) * t)];
}
export function toNum(c: Col): number {
  const v = C(c);
  return (v[0]! << 16) | (v[1]! << 8) | v[2]!;
}

export interface BlitOpts {
  flip?: boolean;
  alpha?: number;
  tint?: Col;
  tintAmt?: number;
}

export class Px {
  readonly d: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) {
    this.d = new Uint8ClampedArray(Math.max(1, w * h * 4));
  }
  set(x: number, y: number, c: Col, a = 1): this {
    if (c === undefined) return this;
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return this;
    const v = C(c);
    if (v.length > 3) a *= v[3]!;
    if (a <= 0) return this;
    const i = (y * this.w + x) * 4, d = this.d;
    if (a >= 1) {
      d[i] = v[0]!;
      d[i + 1] = v[1]!;
      d[i + 2] = v[2]!;
      d[i + 3] = 255;
      return this;
    }
    const da = d[i + 3]! / 255, oa = a + da * (1 - a);
    if (oa <= 0) return this;
    d[i] = (v[0]! * a + d[i]! * da * (1 - a)) / oa;
    d[i + 1] = (v[1]! * a + d[i + 1]! * da * (1 - a)) / oa;
    d[i + 2] = (v[2]! * a + d[i + 2]! * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
    return this;
  }
  get(x: number, y: number): RGB | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    if (this.d[i + 3] === 0) return null;
    return [this.d[i]!, this.d[i + 1]!, this.d[i + 2]!, this.d[i + 3]! / 255];
  }
  alpha(x: number, y: number): number {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3]!;
  }
  rect(x: number, y: number, w: number, h: number, c: Col, a = 1): this {
    for (let yy = Math.floor(y); yy < y + h; yy++) for (let xx = Math.floor(x); xx < x + w; xx++) this.set(xx, yy, c, a);
    return this;
  }
  hl(x: number, y: number, w: number, c: Col, a = 1): this {
    return this.rect(x, y, w, 1, c, a);
  }
  vl(x: number, y: number, h: number, c: Col, a = 1): this {
    return this.rect(x, y, 1, h, c, a);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: Col, a = 1): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 10000; guard++) {
      this.set(x0, y0, c, a);
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
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Col, a = 1): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / (rx + 0.01), dy = (y + 0.5 - cy) / (ry + 0.01);
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, a);
      }
    return this;
  }
  ellipseF(cx: number, cy: number, rx: number, ry: number, f: (nx: number, ny: number, r2: number, x: number, y: number) => readonly [Col, number?] | null): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / (rx + 0.01), dy = (y + 0.5 - cy) / (ry + 0.01);
        const r2 = dx * dx + dy * dy;
        if (r2 <= 1) {
          const res = f(dx, dy, r2, x, y);
          if (res) this.set(x, y, res[0], res[1] ?? 1);
        }
      }
    return this;
  }
  ring(cx: number, cy: number, rx: number, ry: number, c: Col, a = 1, th = 1): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(r - 1) * Math.min(rx, ry) < th * 0.5) this.set(x, y, c, a);
      }
    return this;
  }
  poly(pts: readonly Pt[], c: Col, a = 1): this {
    if (pts.length < 3) return this;
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [];
      const sy = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i]!, [bx, by] = pts[(i + 1) % pts.length]!;
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]!); x < Math.round(xs[i + 1]!); x++) this.set(x, y, c, a);
    }
    return this;
  }
  dither(x: number, y: number, w: number, h: number, c: Col, level: number, a = 1): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (bayer(xx, yy) < level) this.set(xx, yy, c, a);
    return this;
  }
  gradV(x: number, y: number, w: number, h: number, cols: readonly Col[]): this {
    for (let yy = 0; yy < h; yy++) {
      const t = (yy / Math.max(1, h - 1)) * (cols.length - 1);
      const lo = Math.floor(t), f = t - lo;
      for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, cols[Math.min(cols.length - 1, bayer(x + xx, y + yy) < f ? lo + 1 : lo)]);
    }
    return this;
  }
  blit(src: Px, x: number, y: number, opt: BlitOpts = {}): this {
    const flip = opt.flip ?? false, alpha = opt.alpha ?? 1, tint = opt.tint, tintAmt = opt.tintAmt ?? 0;
    x = Math.round(x);
    y = Math.round(y);
    for (let yy = 0; yy < src.h; yy++)
      for (let xx = 0; xx < src.w; xx++) {
        const sx = flip ? src.w - 1 - xx : xx;
        const i = (yy * src.w + sx) * 4;
        const sa = src.d[i + 3]!;
        if (!sa) continue;
        let col: RGB = [src.d[i]!, src.d[i + 1]!, src.d[i + 2]!];
        if (tint !== undefined) col = mix(col, tint, tintAmt);
        this.set(x + xx, y + yy, col, (sa / 255) * alpha);
      }
    return this;
  }
  outline(k = -0.75, fixed: Col = undefined, alphaMin = 200, mixTo: Col = undefined): this {
    const src = new Uint8ClampedArray(this.d);
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[(y * this.w + x) * 4 + 3]!);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        let n: RGB | null = null;
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]] as const) {
          if (at(x + dx, y + dy) >= alphaMin) {
            const i = ((y + dy) * this.w + x + dx) * 4;
            n = [src[i]!, src[i + 1]!, src[i + 2]!];
            break;
          }
        }
        if (n) this.set(x, y, fixed ?? (mixTo !== undefined ? mix(n, mixTo, 0.74) : sh(n, k)));
      }
    return this;
  }
  clone(): Px {
    const p = new Px(this.w, this.h);
    p.d.set(this.d);
    return p;
  }
  crop(x: number, y: number, w: number, h: number): Px {
    const p = new Px(w, h);
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        const sx = x + xx, sy = y + yy;
        if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) continue;
        const i = (sy * this.w + sx) * 4, j = (yy * w + xx) * 4;
        p.d[j] = this.d[i]!;
        p.d[j + 1] = this.d[i + 1]!;
        p.d[j + 2] = this.d[i + 2]!;
        p.d[j + 3] = this.d[i + 3]!;
      }
    return p;
  }
  map(fn: (r: number, g: number, b: number, i: number) => readonly [number, number, number]): this {
    for (let i = 0; i < this.d.length; i += 4)
      if (this.d[i + 3]) {
        const r = fn(this.d[i]!, this.d[i + 1]!, this.d[i + 2]!, i / 4);
        this.d[i] = r[0];
        this.d[i + 1] = r[1];
        this.d[i + 2] = r[2];
      }
    return this;
  }
  isEmpty(): boolean {
    for (let i = 3; i < this.d.length; i += 4) if (this.d[i]) return false;
    return true;
  }
  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d')!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(this.d), this.w, this.h), 0, 0);
    return c;
  }
  toPixelCanvas(): PixelCanvas {
    const p = new PixelCanvas(this.w, this.h);
    for (let i = 0; i < this.w * this.h; i++) {
      const a = this.d[i * 4 + 3]!;
      if (!a) continue;
      p.data[i] = ((a << 24) | (this.d[i * 4 + 2]! << 16) | (this.d[i * 4 + 1]! << 8) | this.d[i * 4]!) >>> 0;
    }
    return p;
  }
}

export function castShadow(dst: Px, spr: Px, x: number, y: number, baseY: number, sx: number, sy: number, col: Col = '#000000', a = 0.35, mask?: (gx: number, gy: number) => boolean): void {
  const done = new Set<number>();
  for (let yy = 0; yy < spr.h; yy++)
    for (let xx = 0; xx < spr.w; xx++) {
      if (spr.alpha(xx, yy) < 128) continue;
      const h = baseY - yy;
      if (h < 0) continue;
      const gx = Math.round(x + xx + h * sx), gy = Math.round(y + baseY + h * sy);
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        const k = (gy + oy) * 100000 + gx + ox;
        if (done.has(k)) continue;
        done.add(k);
        if (mask && !mask(gx + ox, gy + oy)) continue;
        dst.set(gx + ox, gy + oy, col, a);
      }
    }
}

export function blurPx(src: Px, R: number, passes = 3, gain = 1): Px {
  const W = src.w, H = src.h;
  let f: Float32Array = new Float32Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = src.d[i * 4 + 3]! / 255;
    f[i * 4] = src.d[i * 4]! * a;
    f[i * 4 + 1] = src.d[i * 4 + 1]! * a;
    f[i * 4 + 2] = src.d[i * 4 + 2]! * a;
    f[i * 4 + 3] = a;
  }
  const pass = (s: Float32Array, horiz: boolean): Float32Array => {
    const o = new Float32Array(s.length);
    const n = horiz ? W : H, m = horiz ? H : W;
    for (let j = 0; j < m; j++)
      for (let c = 0; c < 4; c++) {
        let acc = 0;
        const idx = (i: number) => (horiz ? (j * W + Math.min(W - 1, Math.max(0, i))) : (Math.min(H - 1, Math.max(0, i)) * W + j)) * 4 + c;
        for (let i = -R; i <= R; i++) acc += s[idx(i)]!;
        for (let i = 0; i < n; i++) {
          o[(horiz ? j * W + i : i * W + j) * 4 + c] = acc / (2 * R + 1);
          acc += s[idx(i + R + 1)]! - s[idx(i - R)]!;
        }
      }
    return o;
  };
  for (let p = 0; p < passes; p++) f = pass(pass(f, true), false);
  const out = new Px(W, H);
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(1, f[i * 4 + 3]! * gain);
    if (a <= 0.004) continue;
    const inv = f[i * 4 + 3]! > 0 ? 1 / f[i * 4 + 3]! : 0;
    out.d[i * 4] = f[i * 4]! * inv;
    out.d[i * 4 + 1] = f[i * 4 + 1]! * inv;
    out.d[i * 4 + 2] = f[i * 4 + 2]! * inv;
    out.d[i * 4 + 3] = a * 255;
  }
  return out;
}

export function shadowBlob(w: number, h: number, a = 0.45, col: Col = '#000000'): Px {
  const p = new Px(w, h);
  p.ellipseF(w / 2, h / 2, w / 2, h / 2, (_nx, _ny, r2) => [col, a * (r2 < 0.45 ? 1 : 0.6)]);
  return p;
}

export function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
