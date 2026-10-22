import { mulberry32 } from './Noise';
import type { TDef } from './td/chars';

export type CharDef = TDef;

export type CharId =
  | 'player' | 'player_nov' | 'player_nov_logs' | 'player_len' | 'player_baik'
  | 'onfim' | 'nastasya' | 'ignat' | 'guest' | 'dubler'
  | 'zina' | 'maria' | 'prohorov' | 'correspondent'
  | 'timofey' | 'galya' | 'ivan' | 'inspector'
  | 'botanist' | 'antonina' | 'lete';

const heroine: TDef = {
  skin: '#f2c9a8', hair: '#8a4a2e', hairStyle: 'bob', hat: 'hood', hatC: '#8a2f45', coat: '#8a2f45', coatLen: 'long',
  pants: '#2b2a44', shoes: '#4a2e22', scarf: '#f1e1bc', belt: '#2a2440',
};

export const CHARACTERS: Record<CharId, TDef> = {
  player: heroine,
  player_nov: { ...heroine, coat: '#a8784a', coatTrim: '#efe4cf', belt: '#5a2e22' },
  player_nov_logs: { ...heroine, coat: '#a8784a', coatTrim: '#efe4cf', belt: '#5a2e22', held: 'logs' },
  player_len: { ...heroine, coat: '#4a4e58', hat: 'kerchief', hatC: '#6a6e7c', scarf: '#8a8e98', scarfTail: false, buttons: true },
  player_baik: { ...heroine, coat: '#6a7048', hat: 'none', coatLen: 'short', pants: '#3a3a40', belt: '#3a2a1a', buttons: true },
  onfim: {
    skin: '#f5cfae', hair: '#e0b060', hairStyle: 'short', hat: 'furcap', hatC: '#a03a2a', furC: '#6a5040', coat: '#b08a5a',
    coatTrim: '#e8dcc4', coatLen: 'short', pants: '#6a5a4a', shoes: '#5a3a22', child: true, belt: '#7a2a20',
  },
  nastasya: {
    skin: '#f0c4a0', hair: '#6a3a22', hairStyle: 'braid', hat: 'kerchief', hatC: '#c0503a', kerchiefDots: true,
    coat: '#7a4a5a', coatLen: 'long', apron: '#e8dcc8', shoes: '#4a2e22',
  },
  ignat: {
    skin: '#e8d4b4', hair: '#8a8a8a', hairStyle: 'short', beard: '#9a9a9a', hat: 'kolpak', hatC: '#2a2a3a',
    coat: '#2a2a3a', coatLen: 'robe', pants: '#1c1c28', shoes: '#14101f', held: 'book', belt: '#5a4a2a',
  },
  guest: {
    skin: '#1e1a28', hat: 'hood', hatC: '#16141e', coat: '#16141e', coatLen: 'robe', pants: '#101018', shoes: '#0a0a10',
    faceless: true, eyeGlow: '#c9b8ff', outline: '#050508', noShadow: true,
  },
  dubler: {
    skin: '#1e1a28', hat: 'hood', hatC: '#2a1f55', coat: '#241a44', coatLen: 'robe', pants: '#241a44', shoes: '#241a44',
    faceless: true, eyeGlow: '#ffd36b', noShadow: true, scarf: '#ffd36b', scarfTail: true, ghost: true,
  },
  zina: {
    skin: '#e8c8b0', hair: '#5a3a28', hairStyle: 'braid', hat: 'kerchief', hatC: '#7a6a8a', coat: '#5a5a6a', coatLen: 'long',
    child: true, mittens: '#6a5a7a', shoes: '#2a2a30', held: 'diary',
  },
  maria: {
    skin: '#e0c0a8', hair: '#9a9aa4', hairStyle: 'bun', coat: '#4a4a52', coatLen: 'long', buttons: true, glasses: true,
    scarf: '#6a5a5a', scarfTail: false, shoes: '#2a2a2e',
  },
  prohorov: {
    skin: '#d8b090', hair: '#4a4036', hairStyle: 'short', beard: '#4a4036', hat: 'ushanka', hatC: '#4a4034',
    coat: '#3a3a2a', coatLen: 'short', pants: '#2a2a22', shoes: '#1c1812', held: 'axe', belt: '#1a1a12', buttons: true,
  },
  correspondent: {
    skin: '#e8d0c0', hair: '#2a2420', hairStyle: 'short', hat: 'fedora', hatC: '#2a2a34', coat: '#3a3450', coatLen: 'long',
    buttons: true, belt: '#22202e', shoes: '#141418',
  },
  timofey: {
    skin: '#e0b090', hair: '#4a3a2a', hairStyle: 'short', hat: 'cap', hatC: '#3a4a3a', coat: '#4a5a6a', coatLen: 'short',
    pants: '#3a4a5a', belt: '#2a2a22', shoes: '#2a2018',
  },
  galya: {
    skin: '#f0d0b8', hair: '#6a4020', hairStyle: 'bob', hat: 'kerchief', hatC: '#e8e0c8', coat: '#5a7aa0', coatLen: 'short',
    pants: '#3a4a6a', shoes: '#3a2a20', headphones: true,
  },
  ivan: {
    skin: '#d8a888', hair: '#c8c8c8', hairStyle: 'short', beard: '#d0d0d0', hat: 'ushanka', hatC: '#5a4a3a', coat: '#4a5040',
    coatLen: 'short', pants: '#3a3a34', belt: '#2a2a20', shoes: '#2a2420', buttons: true,
  },
  inspector: {
    skin: '#e8d0c0', hair: '#2a2a2a', hairStyle: 'short', hat: 'cap', hatC: '#2a3040', coat: '#2e3444', coatLen: 'long',
    buttons: true, belt: '#1a1a22', pants: '#2a2e3a', shoes: '#0a0a0e', held: 'tablet',
  },
  botanist: {
    skin: '#e0c8b0', hair: '#8a8a8a', hairStyle: 'short', hat: 'none', coat: '#5a6a50', coatLen: 'long', glasses: true,
    buttons: true, shoes: '#1c1812', scarf: '#7a7a6a', scarfTail: false,
  },
  antonina: {
    skin: '#f0d0b8', hair: '#6a3a22', hairStyle: 'braid', hat: 'kerchief', hatC: '#7a7a8a', coat: '#4a5a6a', coatLen: 'short',
    mittens: '#5a5a6a', pants: '#2a3040', shoes: '#1c1c24', belt: '#2a2a2e',
  },
  lete: {
    skin: '#f4e4d0', hair: '#fff4cf', hairStyle: 'bob', hat: 'hood', hatC: '#d9b24c', coat: '#c9a23c', coatLen: 'long',
    pants: '#6a5a8a', shoes: '#3a2a1a', scarf: '#2a2150', noShadow: true, ghost: true,
  },
};

