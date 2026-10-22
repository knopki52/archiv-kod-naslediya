import { CHARACTERS, type CharId } from '../gfx/characters';
import { portraitByte, portraitHuman, type PortraitMood } from '../gfx/td/portraits';
import { hash2, mix, Px, ramp, sh } from '../gfx/td/px';
import { cardArt, choiceArt, panelModule, panelTile } from '../gfx/td/art_ui';

export type ThemeKey = 'archive' | 'nov' | 'len' | 'baik' | 'core';
interface Theme {
  gold: string;
  goldD: string;
  goldL: string;
  ink: string;
  fill: [string, string];
  glow: string;
  gem: string;
}
const THEMES: Record<ThemeKey, Theme> = {
  archive: { gold: '#e8b850', goldD: '#8a5a1e', goldL: '#fff0b0', ink: '#07060f', fill: ['#1a1440', '#0c0a22'], glow: '#5fe3ff', gem: '#5fe3ff' },
  nov: { gold: '#b07a44', goldD: '#5a3418', goldL: '#f0c890', ink: '#140a04', fill: ['#3a2414', '#1e1208'], glow: '#ffb347', gem: '#ffb347' },
  len: { gold: '#8a96a8', goldD: '#3a4250', goldL: '#d8e0ea', ink: '#06080c', fill: ['#1c2230', '#0e121a'], glow: '#a8bfd4', gem: '#e8893a' },
  baik: { gold: '#8a9070', goldD: '#3a3e2c', goldL: '#d8dcc0', ink: '#0a0b06', fill: ['#22241a', '#10110c'], glow: '#7dffb0', gem: '#7dffb0' },
  core: { gold: '#f0d890', goldD: '#9a7a3a', goldL: '#fffbe8', ink: '#05040a', fill: ['#1a1610', '#0a0806'], glow: '#fff4cf', gem: '#fff4cf' },
};

