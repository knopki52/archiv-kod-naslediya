import { mix, Px, ramp, sh, type Col, type Ramp } from './px';

export type Dir = 'down' | 'up' | 'side';
export type HairStyle = 'bob' | 'long' | 'short' | 'bun' | 'braid' | 'bald';
export type Hat = 'none' | 'hood' | 'ushanka' | 'kerchief' | 'cap' | 'furcap' | 'beret' | 'kolpak' | 'fedora';
export type Held = 'none' | 'book' | 'tablet' | 'axe' | 'logs' | 'basket' | 'diary';

export interface TDef {
  skin: string;
  hair?: string;
  hairStyle?: HairStyle;
  hat?: Hat;
  hatC?: string;
  furC?: string;
  coat: string;
  coatLen?: 'short' | 'long' | 'robe';
  coatTrim?: string;
  pants?: string;
  shoes?: string;
  scarf?: string;
  scarfTail?: boolean;
  apron?: string;
  belt?: string;
  beard?: string;
  glasses?: boolean;
  child?: boolean;
  faceless?: boolean;
  eyeGlow?: string;
  mittens?: string;
  held?: Held;
  buttons?: boolean;
  kerchiefDots?: boolean;
  headphones?: boolean;
  capBadge?: string;
  outline?: string;
  noShadow?: boolean;
  ghost?: boolean;
}

export const FW = 20;
export const FH = 32;
const EYE = '#2a1b2e';
const HEAD_ROWS = [8, 10, 12, 12, 12, 12, 12, 12, 12, 10, 8];
const hr = (r: number): number => HEAD_ROWS[r] ?? 12;

export interface FrameOpts {
  talk?: boolean;
  blink?: boolean;
}

