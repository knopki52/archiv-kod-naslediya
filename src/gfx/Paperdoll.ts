import { makeRamp, OUTLINE, shade, type Ramp } from './Palette';
import { PixelCanvas } from './PixelCanvas';

export const FRAME_W = 24;
export const FRAME_H = 40;

export type Build = 'slim' | 'normal' | 'stocky' | 'child';
export type HairStyle = 'short' | 'long' | 'bun' | 'bald' | 'beard' | 'braids';
export type HatKind = 'none' | 'ushanka' | 'cap' | 'kerchief' | 'hood' | 'kolpak' | 'fedora';
export type CoatKind = 'jacket' | 'long' | 'robe' | 'overall' | 'vest';
export type Held = 'none' | 'axe' | 'tablet' | 'book' | 'logs';

export interface CharDef {
  skin: string;
  hair?: string;
  hairStyle?: HairStyle;
  hat?: HatKind;
  hatColor?: string;
  coat: string;
  coatKind: CoatKind;
  pants: string;
  shoes: string;
  build: Build;
  scarf?: string;
  apron?: string;
  glasses?: boolean;
  headphones?: boolean;
  held?: Held;
  satchel?: string;
  mittens?: string;
  faceless?: boolean;
  eyeGlow?: string;
  noShadow?: boolean;
}

export type Mood = 'neutral' | 'nervous' | 'broken' | 'smug' | 'talk';

export interface Pose {
  bodyDy: number;
  legA: { dx: number; lift: number };
  legB: { dx: number; lift: number };
  armFront: { dx: number; up: number };
  armBack: { dx: number; up: number };
  mouth: 'closed' | 'open' | 'frown' | 'smile';
  eyes: 'normal' | 'wide' | 'narrow' | 'closed';
  brows: 'none' | 'flat' | 'worried' | 'angry';
  detail?: boolean;
  sweat?: boolean;
  tear?: boolean;
  sway: number;
}

const calm: Pose = {
  bodyDy: 0,
  legA: { dx: 0, lift: 0 },
  legB: { dx: 0, lift: 0 },
  armFront: { dx: 0, up: 0 },
  armBack: { dx: 0, up: 0 },
  mouth: 'closed',
  eyes: 'normal',
  brows: 'none',
  sway: 0,
};

export const FRAME_NAMES = [
  'idle_0', 'idle_1', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'talk_0', 'talk_1', 'react_0',
] as const;
export type FrameName = (typeof FRAME_NAMES)[number];

export const POSES: Record<FrameName, Pose> = {
  idle_0: { ...calm },
  idle_1: { ...calm, bodyDy: -1, armFront: { dx: 0, up: 0 }, sway: 1 },
  walk_0: { ...calm, bodyDy: 0, legA: { dx: 3, lift: 0 }, legB: { dx: -3, lift: 0 }, armFront: { dx: -2, up: 0 }, armBack: { dx: 2, up: 0 }, sway: 2 },
  walk_1: { ...calm, bodyDy: -1, legA: { dx: 1, lift: 0 }, legB: { dx: -1, lift: 2 }, armFront: { dx: 0, up: 0 }, armBack: { dx: 0, up: 0 }, sway: 0 },
  walk_2: { ...calm, bodyDy: 0, legA: { dx: -3, lift: 0 }, legB: { dx: 3, lift: 0 }, armFront: { dx: 2, up: 0 }, armBack: { dx: -2, up: 0 }, sway: -2 },
  walk_3: { ...calm, bodyDy: -1, legA: { dx: -1, lift: 2 }, legB: { dx: 1, lift: 0 }, armFront: { dx: 0, up: 0 }, armBack: { dx: 0, up: 0 }, sway: 0 },
  talk_0: { ...calm, armFront: { dx: 2, up: 1 }, mouth: 'closed' },
  talk_1: { ...calm, bodyDy: -1, armFront: { dx: 3, up: 2 }, mouth: 'open' },
  react_0: { ...calm, bodyDy: -1, armFront: { dx: 2, up: 3 }, armBack: { dx: -1, up: 3 }, eyes: 'wide', mouth: 'open', brows: 'worried' },
};

