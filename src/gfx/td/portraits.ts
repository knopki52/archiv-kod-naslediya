import type { TDef } from './chars';
import { Px, ramp, sh } from './px';

export type PortraitMood = 'talk' | 'whisper' | 'worried' | 'smug' | 'broken' | 'neutral';

export function portraitByte(form: 'drone' | 'raven' | 'kestrel' | 'collar', mood: PortraitMood = 'talk'): Px {
  const p = new Px(48, 48), e = new Px(48, 48);
  if (form === 'drone' || form === 'collar') {
    const W = ramp(form === 'collar' ? '#a8aeb8' : '#d9e2f0');
    if (form === 'drone') {
      p.rect(2, 20, 8, 3, W[1]);
      p.rect(38, 20, 8, 3, W[1]);
      p.ellipse(5, 19, 6, 2, '#cfefff', 0.45);
      p.ellipse(43, 19, 6, 2, '#cfefff', 0.45);
    }
    p.ellipseF(24, 27, 17, 16, (nx, ny) => {
      const l = -nx * 0.55 - ny * 0.7;
      return [l > 0.55 ? W[4] : l > 0.15 ? W[3] : l > -0.35 ? W[2] : l > -0.7 ? W[1] : W[0]];
    });
    if (form === 'collar') for (let x = 10; x < 40; x += 4) p.line(x, 14, x - 2, 40, W[1]);
    p.ellipse(16, 17, 3, 2, '#ffffff');
    p.ellipseF(24, 29, 12, 6.5, (_nx, ny) => [ny < -0.6 ? '#2a3a5a' : '#0e1830']);
    const eye = (cx: number) => {
      if (mood === 'whisper') {
        e.hl(cx - 3, 29, 6, '#5fe3ff');
        return;
      }
      for (let i = -3; i <= 3; i++) e.set(cx + i, 30 - Math.round(Math.cos(i / 3.4) * 2.2), '#5fe3ff');
      for (let i = -2; i <= 2; i++) e.set(cx + i, 31 - Math.round(Math.cos(i / 3.4) * 2.2), '#5fe3ff', 0.6);
    };
    eye(18);
    eye(30);
    e.set(14, 25, '#d8fbff', 0.9);
    if (form === 'drone') {
      p.vl(24, 4, 8, W[1]);
      p.ellipse(24.5, 4, 2.5, 2.5, '#ff6fa8');
      e.ellipse(24.5, 4, 1.6, 1.6, '#ffc0da');
    }
    p.outline(0, '#0a0918');
  } else if (form === 'raven') {
    const B = ['#0b0b14', '#15152a', '#22223c', '#34406e', '#5a76b8'] as const;
    p.ellipseF(22, 34, 17, 14, (nx, ny) => [nx < -0.3 && ny < 0 ? B[3] : ny > 0.4 ? B[1] : B[2]]);
    p.ellipseF(27, 18, 11, 10, (nx, ny) => [nx < -0.2 && ny < -0.2 ? B[3] : nx > 0.5 ? B[1] : B[2]]);
    for (let i = 0; i < 6; i++) p.line(10 + i * 3, 30 + i, 14 + i * 3, 44, B[1]);
    p.line(14, 12, 22, 9, B[4]);
    p.line(9, 30, 18, 26, B[4]);
    p.poly([[35, 17], [47, 21], [35, 23]], '#3a3a4a');
    p.line(36, 18, 46, 21, '#6a6a7a');
    p.line(35, 21, 45, 21, '#1a1a22');
    p.ellipse(31, 16, 2.5, 2.5, '#e8ecff');
    p.ellipse(31.5, 16, 1.4, 1.6, '#0a0a12');
    e.set(30, 15, '#ffffff');
    if (mood === 'whisper') p.hl(29, 13, 5, B[0]);
    p.outline(0, '#03030a');
  } else {
    const R = ramp('#c8642e'), G = ramp('#8a96a8');
    p.ellipseF(22, 36, 15, 12, (nx, ny) => [nx < -0.3 && ny < 0 ? R[3] : ny > 0.4 ? R[1] : R[2]]);
    for (let i = 0; i < 9; i++) {
      p.set(14 + i * 2, 34 + (i % 2), R[0]);
      p.set(15 + i * 2, 39 + (i % 2), R[0]);
    }
    p.ellipseF(27, 19, 11, 10, (nx, ny) => [nx < -0.2 && ny < -0.2 ? G[3] : nx > 0.5 ? G[1] : G[2]]);
    p.ellipseF(28, 25, 8, 4, () => ['#f2e4cc']);
    p.line(26, 21, 26, 28, '#2a2a34');
    p.line(27, 21, 27, 27, '#2a2a34');
    p.poly([[36, 18], [44, 21], [40, 24], [36, 23]], '#e8b040');
    p.poly([[40, 22], [44, 21], [41, 26]], '#3a3020');
    p.ellipse(31, 17, 2.6, 2.6, '#f0c040');
    p.ellipse(31.5, 17, 1.5, 1.7, '#0a0a12');
    e.set(30, 16, '#ffffff');
    p.outline(0, '#1a0c06');
  }
  p.blit(e, 0, 0);
  return p;
}