function frameLarge(theme: ThemeKey): Px {
  const T = THEMES[theme], S = 48, p = new Px(S, S);
  const G = [T.goldD, T.gold, T.goldL] as const;
  if (theme === 'archive' || theme === 'core') {
    p.rect(0, 0, S, S, T.ink);
    p.rect(2, 2, S - 4, S - 4, G[1]);
    p.hl(2, 2, S - 4, G[2]);
    p.vl(2, 2, S - 4, G[2]);
    p.hl(2, S - 3, S - 4, G[0]);
    p.vl(S - 3, 2, S - 4, G[0]);
    p.rect(3, 3, S - 6, S - 6, G[1]);
    p.hl(3, 3, S - 6, mix(G[1], G[2], 0.5));
    p.rect(4, 4, S - 8, S - 8, T.ink);
    p.rect(6, 6, S - 12, S - 12, G[0]);
    p.rect(7, 7, S - 14, S - 14, T.ink);
    for (let i = 9; i < S - 9; i += 2) {
      p.set(i, 8, '#2a3a6a');
      p.set(8, i, '#2a3a6a');
    }
    for (const [cx, cy, fx, fy] of [[0, 0, 1, 1], [S - 1, 0, -1, 1], [0, S - 1, 1, -1], [S - 1, S - 1, -1, -1]] as const) {
      const P = (x: number, y: number, c: string | number[]) => p.set(cx + fx * x, cy + fy * y, c);
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) P(x, y, T.ink);
      for (let y = 1; y < 11; y++) for (let x = 1; x < 11; x++) P(x, y, x === 1 || y === 1 ? G[2] : x === 10 || y === 10 ? G[0] : G[1]);
      for (let y = 3; y < 9; y++) for (let x = 3; x < 9; x++) P(x, y, T.ink);
      for (const [x, y] of [[5, 4], [6, 4], [4, 5], [5, 5], [6, 5], [7, 5], [4, 6], [5, 6], [6, 6], [7, 6], [5, 7], [6, 7]] as const) P(x, y, T.gem);
      P(5, 5, '#ffffff');
      for (const [x, y] of [[12, 2], [13, 2], [14, 3], [13, 4], [2, 12], [2, 13], [3, 14], [4, 13]] as const) P(x, y, G[2]);
    }
  } else if (theme === 'nov') {
    const W = ramp('#7a4e2a');
    p.rect(0, 0, S, S, T.ink);
    p.rect(1, 1, S - 2, S - 2, W[1]);
    p.rect(2, 2, S - 4, S - 4, W[2]);
    p.rect(7, 7, S - 14, S - 14, W[0]);
    p.rect(8, 8, S - 16, S - 16, T.ink);
    p.hl(2, 2, S - 4, W[4]);
    p.vl(2, 2, S - 4, W[3]);
    p.hl(2, S - 3, S - 4, W[0]);
    p.vl(S - 3, 2, S - 4, W[0]);
    for (let i = 15; i < S - 14; i++) {
      const k = i % 4;
      if (k === 0) {
        p.set(i, 4, W[0]);
        p.set(i, 5, W[1]);
        p.set(4, i, W[0]);
        p.set(5, i, W[1]);
        p.set(i, S - 5, W[0]);
        p.set(S - 5, i, W[0]);
      }
      if (k === 2) {
        p.set(i, 4, W[3]);
        p.set(4, i, W[3]);
      }
    }
    for (const [cx, cy] of [[7, 7], [S - 8, 7], [7, S - 8], [S - 8, S - 8]] as const) {
      p.ellipse(cx, cy, 6, 6, W[3]);
      p.ellipse(cx, cy, 5, 5, W[2]);
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3;
        p.line(cx, cy, cx + Math.cos(ang) * 4, cy + Math.sin(ang) * 4, W[0]);
      }
      p.set(cx, cy, T.gem);
      p.ring(cx, cy, 6, 6, W[0], 1, 1);
    }
  } else if (theme === 'len') {
    const M = ['#2a303c', '#4a5262', '#8a94a6', '#c8d0dc'] as const;
    p.rect(0, 0, S, S, T.ink);
    p.rect(1, 1, S - 2, S - 2, M[1]);
    p.rect(2, 2, S - 4, S - 4, M[0]);
    p.rect(4, 4, S - 8, S - 8, T.ink);
    p.hl(1, 1, S - 2, M[2]);
    p.vl(1, 1, S - 2, M[2]);
    p.rect(5, 5, S - 10, S - 10, M[0]);
    p.rect(6, 6, S - 12, S - 12, T.ink);
    for (const [x, y] of [[2, 2], [S - 5, 2], [2, S - 5], [S - 5, S - 5]] as const) {
      p.rect(x, y, 3, 3, M[2]);
      p.set(x, y, M[3]);
      p.set(x + 2, y + 2, M[0]);
    }
  } else {
    const M = ramp('#5a604a');
    p.rect(0, 0, S, S, T.ink);
    p.rect(1, 1, S - 2, S - 2, M[2]);
    p.hl(1, 1, S - 2, M[4]);
    p.vl(1, 1, S - 2, M[3]);
    p.hl(1, S - 2, S - 2, M[0]);
    p.vl(S - 2, 1, S - 2, M[0]);
    p.rect(6, 6, S - 12, S - 12, M[0]);
    p.rect(7, 7, S - 14, S - 14, T.ink);
    for (let i = 7; i < S - 6; i += 2) {
      p.set(i, 3, M[1]);
      p.set(3, i, M[1]);
    }
    for (const [x, y] of [[4, 4], [S - 5, 4], [4, S - 5], [S - 5, S - 5]] as const) {
      p.ellipse(x, y, 1.6, 1.6, M[3]);
      p.set(x - 1, y - 1, M[4]);
      p.set(x + 1, y + 1, M[0]);
    }
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) if (((12 + i + S - 6 + j) >> 1) % 2) p.set(12 + i, S - 6 + j, '#c8a030');
  }
  return p;
}