export const CHAR_IDS = Object.keys(CHARACTERS) as CharId[];

export const SPEAKER_TO_CHAR: Record<string, CharId> = {
  player: 'player', mnema: 'player', onfim: 'onfim', nastasya: 'nastasya', ignat: 'ignat', guest: 'guest',
  dubler: 'dubler', zina: 'zina', maria: 'maria', prohorov: 'prohorov', correspondent: 'correspondent',
  timofey: 'timofey', galya: 'galya', ivan: 'ivan', inspector: 'inspector', botanist: 'botanist',
  antonina: 'antonina', lete: 'lete',
};

export type Era = 'nov' | 'len' | 'baik';

export function villager(seed: number, era: Era): TDef {
  const r = mulberry32(seed);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)]!;
  const skins = ['#f0c8a8', '#e8c3a0', '#d8b090', '#e0cdb8', '#f0d0b8'];
  const hairs = ['#3a2a1a', '#5a3a2a', '#8a8a8a', '#c9a15b', '#2a2a2a', '#6a4428'];
  const female = r() < 0.5;
  const base: TDef = {
    skin: pick(skins), hair: pick(hairs), hairStyle: female ? pick(['long', 'braid', 'bun'] as const) : 'short',
    coat: '#6a5a4a', coatLen: 'long', pants: '#3a2a20', shoes: '#2a2018',
  };
  if (!female && r() < 0.5) base.beard = base.hair;
  if (era === 'nov') {
    return {
      ...base,
      coat: pick(['#8a4a3a', '#6a7a5a', '#8a6a44', '#4a5a7a', '#9a7a4a', '#7a5a3a']),
      coatTrim: pick(['#e8dcc4', '#d8ccb4', undefined, undefined]),
      belt: pick(['#3a2418', '#5a2a1a']),
      hat: female ? 'kerchief' : pick(['furcap', 'kolpak', 'ushanka'] as const),
      hatC: female ? pick(['#4a6a9a', '#a04a3a', '#6a8a5a', '#c8a060']) : pick(['#3a5a7a', '#7a2a2a', '#5a4a3a']),
      furC: '#5a4434',
      held: pick(['none', 'none', 'basket'] as const),
    };
  }
  if (era === 'len') {
    return {
      ...base, coat: pick(['#4a4e58', '#3a3e48', '#5a5a64', '#44464e']), buttons: true,
      hat: female ? 'kerchief' : 'ushanka', hatC: pick(['#6a6e7c', '#4a4038', '#5a5050']), scarf: pick(['#8a8e98', '#6a5a5a', undefined]), scarfTail: false,
    };
  }
  return {
    ...base, coat: pick(['#4a5a6a', '#6a7048', '#5a6a8a', '#7a6a4a']), coatLen: 'short', pants: pick(['#3a4a5a', '#3a3a40']),
    hat: pick(['cap', 'none', 'ushanka'] as const), hatC: pick(['#3a4a3a', '#4a5a7a', '#5a4a3a']), belt: '#2a2a22',
  };
}

const DYNAMIC_CHARS = new Map<string, TDef>();

export function registerCharDef(key: string, def: TDef): void {
  DYNAMIC_CHARS.set(key, def);
}

export function getCharDef(key: string): TDef | undefined {
  return (CHARACTERS as Record<string, TDef | undefined>)[key] ?? DYNAMIC_CHARS.get(key);
}