export interface PortraitOpts {
  gaunt?: boolean;
  tired?: boolean;
  grey?: boolean;
  iris?: string;
  layer2?: string;
}

export function portraitHuman(def: TDef, mood: PortraitMood = 'talk', o: PortraitOpts = {}): Px {
  const p = new Px(48, 48), e = new Px(48, 48);
  const S = ramp(def.skin), CO = ramp(def.coat), HA = ramp(def.hair ?? '#4a3020');
  p.ellipseF(24, 52, 22, 16, (nx) => [nx < -0.55 ? CO[3] : nx > 0.5 ? CO[1] : CO[2]]);
  if (o.layer2) {
    const L = ramp(o.layer2);
    p.ellipseF(24, 54, 17, 13, (nx) => [nx < -0.5 ? L[3] : nx > 0.5 ? L[1] : L[2]]);
  }
  if (def.coatTrim) p.ellipseF(24, 40, 13, 4, (_nx, ny) => [ny < 0 ? sh(def.coatTrim!, 0.2) : def.coatTrim!]);
  p.poly([[19, 36], [24, 46], [29, 36]], CO[0]);
  if (def.buttons) for (let y = 40; y < 48; y += 3) p.set(24, y, sh(def.coat, 0.5));
  if (def.scarf) {
    const Sc = ramp(def.scarf);
    p.ellipseF(24, 37, 11, 4, (_nx, ny) => [ny < -0.2 ? Sc[3] : Sc[2]]);
    p.hl(16, 39, 16, Sc[1]);
  }
  p.rect(20, 31, 8, 6, S[1]);
  p.hl(20, 31, 8, S[0]);
  const hs = def.hairStyle ?? 'bob';
  if (!def.faceless && (hs === 'bun' || hs === 'long' || hs === 'braid' || hs === 'bob')) p.ellipse(24, 19, 13, 13, HA[1]);
  if (hs === 'bun') {
    p.ellipse(24, 6, 6, 5, HA[2]);
    p.hl(21, 3, 4, HA[4]);
    p.hl(20, 5, 6, HA[3]);
  }
  if (hs === 'braid') {
    p.rect(35, 24, 4, 16, HA[2]);
    for (let y = 25; y < 40; y += 3) p.hl(35, y, 4, HA[0]);
  }
  if (def.faceless) {
    const H = ramp(def.hatC ?? def.coat);
    p.ellipseF(24, 22, 16, 18, (nx, ny) => [nx < -0.5 ? H[3] : nx > 0.5 ? H[1] : H[2]]);
    p.ellipseF(24, 25, 10, 11, () => ['#08070c']);
    const g = def.eyeGlow ?? '#c9b8ff';
    e.rect(19, 24, 3, 2, g);
    e.rect(27, 24, 3, 2, g);
    p.blit(e, 0, 0);
    p.outline(0, '#050508');
    return p;
  }
  const gaunt = o.gaunt ? 1 : 0;
  p.ellipseF(24, 21, 11 - gaunt, 13, (nx, ny) => {
    const l = -nx * 0.6 - ny * 0.4;
    let c = l > 0.45 ? S[3] : l > -0.3 ? S[2] : S[1];
    if (gaunt && Math.abs(nx) > 0.55 && ny > 0 && ny < 0.6) c = S[1];
    return [c];
  });
  if (def.child) p.ellipse(24, 24, 11, 10, S[2]);
  p.ellipse(13.5, 22, 2, 3, S[2]);
  p.ellipse(34.5, 22, 2, 3, S[1]);
  const eyeY = def.child ? 22 : 21;
  for (const ex of [18, 29]) {
    p.rect(ex, eyeY, 4, 3, '#f4eee8');
    p.rect(ex + 1, eyeY, 2, 3, o.iris ?? '#4a3a2a');
    p.set(ex + 1, eyeY, '#101018');
    p.set(ex + 2, eyeY, '#101018');
    p.hl(ex - 1, eyeY - 1, 6, sh(def.skin, -0.55));
    e.set(ex + 2, eyeY + 1, '#ffffff', 0.85);
    const worried = mood === 'worried' || mood === 'broken';
    const angry = mood === 'smug';
    p.hl(ex - 1, eyeY - 4 + (worried ? (ex < 24 ? 1 : 0) : 0) + (angry ? (ex < 24 ? 0 : 1) : 0), 6, def.beard ? sh(def.beard, -0.2) : HA[0]);
  }
  if (o.tired) {
    p.hl(17, eyeY + 4, 6, sh(def.skin, -0.3));
    p.hl(28, eyeY + 4, 6, sh(def.skin, -0.3));
  }
  p.vl(24, 23, 4, S[1]);
  p.set(23, 27, S[1]);
  p.set(25, 27, S[0]);
  if (mood === 'smug') p.line(21, 30, 27, 29, sh(def.skin, -0.5));
  else p.hl(21, 30, 6, sh(def.skin, -0.5));
  if (mood === 'talk') p.hl(22, 31, 4, '#7a3a3a');
  p.set(17, 27, '#e88a8a', 0.35);
  p.set(31, 27, '#e88a8a', 0.35);
  if (def.beard) {
    const B = ramp(def.beard);
    p.ellipseF(24, 31, 11, 9, (nx, ny) => (ny < -0.3 && Math.abs(nx) < 0.5 ? null : [nx < -0.4 ? B[3] : nx > 0.4 ? B[1] : B[2]]));
    p.hl(21, 29, 6, sh(def.beard, -0.4));
  }
  if (def.glasses) {
    const G = '#c8ccd8';
    p.ring(20, 22, 4.5, 3.6, G, 1, 1);
    p.ring(31, 22, 4.5, 3.6, G, 1, 1);
    p.hl(24, 21, 3, G);
    e.set(18, 20, '#ffffff', 0.7);
    e.set(29, 20, '#ffffff', 0.7);
  }
  if (hs !== 'bald') {
    p.ellipseF(24, 12, 12.5, 7, (nx, ny) => (ny < 0.75 ? [nx < -0.4 ? HA[3] : nx > 0.5 ? HA[1] : HA[2]] : null));
    for (let x = 13; x <= 35; x++) {
      const k = Math.abs(x - 24);
      if (k < 9) p.set(x, 13 + Math.floor((9 - k) / 5), HA[2]);
    }
    for (let i = 0; i < 6; i++) p.line(15 + i * 3, 7, 19 + i * 3, 13, i % 2 ? HA[3] : HA[1]);
    if (hs !== 'short') {
      p.vl(13, 12, 9, HA[2]);
      p.vl(35, 12, 9, HA[1]);
    }
    if (o.grey) for (let i = 0; i < 12; i++) p.set(15 + i * 1.7, 9 + (i % 3), '#e8e8ee');
  }
  const hat = def.hat ?? 'none';
  const T = ramp(def.hatC ?? def.coat);
  if (hat === 'kerchief' || hat === 'hood') {
    p.ellipseF(24, 17, 15, 17, (nx, ny) => {
      const fx = (nx * 15) / 10.5, fy = (ny * 17 + 17 - 23) / 11;
      if (fx * fx + fy * fy < 1 && ny > -0.45) return null;
      let c = nx < -0.5 ? T[3] : nx > 0.55 ? T[1] : T[2];
      if (def.kerchiefDots && (Math.round(nx * 20) + Math.round(ny * 20)) % 4 === 0) c = T[4];
      return [c];
    });
  } else if (hat === 'ushanka' || hat === 'furcap') {
    const F = ramp(hat === 'furcap' ? (def.furC ?? '#5a4434') : (def.hatC ?? '#5a4a3a'));
    p.ellipseF(24, 9, 15, 8, (nx) => [nx < -0.4 ? F[3] : nx > 0.4 ? F[1] : F[2]]);
    p.rect(9, 12, 30, 5, F[1]);
    p.hl(9, 12, 30, F[3]);
    for (let x = 10; x < 38; x += 3) p.set(x, 14, F[4]);
    if (hat === 'ushanka') {
      p.rect(9, 16, 5, 12, F[2]);
      p.rect(34, 16, 5, 12, F[1]);
    } else {
      const R2 = ramp(def.hatC ?? '#8a2a2a');
      p.ellipseF(24, 6, 10, 5, (nx) => [nx < -0.3 ? R2[3] : R2[2]]);
    }
  } else if (hat === 'cap') {
    p.ellipseF(24, 9, 14, 6, (nx) => [nx < -0.4 ? T[3] : nx > 0.4 ? T[1] : T[2]]);
    p.rect(12, 12, 24, 3, T[0]);
    if (def.capBadge) p.rect(23, 8, 3, 3, def.capBadge);
  } else if (hat === 'fedora' || hat === 'beret') {
    p.ellipseF(24, 11, hat === 'fedora' ? 17 : 14, 4, (nx) => [nx < 0 ? T[2] : T[1]]);
    p.ellipseF(24, 7, 11, 6, (nx) => [nx < -0.4 ? T[3] : T[2]]);
  } else if (hat === 'kolpak') {
    p.poly([[13, 14], [35, 14], [30, 0], [22, -2]], T[2]);
    p.rect(11, 12, 26, 4, T[0]);
  }
  if (def.headphones) {
    p.ring(24, 14, 13, 9, '#2a2a30', 1, 2);
    p.rect(9, 20, 4, 7, '#3a3a40');
    p.rect(35, 20, 4, 7, '#3a3a40');
  }
  if (def.ghost) p.map((r, g, b, i) => (Math.floor(i / 48) % 3 === 0 ? [Math.min(255, r + 30), Math.min(255, g + 26), Math.min(255, b + 12)] : [r, g, b]));
  p.blit(e, 0, 0);
  p.outline(0, '#0a0814');
  return p;
}