export function drawChar(def: TDef, dir: Dir = 'down', frame = 0, opt: FrameOpts = {}): Px {
  const p = new Px(FW, FH);
  const child = Boolean(def.child);
  const S = ramp(def.skin), CO = ramp(def.coat), PA = ramp(def.pants ?? '#3a3550'), SH = ramp(def.shoes ?? '#3a2a22');
  const HA = ramp(def.hair ?? '#4a3020'), HT = ramp(def.hatC ?? def.coat);
  const walk = frame % 4;
  const bob = walk === 1 || walk === 3 ? -1 : 0;
  const talk = Boolean(opt.talk);
  const headY = (child ? 9 : 3) + bob;
  const bodyY = headY + 11;
  const legY = child ? 27 : 25;
  const bodyEnd = legY;
  const long = def.coatLen === 'long' || def.coatLen === 'robe';

  const legs = (): void => {
    if (dir === 'side') {
      const sw = walk === 1 ? 2 : walk === 3 ? -2 : 0;
      const legDraw = (lx: number, back: boolean) => {
        p.rect(lx, legY, 3, 31 - legY - 1, back ? PA[1] : PA[2]);
        p.vl(lx, legY, 31 - legY - 1, back ? PA[0] : PA[3]);
        p.rect(lx, 30, 4, 2, back ? SH[1] : SH[2]);
        p.hl(lx, 30, 4, back ? SH[2] : SH[3]);
      };
      legDraw(8 - sw, true);
      legDraw(8 + sw, false);
      return;
    }
    const lUp = walk === 1 ? 1 : 0, rUp = walk === 3 ? 1 : 0;
    const L = (x: number, up: number, light: boolean) => {
      const h = 31 - legY - 1 - up;
      p.rect(x, legY, 3, h, light ? PA[2] : PA[1]);
      p.vl(x + (light ? 0 : 2), legY, h, light ? PA[3] : PA[0]);
      p.rect(x, 30 - up, 3, 2, SH[2]);
      p.hl(x, 30 - up, 3, SH[3]);
      p.set(x + 2, 31 - up, SH[0]);
    };
    L(6, lUp, true);
    L(11, rUp, false);
  };

  const torso = (): void => {
    const side = dir === 'side';
    const end = long ? (child ? 30 : 29) : bodyEnd + (child ? 0 : 1);
    for (let y = bodyY; y < end; y++) {
      const t = (y - bodyY) / Math.max(1, end - bodyY - 1);
      let x0: number, x1: number;
      if (side) {
        x0 = 6;
        x1 = 13;
        if (long) {
          x0 = 5 - Math.round(t);
          x1 = 13 + Math.round(t);
        }
      } else {
        x0 = y === bodyY ? 6 : 5;
        x1 = y === bodyY ? 13 : 14;
        if (long) {
          const fl = Math.round(t * 1.6);
          x0 -= fl;
          x1 += fl;
        }
      }
      if (child && !side) {
        x0 += 1;
        x1 -= 1;
      }
      for (let x = x0; x <= x1; x++) {
        let c = CO[2];
        if (x === x0) c = CO[3];
        else if (x >= x1 - 1) c = CO[1];
        if (y === end - 1) c = CO[1];
        if (y === bodyY && x > x0 && x < x1 - 1) c = CO[3];
        p.set(x, y, c);
      }
      if (!side && dir === 'down' && def.coatLen !== 'robe' && y > bodyY + 1) {
        p.set(10, y, CO[1]);
        if (def.coatTrim) {
          p.set(9, y, def.coatTrim);
          p.set(10, y, sh(def.coatTrim, -0.3));
        }
      }
      if (long && !side && y > legY + 1 && walk % 2 === 1) p.set(walk === 1 ? 7 : 12, y, CO[1]);
      if (def.coatTrim && y === end - 1) for (let x = x0; x <= x1; x++) p.set(x, y, x === x0 ? sh(def.coatTrim, 0.2) : def.coatTrim);
    }
    if (def.belt && !side) {
      p.hl(child ? 6 : 5, bodyY + 6, child ? 8 : 10, def.belt);
      p.set(10, bodyY + 6, sh(def.belt, 0.6));
    }
    if (def.apron && dir !== 'up') {
      const A = ramp(def.apron);
      for (let y = bodyY + 3; y < (long ? 28 : bodyEnd + 1); y++)
        for (let x = side ? 11 : 6; x <= 13; x++) p.set(x, y, x === (side ? 11 : 6) ? A[3] : x === 13 ? A[1] : A[2]);
    }
    if (def.buttons && dir === 'down') for (let y = bodyY + 2; y < bodyEnd - 1; y += 2) p.set(11, y, sh(def.coat, 0.55));
    if (dir === 'down' && !child) {
      p.set(8, bodyY, CO[0]);
      p.set(11, bodyY, CO[0]);
      p.set(9, bodyY + 1, CO[1]);
      p.set(10, bodyY + 1, CO[1]);
      for (let y = bodyY + 4; y < (long ? 28 : bodyEnd); y++) p.set(13, y, CO[1]);
      if (!def.apron) {
        p.hl(6, bodyY + 8, 2, CO[1]);
        p.hl(12, bodyY + 8, 2, CO[0]);
      }
      if (long) for (let y = legY; y < 28; y += 2) p.set(7, y, CO[3]);
    }
    if (dir === 'up') {
      p.vl(10, bodyY + 2, (long ? 28 : bodyEnd) - bodyY - 3, CO[1]);
      p.hl(6, bodyY + 1, 8, CO[1]);
    }
  };

  const arms = (): void => {
    const sw = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    if (dir === 'side') {
      const ay = bodyY + 1 + Math.abs(sw);
      p.rect(9 + sw, ay, 3, 7, CO[1]);
      p.vl(9 + sw, ay, 7, CO[2]);
      p.rect(9 + sw, ay + 7, 3, 2, def.mittens ?? S[2]);
      return;
    }
    const ax0 = child ? 4 : 3, ax1 = child ? 15 : 16;
    const len = child ? 6 : 8;
    const la = bodyY + 1 + (dir === 'down' ? sw : -sw), ra = bodyY + 1 - (dir === 'down' ? sw : -sw);
    p.rect(ax0, la, 2, len, CO[2]);
    p.vl(ax0, la, len, CO[3]);
    p.vl(ax0 + 1, la + 1, len - 1, CO[1]);
    p.rect(ax1 - 1, ra, 2, len, CO[1]);
    p.vl(ax1 - 1, ra + 1, len - 1, CO[0]);
    p.hl(ax0, la + len - 1, 2, CO[3]);
    p.hl(ax1 - 1, ra + len - 1, 2, CO[2]);
    const hand = def.mittens ?? S[2];
    p.rect(ax0, la + len, 2, 2, hand);
    p.set(ax0, la + len, def.mittens ? sh(def.mittens, 0.3) : S[3]);
    p.rect(ax1 - 1, ra + len, 2, 2, def.mittens ? sh(def.mittens, -0.25) : S[1]);
  };

  const head = (): void => {
    const hx = 4, hy = headY;
    const side = dir === 'side';
    HEAD_ROWS.forEach((w, r) => {
      const ww = side ? Math.max(0, w - 2) : w;
      const x0 = hx + (12 - w) / 2 + (side ? 1 : 0);
      for (let i = 0; i < ww; i++) {
        let c = S[2];
        if (i === 0 && !side) c = S[3];
        if (i >= ww - 1) c = S[1];
        if (r >= HEAD_ROWS.length - 2) c = i < 2 ? S[2] : S[1];
        if (r === 1 && i > 1 && i < 5) c = S[3];
        p.set(x0 + i, hy + r, c);
      }
    });
    if (dir === 'up') return;
    if (def.faceless) {
      const eg = def.eyeGlow ?? '#c9b8ff';
      if (side) p.set(12, hy + 6, eg);
      else {
        p.set(7, hy + 6, eg);
        p.set(12, hy + 6, eg);
      }
      return;
    }
    const closed = Boolean(opt.blink);
    if (side) {
      if (closed) p.set(12, hy + 6, EYE);
      else p.rect(12, hy + 5, 1, 2, EYE);
      p.set(13, hy + 4, S[1]);
      p.set(15, hy + 6, S[2]);
      p.set(12, hy + 8, sh(def.skin, -0.12));
      p.set(13, hy + 8, '#e88a8a', 0.45);
      if (talk) p.set(14, hy + 9, sh(def.skin, -0.45));
      if (def.beard) {
        const B = ramp(def.beard);
        for (let y = hy + 7; y <= hy + 12; y++) for (let x = 9; x <= 15 - Math.max(0, y - hy - 10); x++) p.set(x, y, x > 13 ? B[3] : x < 11 ? B[1] : B[2]);
      }
      if (def.glasses) p.hl(11, hy + 5, 3, '#c8d0e0');
    } else {
      if (closed) {
        p.hl(6, hy + 6, 2, EYE);
        p.hl(12, hy + 6, 2, EYE);
      } else {
        p.rect(6, hy + 5, 2, 2, EYE);
        p.set(6, hy + 5, '#5a4660');
        p.rect(12, hy + 5, 2, 2, EYE);
        p.set(12, hy + 5, '#5a4660');
      }
      if (def.glasses) {
        p.hl(5, hy + 4, 4, '#c8d0e0');
        p.hl(11, hy + 4, 4, '#c8d0e0');
        p.set(9, hy + 5, '#c8d0e0');
        p.set(10, hy + 5, '#c8d0e0');
      }
      p.set(5, hy + 7, '#e88a8a', 0.45);
      p.set(14, hy + 7, '#e88a8a', 0.45);
      if (talk) p.rect(9, hy + 8, 2, 1, sh(def.skin, -0.5));
      else p.set(9, hy + 8, sh(def.skin, -0.25));
      if (def.beard) {
        const B = ramp(def.beard);
        for (let y = hy + 7; y <= hy + 12; y++)
          for (let x = 5; x <= 14; x++) {
            const edge = y - (hy + 7);
            if ((x < 6 + edge / 3 && y > hy + 9) || (x > 13 - edge / 3 && y > hy + 9)) continue;
            if (y === hy + 8 && x >= 8 && x <= 11) continue;
            p.set(x, y, x < 7 ? B[3] : x > 12 ? B[1] : B[2]);
          }
      }
    }
  };

  const hair = (front: boolean): void => {
    const hy = headY, st = def.hairStyle ?? 'bob';
    const side = dir === 'side';
    if (st === 'bald') return;
    const H = HA;
    const put = (x: number, y: number, k: number) => p.set(x, y, H[k]);
    if (!front) {
      if (st === 'long' || st === 'braid') {
        if (dir === 'up') {
          for (let y = hy + 8; y < hy + 16; y++) for (let x = 5; x <= 14; x++) put(x, y, x < 7 ? 3 : x > 12 ? 1 : 2);
        } else if (!side) {
          for (let y = hy + 6; y < hy + 15; y++) {
            put(3, y, 2);
            put(16, y, 1);
          }
        }
      }
      return;
    }
    if (dir === 'up') {
      for (let r = 0; r < 10; r++)
        for (let x = 4; x <= 15; x++) {
          const w = hr(r);
          if (x < 4 + (12 - w) / 2 || x > 15 - (12 - w) / 2) continue;
          put(x, hy + r, x < 6 ? 3 : x > 13 ? 1 : r === 1 && x < 10 ? 4 : 2);
        }
      if (st === 'bun') {
        p.ellipse(10, hy, 3, 2.2, H[2]);
        p.set(9, hy - 1, H[4]);
      }
      if (st === 'braid') for (let y = hy + 10; y < hy + 18; y++) put(9 + (y % 2), y, y % 2 ? 2 : 3);
      return;
    }
    if (side) {
      const ws = [6, 8, 9, 9, 9, 8, 7, 6, 5];
      for (let r = 0; r < 9; r++) {
        const w = ws[r]!;
        for (let i = 0; i < w; i++) {
          const x = 5 + i;
          if (r > 3 && x > 9) continue;
          put(x, hy + r, i === 0 ? 1 : r === 1 && i > 3 ? 4 : r < 2 ? 3 : 2);
        }
      }
      put(11, hy + 1, 3);
      put(12, hy + 2, 2);
      put(13, hy + 2, 2);
      put(12, hy + 1, 3);
      if (st === 'long' || st === 'braid')
        for (let y = hy + 8; y < hy + 15; y++) {
          put(5, y, 1);
          put(6, y, 2);
        }
      if (st === 'bun') {
        p.ellipse(5, hy + 2, 2.2, 2.2, H[2]);
        p.set(4, hy + 1, H[4]);
      }
      return;
    }
    const bang = st === 'short' ? [3, 3, 2, 2, 2, 2, 2, 2, 3, 3] : [5, 4, 4, 3, 3, 3, 3, 4, 4, 5];
    for (let r = 0; r < 3; r++) {
      const w = hr(r);
      const x0 = 4 + (12 - w) / 2;
      for (let i = 0; i < w; i++) put(x0 + i, hy + r, i === 0 ? 3 : i >= w - 1 ? 1 : r === 1 && i > 1 && i < 6 ? 4 : r === 0 ? 3 : 2);
    }
    for (let i = 0; i < 10; i++) {
      const x = 5 + i;
      for (let y = hy + 2; y < hy + 2 + bang[i]!; y++) put(x, y, y === hy + 2 && i < 4 ? 3 : i > 7 ? 1 : 2);
    }
    const lock = st === 'short' ? 6 : st === 'long' || st === 'braid' ? 12 : 9;
    for (let y = hy + 2; y < hy + lock; y++) {
      put(4, y, 3);
      put(15, y, 1);
      if (st !== 'short' && y > hy + 3) put(5, y, 2);
    }
    put(7, hy + 1, 4);
    put(8, hy + 1, 4);
    put(11, hy, 3);
    put(6, hy + 2, 4);
    if (st === 'bun') {
      p.ellipse(10, hy - 1, 3, 2, H[2]);
      p.set(9, hy - 2, H[4]);
      p.hl(8, hy - 1, 2, H[3]);
    }
    if (st === 'braid') for (let y = hy + 11; y < hy + 18; y++) put(15 + (y % 2 ? 1 : 0), y, y % 2 ? 1 : 2);
  };

  const hat = (): void => {
    const hy = headY, k = def.hat ?? 'none';
    const side = dir === 'side';
    if (k === 'none') return;
    const T = HT;
    if (k === 'hood') {
      for (let y = hy - 2; y <= hy + 11; y++)
        for (let x = 2; x <= 17; x++) {
          const nx = (x + 0.5 - 10) / 7.2, ny = (y + 0.5 - (hy + 5.2)) / 7.6;
          if (nx * nx + ny * ny > 1) continue;
          let inFace = false;
          if (dir === 'down') {
            const fx = (x + 0.5 - 10) / 5.1, fy = (y + 0.5 - (hy + 7.2)) / 5.6;
            inFace = fx * fx + fy * fy < 1 && y > hy + 1;
          }
          if (side) {
            const fx = (x + 0.5 - 13.5) / 4.2, fy = (y + 0.5 - (hy + 6.8)) / 5.4;
            inFace = fx * fx + fy * fy < 1 && y > hy + 1;
          }
          if (inFace && p.alpha(x, y) > 0) continue;
          let c = T[2];
          if (nx < -0.55 || (ny < -0.6 && nx < 0.2)) c = T[3];
          if (nx > 0.6 || ny > 0.75) c = T[1];
          if (ny < -0.82 && nx < 0) c = T[4];
          p.set(x, y, c);
        }
      if (dir === 'down') p.hl(6, hy + 2, 8, T[0]);
      if (side) p.vl(10, hy + 2, 8, T[0]);
      if (dir === 'up') p.vl(10, hy + 1, 9, T[1]);
      return;
    }
    if (k === 'ushanka') {
      const F = ramp(def.hatC ?? '#6b5640');
      p.ellipse(10, hy + 1, 7.4, 4, F[2]);
      for (let x = 3; x <= 16; x++) p.set(x, hy - 2 + (x < 6 || x > 13 ? 1 : 0), F[3]);
      p.rect(4, hy + 3, 12, 2, F[1]);
      p.hl(4, hy + 3, 12, F[3]);
      if (!side) {
        p.rect(3, hy + 3, 2, 7, F[2]);
        p.rect(15, hy + 3, 2, 7, F[1]);
      } else p.rect(6, hy + 3, 3, 7, F[2]);
      for (let i = 0; i < 6; i++) p.set(5 + i * 2, hy - 1, F[4]);
      return;
    }
    if (k === 'furcap') {
      const F = ramp(def.furC ?? '#5a4434'), T2 = ramp(def.hatC ?? '#8a2a2a');
      p.ellipse(10, hy, 5.5, 3.2, T2[2]);
      p.set(8, hy - 2, T2[4]);
      p.hl(8, hy - 1, 3, T2[3]);
      p.rect(3, hy + 1, 14, 3, F[2]);
      p.hl(3, hy + 1, 14, F[3]);
      p.hl(3, hy + 3, 14, F[1]);
      for (let x = 3; x < 17; x += 2) p.set(x, hy + 2, F[4]);
      return;
    }
    if (k === 'kolpak') {
      p.poly([[4, hy + 2], [16, hy + 2], [12, hy - 5], [9, hy - 6]], T[2]);
      p.line(9, hy - 6, 5, hy + 1, T[3]);
      p.rect(3, hy + 1, 14, 3, sh(def.hatC ?? def.coat, -0.3));
      p.hl(3, hy + 1, 14, T[3]);
      return;
    }
    if (k === 'kerchief') {
      for (let y = hy - 1; y <= hy + 12; y++)
        for (let x = 3; x <= 16; x++) {
          const nx = (x + 0.5 - 10) / 7, ny = (y + 0.5 - (hy + 5)) / 7.2;
          if (nx * nx + ny * ny > 1) continue;
          let inFace = false;
          if (dir === 'down') {
            const fx = (x + 0.5 - 10) / 4.7, fy = (y + 0.5 - (hy + 7.4)) / 4.6;
            inFace = fx * fx + fy * fy < 1 && y > hy + 2;
          }
          if (side) {
            const fx = (x + 0.5 - 13.6) / 3.8, fy = (y + 0.5 - (hy + 7)) / 4.4;
            inFace = fx * fx + fy * fy < 1 && y > hy + 2;
          }
          if (inFace && p.alpha(x, y) > 0) continue;
          let c = T[2];
          if (nx < -0.5) c = T[3];
          if (nx > 0.6 || ny > 0.7) c = T[1];
          if (def.kerchiefDots && (x + y) % 3 === 0 && c === T[2]) c = T[4];
          p.set(x, y, c);
        }
      if (dir === 'down') {
        p.set(9, hy + 12, T[1]);
        p.set(10, hy + 12, T[1]);
        p.set(10, hy + 13, T[0]);
      }
      return;
    }
    if (k === 'cap') {
      p.rect(4, hy - 1, 12, 3, T[2]);
      p.hl(4, hy - 1, 12, T[3]);
      p.hl(5, hy - 2, 10, T[3]);
      if (dir === 'down') {
        p.rect(5, hy + 2, 10, 1, T[0]);
        p.hl(6, hy + 3, 8, T[0], 0.4);
      }
      if (side) p.rect(12, hy + 2, 5, 1, T[0]);
      if (def.capBadge && dir === 'down') p.set(10, hy, def.capBadge);
      return;
    }
    if (k === 'fedora') {
      p.ellipse(10, hy + 1, 8, 2.2, T[1]);
      p.rect(5, hy - 3, 10, 4, T[2]);
      p.hl(5, hy - 3, 10, T[3]);
      p.hl(5, hy, 10, T[0]);
      return;
    }
    if (k === 'beret') {
      p.ellipse(9.5, hy, 6.5, 2.6, T[2]);
      p.hl(5, hy - 2, 7, T[3]);
      p.set(10, hy - 3, T[1]);
    }
  };

  const scarf = (): void => {
    if (!def.scarf) return;
    const Sc = ramp(def.scarf);
    const y = bodyY;
    if (dir === 'side') {
      p.rect(7, y, 7, 2, Sc[2]);
      p.hl(7, y, 7, Sc[3]);
      if (def.scarfTail !== false) {
        p.rect(5, y + 1, 2, 4, Sc[1]);
        p.set(5, y + 4, Sc[0]);
      }
      return;
    }
    p.rect(5, y, 10, 2, Sc[2]);
    p.hl(6, y, 8, Sc[3]);
    p.set(14, y + 1, Sc[1]);
    p.set(13, y + 1, Sc[1]);
    if (def.scarfTail !== false && dir === 'down') {
      p.rect(11, y + 2, 2, 4, Sc[2]);
      p.vl(12, y + 2, 4, Sc[1]);
      p.set(11, y + 5, Sc[1]);
    }
  };

  const held = (): void => {
    const k = def.held;
    if (!k || k === 'none' || dir === 'up') return;
    if (k === 'book' || k === 'diary') {
      p.rect(13, bodyY + 4, 5, 6, k === 'diary' ? '#4a5a6a' : '#6a2a3a');
      p.vl(13, bodyY + 4, 6, '#e8dcc0');
      p.hl(14, bodyY + 4, 4, k === 'diary' ? '#6a7a8a' : '#8a3a4a');
    }
    if (k === 'tablet') {
      p.rect(12, bodyY + 3, 6, 8, '#5a4a30');
      p.rect(13, bodyY + 4, 4, 6, '#ece4d0');
      p.hl(13, bodyY + 5, 3, '#9aa0b0');
      p.hl(13, bodyY + 7, 3, '#9aa0b0');
      p.rect(14, bodyY + 2, 2, 1, '#c0c4cc');
    }
    if (k === 'axe') {
      p.vl(17, bodyY - 2, 13, '#7a5232');
      p.vl(18, bodyY - 2, 13, '#5a3b25');
      p.rect(15, bodyY - 3, 3, 4, '#9aa4b0');
      p.vl(15, bodyY - 3, 4, '#dfe6ee');
    }
    if (k === 'basket') {
      p.rect(12, bodyY + 6, 7, 5, '#8a6a3a');
      p.hl(12, bodyY + 6, 7, '#b08a50');
      p.rect(13, bodyY + 4, 5, 2, '#d8a860');
      p.set(14, bodyY + 4, '#f0c880');
    }
    if (k === 'logs') {
      for (let i = 0; i < 3; i++) {
        p.rect(3, bodyY + 3 + i * 2, 14, 2, i % 2 ? '#7a5232' : '#8a6040');
        p.set(3, bodyY + 3 + i * 2, '#c8a070');
        p.set(16, bodyY + 3 + i * 2, '#c8a070');
      }
    }
  };

  const headphones = (): void => {
    if (!def.headphones || dir === 'up') return;
    const y = bodyY - 1;
    p.hl(5, y + 1, 10, '#2a2a30');
    p.rect(4, y, 2, 3, '#4a4a54');
    p.rect(14, y, 2, 3, '#4a4a54');
  };

  if (dir === 'up') {
    legs();
    hair(false);
    torso();
    arms();
    scarf();
    head();
    hair(true);
    hat();
  } else if (dir === 'side') {
    hair(false);
    legs();
    torso();
    scarf();
    head();
    hair(true);
    hat();
    arms();
    held();
  } else {
    hair(false);
    legs();
    torso();
    arms();
    head();
    hair(true);
    hat();
    scarf();
    headphones();
    held();
  }
  p.outline(-0.7, def.outline, 200, '#140f22');
  if (def.ghost) {
    p.map((r, g, b, i) => {
      const y = Math.floor(i / FW);
      return y % 3 === 0 ? [Math.min(255, r + 30), Math.min(255, g + 26), Math.min(255, b + 12)] : [r, g, b];
    });
  }
  return p;
}