function frameSmall(theme: ThemeKey): Px {
  const T = THEMES[theme], S = 24, p = new Px(S, S);
  const G = [T.goldD, T.gold, T.goldL] as const;
  p.rect(0, 0, S, S, T.ink);
  p.rect(1, 1, S - 2, S - 2, G[1]);
  p.hl(1, 1, S - 2, G[2]);
  p.vl(1, 1, S - 2, G[2]);
  p.hl(1, S - 2, S - 2, G[0]);
  p.vl(S - 2, 1, S - 2, G[0]);
  p.rect(2, 2, S - 4, S - 4, T.ink);
  p.rect(3, 3, S - 6, S - 6, sh(T.fill[0], 0.15));
  p.rect(4, 4, S - 8, S - 8, T.ink);
  for (const [x, y] of [[0, 0], [S - 4, 0], [0, S - 4], [S - 4, S - 4]] as const) {
    p.rect(x, y, 4, 4, T.ink);
    p.rect(x + 1, y + 1, 2, 2, T.gem);
    p.set(x + 1, y + 1, '#ffffff');
  }
  if (theme === 'nov') for (let i = 6; i < S - 6; i += 3) {
    p.set(i, 1, G[0]);
    p.set(1, i, G[0]);
  }
  return p;
}

function tile(theme: ThemeKey): Px {
  const T = THEMES[theme], p = new Px(32, 32);
  p.rect(0, 0, 32, 32, T.fill[0]);
  if (theme === 'archive' || theme === 'core') for (let i = 0; i < 6; i++) p.set(hash2(i, 1, 9) * 32, hash2(i, 2, 9) * 32, theme === 'core' ? '#3a3020' : '#3a3470');
  if (theme === 'nov') for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (Math.sin((x + Math.sin(y / 5) * 3) / 2.2) > 0.75) p.set(x, y, '#442a16');
  if (theme === 'len') for (let i = 0; i < 40; i++) p.set(hash2(i, 3, 5) * 32, hash2(i, 4, 5) * 32, '#232a3a');
  if (theme === 'baik') {
    for (let y = 0; y < 32; y += 2) p.hl(0, y, 32, '#262a1e');
    for (let i = 0; i < 10; i++) p.hl(hash2(i, 5, 2) * 28, hash2(i, 6, 2) * 32, 4, '#2c3022');
  }
  return p;
}

function namePlate(theme: ThemeKey): Px {
  const T = THEMES[theme], w = 48, h = 22, p = new Px(w, h);
  if (theme === 'archive' || theme === 'core') {
    p.poly([[6, 0], [w - 6, 0], [w, 11], [w - 6, 22], [6, 22], [0, 11]], T.ink);
    p.poly([[7, 2], [w - 7, 2], [w - 2, 11], [w - 7, 20], [7, 20], [2, 11]], T.goldD);
    p.poly([[8, 3], [w - 8, 3], [w - 4, 11], [w - 8, 19], [8, 19], [4, 11]], T.glow);
    p.poly([[8, 3], [w - 8, 3], [w - 6, 7], [6, 7]], mix(T.glow, '#ffffff', 0.6));
    p.hl(8, 18, w - 16, sh(T.glow, -0.3));
  } else if (theme === 'nov') {
    const W = ramp('#c88a4a');
    p.rect(0, 1, w, 20, T.ink);
    p.rect(1, 2, w - 2, 18, W[2]);
    p.hl(1, 2, w - 2, W[4]);
    p.hl(1, 19, w - 2, W[0]);
    for (let x = 12; x < w - 12; x += 4) {
      p.set(x, 4, W[1]);
      p.set(x, 17, W[1]);
    }
    p.ellipse(5, 11, 2, 2, W[0]);
    p.ellipse(w - 6, 11, 2, 2, W[0]);
  } else if (theme === 'len') {
    p.rect(0, 1, w, 20, T.ink);
    p.rect(1, 2, w - 2, 18, '#c8ccd2');
    p.hl(1, 2, w - 2, '#eef0f4');
    p.hl(1, 19, w - 2, '#8a8e96');
  } else {
    p.rect(0, 1, w, 20, T.ink);
    p.rect(1, 2, w - 2, 18, '#1e2418');
    p.rect(2, 3, w - 4, 16, '#2a3222');
    p.rect(4, 8, 5, 5, '#103020');
    p.rect(5, 9, 3, 3, T.glow);
    p.hl(2, 3, w - 4, '#4a5a3a');
  }
  return p;
}