interface Dims {
  legLen: number;
  torsoLen: number;
  torsoW: number;
  headW: number;
  headH: number;
}

function dimsOf(b: Build): Dims {
  switch (b) {
    case 'child': return { legLen: 8, torsoLen: 8, torsoW: 8, headW: 9, headH: 9 };
    case 'slim': return { legLen: 13, torsoLen: 12, torsoW: 8, headW: 8, headH: 9 };
    case 'stocky': return { legLen: 12, torsoLen: 13, torsoW: 12, headW: 9, headH: 9 };
    default: return { legLen: 12, torsoLen: 12, torsoW: 10, headW: 8, headH: 9 };
  }
}

function skinRamp(skin: string): Ramp {
  return makeRamp(skin);
}

export function drawCharacter(def: CharDef, pose: Pose = calm): PixelCanvas {
  const p = new PixelCanvas(FRAME_W, FRAME_H);
  const d = dimsOf(def.build);
  const cx = 12;
  const dy = pose.bodyDy;
  const hipY = FRAME_H - d.legLen;
  const torsoTop = hipY - d.torsoLen + dy;
  const torsoX = cx - Math.floor(d.torsoW / 2);
  const coat = makeRamp(def.coat);
  const pants = makeRamp(def.pants);
  const shoes = makeRamp(def.shoes);
  const skin = skinRamp(def.skin);
  const headX = cx - Math.floor(d.headW / 2) + 1;
  const headY = torsoTop - 1 - d.headH;
  const long = def.coatKind === 'long' || def.coatKind === 'robe';

  const leg = (baseX: number, l: { dx: number; lift: number }, back: boolean) => {
    const x = baseX + l.dx;
    const top = hipY + dy;
    const shoeH = 3;
    const h = d.legLen - l.lift - shoeH + 1;
    p.rect(x, top, 3, Math.max(2, h), back ? pants.shadow : pants.base);
    const sy = FRAME_H - shoeH - l.lift;
    p.rect(x, sy, 4, shoeH, back ? shoes.shadow : shoes.base);
    p.px(x + 3, sy + shoeH - 1, shoes.shadow);
  };
  leg(cx - 4, pose.legB, true);
  leg(cx, pose.legA, false);

  const arm = (shoulderX: number, a: { dx: number; up: number }, back: boolean) => {
    const sy = torsoTop + 2;
    const len = Math.max(4, d.torsoLen - 3);
    const hx = shoulderX + a.dx;
    const hy = sy + len - a.up * 3;
    const sleeve = back ? coat.shadow : coat.light;
    p.line(shoulderX, sy, hx, hy, sleeve);
    p.line(shoulderX + 1, sy, hx + 1, hy, sleeve);
    const hand = def.mittens ?? (back ? skin.shadow : skin.base);
    p.rect(hx, hy + 1, 2, 2, hand);
  };
  arm(torsoX - 1, pose.armBack, true);

  if (long) {
    const flare = def.coatKind === 'robe' ? 3 : 2;
    const bottom = def.coatKind === 'robe' ? FRAME_H - 4 : FRAME_H - 6;
    p.poly(
      [
        [torsoX, hipY - 3 + dy],
        [torsoX + d.torsoW, hipY - 3 + dy],
        [torsoX + d.torsoW + flare + pose.sway, bottom],
        [torsoX - flare + pose.sway, bottom],
      ],
      coat.base,
    );
    p.rect(torsoX - flare + pose.sway, bottom - 1, d.torsoW + flare * 2, 1, coat.shadow);
    p.line(cx + 1, hipY - 2 + dy, cx + 2 + pose.sway, bottom - 1, coat.shadow);
  }

  p.rect(torsoX, torsoTop, d.torsoW, d.torsoLen, coat.base);
  p.rect(torsoX, torsoTop, 1, d.torsoLen, coat.shadow);
  p.rect(torsoX + d.torsoW - 1, torsoTop, 1, d.torsoLen, coat.light);
  p.rect(torsoX, torsoTop, d.torsoW, 1, coat.light);
  if (def.coatKind === 'overall') p.rect(torsoX + 1, torsoTop + d.torsoLen - 3, d.torsoW - 2, 1, pants.shadow);
  if (def.coatKind === 'jacket') p.rect(torsoX, hipY - 2 + dy, d.torsoW, 1, coat.shadow);
  if (def.coatKind === 'vest') p.rect(cx + 1, torsoTop + 1, 1, d.torsoLen - 2, coat.shadow);
  if (def.apron) {
    const a = makeRamp(def.apron);
    p.rect(torsoX + 1, torsoTop + 4, d.torsoW - 2, d.torsoLen - 3, a.base);
    p.rect(torsoX + 1, torsoTop + 4, d.torsoW - 2, 1, a.light);
  }
  if (def.satchel) {
    const s = makeRamp(def.satchel);
    p.line(torsoX, torsoTop + 1, torsoX + d.torsoW - 1, hipY - 2 + dy, s.shadow);
    p.rect(cx + 2, hipY - 4 + dy, 4, 4, s.base);
    p.rect(cx + 2, hipY - 4 + dy, 4, 1, s.light);
  }

  if (def.scarf) {
    const sc = makeRamp(def.scarf);
    p.rect(torsoX - 1, torsoTop - 1, d.torsoW + 2, 3, sc.base);
    p.rect(torsoX - 1, torsoTop + 1, d.torsoW + 2, 1, sc.shadow);
    p.rect(torsoX - 2 + Math.round(pose.sway / 2), torsoTop + 1, 2, 7, sc.base);
    p.px(torsoX - 2 + Math.round(pose.sway / 2), torsoTop + 7, sc.shadow);
  }

  const hw = d.headW;
  const hh = d.headH;
  if (def.faceless) {
    p.rect(headX, headY, hw, hh, '#0b0814');
    p.rect(headX + 1, headY - 1, hw - 2, 1, '#0b0814');
  } else {
    p.rect(headX, headY + 1, hw, hh - 1, skin.base);
    p.rect(headX + 1, headY, hw - 2, 1, skin.base);
    p.rect(headX, headY + hh - 2, hw, 2, skin.base);
    p.rect(headX, headY + 2, 1, hh - 3, skin.shadow);
    p.rect(headX + hw - 1, headY + 3, 1, hh - 4, skin.light);
    p.rect(cx, torsoTop - 1, 3, 1, skin.shadow);
    p.px(headX + hw, headY + Math.floor(hh / 2) + 1, skin.shadow);
  }

  const eyeY = headY + Math.floor(hh / 2) - 1;
  const ex1 = headX + hw - 6;
  const ex2 = headX + hw - 3;
  if (def.faceless) {
    const g = def.eyeGlow ?? '#c9b8ff';
    p.px(ex1, eyeY + 1, g);
    p.px(ex2, eyeY + 1, g);
  } else {
    const ink = '#14101f';
    const eyeH = pose.eyes === 'wide' ? 3 : pose.eyes === 'narrow' ? 1 : 2;
    if (pose.eyes === 'closed') {
      p.rect(ex1, eyeY + 1, 2, 1, ink);
      p.rect(ex2, eyeY + 1, 2, 1, ink);
    } else {
      p.rect(ex1, eyeY + (eyeH === 1 ? 1 : 0), 1, eyeH, ink);
      p.rect(ex2, eyeY + (eyeH === 1 ? 1 : 0), 1, eyeH, ink);
    }
    if (pose.detail || pose.brows !== 'none') {
      const by = eyeY - 2;
      const b = '#3a2a1a';
      if (pose.brows === 'worried') {
        p.px(ex1 - 1, by + 1, b);
        p.px(ex1, by, b);
        p.px(ex2, by, b);
        p.px(ex2 + 1, by + 1, b);
      } else if (pose.brows === 'angry') {
        p.px(ex1 - 1, by, b);
        p.px(ex1, by + 1, b);
        p.px(ex2, by + 1, b);
        p.px(ex2 + 1, by, b);
      } else {
        p.rect(ex1 - 1, by + 1, 3, 1, b);
        p.rect(ex2 - 1, by + 1, 3, 1, b);
      }
    }
    const my = headY + hh - 3;
    const mx = headX + hw - 6;
    const lip = '#7a2f3a';
    if (pose.mouth === 'open') p.rect(mx + 1, my, 3, 2, lip);
    else if (pose.mouth === 'frown') {
      p.rect(mx + 1, my, 3, 1, lip);
      p.px(mx, my + 1, lip);
      p.px(mx + 4, my + 1, lip);
    } else if (pose.mouth === 'smile') {
      p.rect(mx + 1, my + 1, 3, 1, lip);
      p.px(mx, my, lip);
      p.px(mx + 4, my, lip);
    } else p.rect(mx + 1, my, 3, 1, skin.shadow);
    if (pose.detail) {
      p.px(headX + hw - 2, eyeY + 3, shade(def.skin, 0.12));
      p.px(headX + 2, eyeY + 3, shade('#ff8a8a', -0.1));
    }
    if (pose.sweat) p.rect(headX + hw, eyeY - 1, 1, 2, '#9fd8ff');
    if (pose.tear) p.rect(ex2, eyeY + 2, 1, 3, '#9fd8ff');
    if (def.glasses) {
      const g = '#e8f1ff';
      p.strokeRect(ex1 - 1, eyeY - 1, 3, 4, g);
      p.strokeRect(ex2 - 1, eyeY - 1, 3, 4, g);
      p.px(ex1 + 2, eyeY, g);
    }
  }

  const hairC = makeRamp(def.hair ?? '#3a2a1a');
  const hs = def.hairStyle ?? 'short';
  const hat = def.hat ?? 'none';
  if (!def.faceless && hat !== 'hood' && hat !== 'kerchief') {
    if (hs !== 'bald') {
      p.rect(headX, headY - 1, hw, 3, hairC.base);
      p.rect(headX - 1, headY + 1, 2, 4, hairC.shadow);
      p.rect(headX + hw - 2, headY + 1, 2, 1, hairC.base);
      p.rect(headX + 1, headY - 1, hw - 3, 1, hairC.light);
    }
    if (hs === 'long') {
      p.rect(headX - 2, headY + 1, 3, hh + 3, hairC.base);
      p.rect(headX - 2, headY + hh + 3, 3, 1, hairC.shadow);
    }
    if (hs === 'braids') {
      p.rect(headX - 2, headY + 2, 2, hh + 4, hairC.base);
      p.px(headX - 2, headY + hh + 6, '#c04050');
    }
    if (hs === 'bun') p.circle(headX + 1, headY - 2, 2, hairC.base);
    if (hs === 'beard') {
      p.rect(headX + 2, headY + hh - 3, hw - 1, 4, hairC.base);
      p.rect(headX + 2, headY + hh, hw - 2, 1, hairC.shadow);
    }
    if (hs === 'bald') p.px(headX + 2, headY + 1, shade(def.skin, 0.25));
  }
  const hc = makeRamp(def.hatColor ?? '#5a4a3a');
  if (hat === 'ushanka') {
    p.rect(headX - 1, headY - 3, hw + 2, 4, hc.base);
    p.rect(headX - 1, headY - 3, hw + 2, 1, hc.light);
    p.rect(headX - 2, headY, 3, hh - 1, hc.shadow);
    p.rect(headX + hw - 1, headY + 1, 2, 3, hc.base);
  } else if (hat === 'cap') {
    p.rect(headX - 1, headY - 2, hw + 1, 3, hc.base);
    p.rect(headX - 1, headY - 2, hw + 1, 1, hc.light);
    p.rect(headX + hw - 1, headY + 1, 4, 1, hc.shadow);
  } else if (hat === 'kerchief') {
    p.rect(headX - 1, headY - 1, hw + 1, 4, hc.base);
    p.rect(headX - 2, headY + 1, 3, hh + 1, hc.base);
    p.rect(headX - 2, headY + hh, 3, 1, hc.shadow);
    p.rect(headX - 3, headY + hh - 3, 2, 3, hc.light);
    p.px(headX + hw - 2, headY + 1, hc.shadow);
  } else if (hat === 'hood') {
    p.rect(headX - 2, headY - 2, hw + 3, 4, hc.base);
    p.rect(headX - 3, headY, 4, hh + 2, hc.base);
    p.rect(headX - 3, headY, 1, hh + 2, hc.shadow);
    p.rect(headX - 1, headY - 2, hw, 1, hc.light);
    p.rect(headX + hw - 1, headY + 1, 2, 2, hc.base);
    if (!def.faceless) p.rect(headX + 1, headY + 2, hw - 2, 1, shade(def.hatColor ?? '#5a4a3a', -0.55));
  } else if (hat === 'kolpak') {
    p.rect(headX, headY - 5, hw, 5, hc.base);
    p.rect(headX - 1, headY - 1, hw + 2, 2, hc.light);
    p.rect(headX, headY - 5, hw, 1, hc.shadow);
  } else if (hat === 'fedora') {
    p.rect(headX - 2, headY - 1, hw + 4, 2, hc.shadow);
    p.rect(headX, headY - 4, hw, 4, hc.base);
    p.rect(headX, headY - 2, hw, 1, hc.light);
  }
  if (def.headphones) {
    p.rect(headX - 1, headY - 2, hw + 1, 1, '#2d2d3a');
    p.rect(headX - 2, headY + 2, 2, 4, '#2d2d3a');
    p.px(headX - 2, headY + 3, '#7dffb0');
  }

  arm(torsoX + d.torsoW - 1, pose.armFront, false);
  const handX = torsoX + d.torsoW - 1 + pose.armFront.dx;
  const handY = torsoTop + 2 + Math.max(4, d.torsoLen - 3) - pose.armFront.up * 3;
  const held = def.held ?? 'none';
  if (held === 'axe') {
    p.line(handX + 1, handY + 3, handX + 4, handY - 8, '#6b4a2a');
    p.rect(handX + 3, handY - 9, 4, 3, '#c9d1da');
    p.rect(handX + 3, handY - 9, 4, 1, '#ffffff');
  } else if (held === 'tablet') {
    p.rect(handX + 1, handY - 3, 5, 7, '#3a3d4a');
    p.rect(handX + 2, handY - 2, 3, 5, '#9fd0ff');
  } else if (held === 'book') {
    p.rect(handX + 1, handY - 2, 5, 6, '#7a2f3a');
    p.rect(handX + 1, handY - 2, 5, 1, '#c9a15b');
  } else if (held === 'logs') {
    p.rect(handX - 3, handY - 2, 8, 3, '#8a5a32');
    p.rect(handX - 3, handY - 2, 8, 1, '#b07a44');
    p.px(handX + 4, handY - 1, '#d9b080');
  }

  p.outline(OUTLINE);
  return p;
}