export function rimLight(spr: Px, color: Col = '#ffffff', amt = 0.45, dx = -1, dy = -1): Px {
  const src = spr.clone();
  for (let y = 0; y < spr.h; y++)
    for (let x = 0; x < spr.w; x++) {
      if (src.alpha(x, y) < 200) continue;
      const edge = (dx && src.alpha(x + dx, y) === 0) || (dy && src.alpha(x, y + dy) === 0);
      if (!edge) continue;
      const ix = x - dx, iy = y - dy;
      if (src.alpha(ix, iy) >= 200) {
        const c = src.get(ix, iy);
        if (c) spr.set(ix, iy, mix(c, color, amt));
      }
    }
  return spr;
}

export type ByteFormT = 'drone' | 'raven' | 'collar' | 'kestrel';
export interface Spr {
  p: Px;
  e: Px;
}

export function byteDrone(frame = 0): Spr {
  const p = new Px(16, 16), e = new Px(16, 16);
  const W: Ramp = ramp('#d9e2f0');
  const blur = frame % 2 ? 0.55 : 0.35;
  p.ellipse(2.5, 6, 2.5, 1, '#cfefff', blur);
  p.ellipse(13.5, 6, 2.5, 1, '#cfefff', blur);
  p.rect(3, 6, 2, 1, W[1]);
  p.rect(11, 6, 2, 1, W[1]);
  p.ellipseF(8, 8.5, 5.2, 5, (nx, ny) => [nx < -0.45 || ny < -0.55 ? W[3] : nx > 0.5 || ny > 0.55 ? W[1] : W[2]]);
  p.set(6, 5, W[4]);
  p.set(5, 6, W[4]);
  p.rect(4, 8, 8, 4, '#13213a');
  p.hl(5, 12, 6, '#13213a');
  e.rect(5, 9, 6, 2, '#5fe3ff');
  e.set(6, 9, '#d8fbff');
  e.set(9, 10, '#a8f2ff');
  p.vl(8, 1, 3, W[1]);
  p.set(8, 0, '#ff6fa8');
  e.set(8, 0, frame % 4 < 2 ? '#ff8fbf' : '#ffd0e4');
  p.outline(-0.75, '#1a1830');
  return { p, e };
}
export function byteRaven(frame = 0): Spr {
  const p = new Px(14, 12);
  const B = ['#0c0c16', '#17172a', '#24243e', '#3a4a7a', '#6a86c8'] as const;
  p.ellipse(6, 7, 4.5, 3.2, B[2]);
  p.ellipse(10, 4, 2.6, 2.4, B[2]);
  p.hl(4, 5, 4, B[3]);
  p.set(9, 2, B[3]);
  p.set(10, 2, B[4]);
  p.poly([[1, 7], [-1, 10], [3, 9]], B[1]);
  p.rect(12, 4, 2, 1, '#4a4a5a');
  p.set(13, 5, '#2a2a3a');
  p.set(10, 3, '#ffffff');
  p.set(11, 3, '#8ad8ff');
  p.vl(5, 10, 2, '#3a3a4a');
  p.vl(8, 10, 2, '#3a3a4a');
  if (frame % 2) p.hl(4, 6, 3, B[4]);
  p.outline(-0.7, '#05050c');
  return { p, e: new Px(14, 12) };
}
export function byteKestrel(frame = 0): Spr {
  const p = new Px(22, 14);
  const R = ramp('#c8642e'), G = ramp('#8a96a8');
  const up = frame % 2;
  p.poly([[11, 6], [0, up ? 2 : 6], [2, up ? 4 : 8], [10, 9]], R[2]);
  p.poly([[11, 6], [22, up ? 2 : 6], [20, up ? 4 : 8], [12, 9]], R[1]);
  for (let i = 1; i < 8; i += 2) {
    p.set(2 + i, up ? 4 + (i >> 2) : 7, R[0]);
    p.set(19 - i, up ? 4 + (i >> 2) : 7, R[0]);
  }
  p.ellipse(11, 7, 2.6, 4, R[2]);
  p.hl(10, 5, 2, R[3]);
  p.ellipse(11, 3, 2, 2, G[2]);
  p.set(10, 2, G[3]);
  p.rect(10, 11, 3, 3, R[1]);
  p.hl(10, 13, 3, '#2a1a10');
  p.set(10, 3, '#111111');
  p.set(12, 3, '#111111');
  p.set(11, 4, '#f0c040');
  p.outline(-0.7, '#24120a');
  return { p, e: new Px(22, 14) };
}
export function byteCollar(frame = 0): Spr {
  const p = new Px(14, 8), e = new Px(14, 8);
  const G = ramp('#8a8e98');
  p.ellipseF(7, 4, 6.5, 3, (nx, ny) => [ny < -0.2 ? G[3] : nx > 0.4 ? G[1] : G[2]]);
  for (let x = 2; x < 12; x += 3) p.vl(x, 2, 4, G[1]);
  p.rect(5, 3, 4, 2, '#13213a');
  e.rect(6, 3, 2, 1, frame % 4 < 3 ? '#5fe3ff' : '#d8fbff');
  p.outline(-0.7, '#14161c');
  return { p, e };
}
export function byteSprite(form: ByteFormT, frame: number): Spr {
  if (form === 'raven') return byteRaven(frame);
  if (form === 'kestrel') return byteKestrel(frame);
  if (form === 'collar') return byteCollar(frame);
  return byteDrone(frame);
}