function ornament(theme: ThemeKey): Px {
  const T = THEMES[theme], p = new Px(30, 14);
  if (theme === 'archive' || theme === 'core') {
    p.poly([[0, 7], [8, 2], [22, 2], [30, 7], [22, 12], [8, 12]], T.ink);
    p.poly([[2, 7], [9, 3], [21, 3], [28, 7], [21, 11], [9, 11]], T.gold);
    p.poly([[4, 7], [10, 4], [20, 4], [26, 7], [20, 10], [10, 10]], T.goldD);
    p.ellipse(15, 7, 3.6, 3.6, T.ink);
    p.ellipse(15, 7, 2.6, 2.6, T.gem);
    p.set(14, 6, '#ffffff');
  } else if (theme === 'nov') {
    p.ellipse(15, 7, 7, 6.5, T.ink);
    p.ellipse(15, 7, 6, 5.5, '#c88a4a');
    for (let a = 0; a < 8; a++) p.line(15, 7, 15 + Math.cos((a * Math.PI) / 4) * 5, 7 + Math.sin((a * Math.PI) / 4) * 4.6, '#5a3418');
    p.set(15, 7, T.gem);
    p.hl(0, 7, 8, T.gold);
    p.hl(22, 7, 8, T.gold);
  } else if (theme === 'len') {
    p.rect(9, 3, 12, 8, T.ink);
    p.rect(10, 4, 10, 6, T.gold);
    p.hl(10, 4, 10, T.goldL);
    p.hl(0, 7, 9, T.goldD);
    p.hl(21, 7, 9, T.goldD);
  } else {
    p.rect(7, 2, 16, 10, T.ink);
    p.rect(8, 3, 14, 8, '#2a3222');
    for (let i = 0; i < 3; i++) p.rect(10 + i * 4, 6, 2, 2, i === 1 ? T.glow : '#ffd23f');
  }
  return p;
}

function icon(kind: 'target' | 'loupe' | 'journal' | 'menu' | 'arrow', theme: ThemeKey): Px {
  const T = THEMES[theme], p = new Px(18, 18);
  if (kind === 'target') {
    p.ring(9, 9, 7, 7, T.gold, 1, 1.4);
    p.ring(9, 9, 4, 4, T.gold, 1, 1);
    p.rect(8, 8, 2, 2, T.gem);
    p.set(8, 8, '#ffffff');
    for (const [x, y] of [[9, 0], [9, 17], [0, 9], [17, 9]] as const) p.set(x, y, T.goldL);
  } else if (kind === 'loupe') {
    p.ring(7, 7, 5.5, 5.5, '#ffd36b', 1, 2);
    p.ellipse(7, 7, 4, 4, '#5fe3ff', 0.35);
    p.set(5, 5, '#ffffff');
    p.set(6, 4, '#ffffff');
    for (let i = 0; i < 5; i++) p.rect(11 + i, 11 + i, 2, 2, '#c89a3a');
  } else if (kind === 'journal') {
    p.rect(3, 2, 12, 14, '#8a3a4a');
    p.vl(3, 2, 14, '#c05a6a');
    p.rect(5, 2, 1, 14, '#5a2030');
    p.rect(7, 5, 6, 3, '#f4ead4');
    p.hl(7, 10, 6, '#ffd36b');
    p.hl(7, 12, 5, '#ffd36b');
  } else if (kind === 'menu') {
    for (let i = 0; i < 3; i++) {
      p.rect(3, 4 + i * 4, 12, 2, '#f3eeff');
      p.hl(3, 5 + i * 4, 12, '#a9a2c8');
    }
  } else {
    p.poly([[4, 6], [14, 6], [9, 12]], T.goldL);
    p.hl(5, 6, 9, '#ffffff');
  }
  p.outline(0, '#07060f');
  return p;
}