export function buildSheet(def: CharDef): PixelCanvas {
  const sheet = new PixelCanvas(FRAME_W * FRAME_NAMES.length, FRAME_H);
  FRAME_NAMES.forEach((name, i) => sheet.blit(drawCharacter(def, POSES[name]), i * FRAME_W, 0));
  return sheet;
}

const MOODS: Record<Mood, Partial<Pose>> = {
  neutral: { mouth: 'closed', eyes: 'normal', brows: 'flat' },
  nervous: { mouth: 'frown', eyes: 'wide', brows: 'worried', sweat: true },
  broken: { mouth: 'frown', eyes: 'narrow', brows: 'worried', tear: true },
  smug: { mouth: 'smile', eyes: 'narrow', brows: 'flat' },
  talk: { mouth: 'open', eyes: 'normal', brows: 'flat' },
};

export function drawPortrait(def: CharDef, mood: Mood = 'neutral', bg = '#1b1530'): PixelCanvas {
  const frame = drawCharacter({ ...def, held: 'none' }, { ...calm, ...MOODS[mood], detail: true });
  let top = FRAME_H;
  for (let y = 0; y < FRAME_H && top === FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) if (frame.get(x, y) >>> 24) top = y;
  const crop = frame.crop(2, Math.max(0, top - 2), 20, 21);
  const out = new PixelCanvas(64, 64).gradientV(0, 0, 64, 64, shade(bg, 0.08), shade(bg, -0.2), 4);
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 20; x++) {
      const c = crop.get(x, y);
      if (c >>> 24) out.rect(2 + x * 3, 1 + y * 3, 3, 3, c);
    }
  }
  return out;
}