const url = (p: Px): string => p.toCanvas().toDataURL();

export function installUiArt(): void {
  const rules: string[] = [];
  for (const th of Object.keys(THEMES) as ThemeKey[]) {
    rules.push(`#stage[data-theme='${th}']{--frameL:url(${url(frameLarge(th))});--frameS:url(${url(frameSmall(th))});--tile:url(${url(tile(th))});--plate:url(${url(namePlate(th))});--orn:url(${url(ornament(th))});--ic-target:url(${url(icon('target', th))});--ic-arrow:url(${url(icon('arrow', th))});--ink:${THEMES[th].ink};--glowc:${THEMES[th].glow};--goldL:${THEMES[th].goldL};--fill1:${THEMES[th].fill[0]};--fill2:${THEMES[th].fill[1]};}`);
  }
  rules.push(`:root{--ic-loupe:url(${url(icon('loupe', 'archive'))});--ic-journal:url(${url(icon('journal', 'archive'))});--ic-menu:url(${url(icon('menu', 'archive'))});}`);
  const st = document.createElement('style');
  st.id = 'ui-art';
  st.textContent = rules.join('\n');
  document.head.appendChild(st);
}

const PORTRAIT_OPTS: Partial<Record<CharId, Parameters<typeof portraitHuman>[2]>> = {
  maria: { gaunt: true, tired: true, grey: true, layer2: '#3a3a42', iris: '#4a5a6a' },
  zina: { gaunt: true, iris: '#3a4a6a' },
  ivan: { tired: true, iris: '#4a5a4a' },
  prohorov: { tired: true },
  ignat: { iris: '#5a4a2a', tired: true },
  inspector: { iris: '#2a2a3a' },
  correspondent: { iris: '#2a2a3a' },
  player: { iris: '#3a6a5a' },
  lete: { iris: '#c8a040' },
};
const cache = new Map<string, string>();

export function artUrl(key: string, make: () => Px): string {
  const hit = cache.get('art|' + key);
  if (hit) return hit;
  const u = url(make());
  cache.set('art|' + key, u);
  return u;
}
export function panelModuleUrl(seed: number): string {
  return artUrl('pm' + seed, () => panelModule(seed));
}
export function panelTileUrl(): string {
  return artUrl('ptile', () => panelTile());
}
export function cardArtUrl(kind: 'bark' | 'metronome' | 'vostok'): string {
  return artUrl('card' + kind, () => cardArt(kind));
}
export function choiceArtUrl(epoch: 1 | 2 | 3, which: 'truth' | 'agree'): string {
  return artUrl(`choice${epoch}${which}`, () => choiceArt(epoch, which));
}

export function portraitUrl(who: string, mood: string, theme: ThemeKey): string | null {
  const m: PortraitMood = mood === 'whisper' ? 'whisper' : mood === 'quiet' ? 'worried' : mood === 'glitch' ? 'smug' : 'talk';
  const key = `${who}|${m}|${theme}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let p: Px;
  if (who === 'byte') p = portraitByte(theme === 'nov' ? 'raven' : theme === 'baik' ? 'kestrel' : theme === 'len' ? 'collar' : 'drone', m);
  else {
    const id = (who === 'mnema' ? 'player' : who) as CharId;
    const base = CHARACTERS[id];
    if (!base) return null;
    const def = id === 'player' ? CHARACTERS[theme === 'nov' ? 'player_nov' : theme === 'len' ? 'player_len' : theme === 'baik' ? 'player_baik' : 'player'] : base;
    p = portraitHuman(def, m, PORTRAIT_OPTS[id] ?? {});
  }
  const u = url(p);
  cache.set(key, u);
  return u;
}
