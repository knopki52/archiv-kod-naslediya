import { AudioEngine } from '../audio/AudioEngine';
import type { EventBus } from './EventBus';
import { IS_DEBUG } from '../config';
import type { ClueId, Step } from '../content/types';
import { CLUES } from '../content/clues';
import type { Game } from './Game';
import { el } from '../ui/Ui';

declare global {
  interface Window {
    __game?: DebugApi;
  }
}

export interface DebugApi {
  getState(): ReturnType<() => Game['store']['state']>;
  jumpTo(scene: string, params?: Record<string, unknown>): void;
  runScript(ref: string): Promise<void>;
  performStep(step: Step): Promise<void>;
  stopScripts(): void;
  startNewGame(): void;
  checkpoint(id: string): void;
  continueGame(): boolean;
  scene(): string;
  advanceDialog(): void;
  answerChoice(i: number): void;
  giveClues(epoch: 1 | 2 | 3): void;
  setIntegrity(n: number): void;
  setTimeScale(n: number): void;
  isDialogOpen(): boolean;
  playSfx(name: string): void;
  playMusic(id: string): void;
  playAmbience(name: string | null): void;
  audioLevel(): { peak: number; rms: number };
  audioState(): string;
  audioTime(): number;
  playerPos(): { x: number; y: number } | null;
  teleport(x: number, y?: number): void;
  setSetting(key: string, value: unknown): void;
  isChoiceOpen(): boolean;
}

export function installDebug(game: Game): void {
  if (!IS_DEBUG) return;

  const api: DebugApi = {
    getState: () => game.store.state,
    ...({ _game: game } as object),
    ...({
      stepToward: (tx: number, ty?: number, step = 6): boolean => {
        const w = game.world as unknown as { player?: { x: number; y: number }; isFree?: (x: number, y: number) => boolean } | null;
        const p = w?.player;
        if (!w || !p || !w.isFree) return true;
        game.hints.activity();
        const free = (x: number, y: number) => w.isFree!(x, y);
        const ox = p.x, oy = p.y;
        const dx = Math.sign(tx - p.x) * Math.min(step, Math.abs(tx - p.x));
        const wantY = ty ?? p.y;
        const dy = Math.sign(wantY - p.y) * Math.min(step, Math.abs(wantY - p.y));
        if (dx !== 0) {
          if (free(p.x + dx, p.y)) p.x += dx;
          else {
            for (let k = 2; k < 160; k += 2) {
              const yy = [p.y - k, p.y + k].find((y) => free(p.x, y) && free(p.x + dx, y));
              if (yy !== undefined) {
                const sy = Math.sign(yy - p.y) * Math.min(step, Math.abs(yy - p.y));
                if (free(p.x, p.y + sy)) p.y += sy;
                return p.y === oy;
              }
            }
          }
        }
        if (dy !== 0 && free(p.x, p.y + dy)) p.y += dy;
        return (Math.abs(p.x - tx) < 1 && (ty === undefined || Math.abs(p.y - ty) < 1)) || (p.x === ox && p.y === oy);
      },
      approach: (text: string): boolean => {
        const w = game.world as unknown as {
          player?: { x: number; y: number };
          isFree?: (x: number, y: number) => boolean;
          interactables?: { def: { x: number; y: number; prompt?: string } }[];
        } | null;
        if (!w?.player || !w.isFree || !w.interactables) return false;
        const it = w.interactables.find((i) => (i.def.prompt ?? '').includes(text));
        if (!it) return false;
        const { x, y } = it.def;
        let best: [number, number] | null = null;
        let bd = 1e9;
        for (let oy = -30; oy <= 30; oy += 2)
          for (let ox = -26; ox <= 26; ox += 2) {
            const d = Math.hypot(ox, oy * 1.2);
            if (d > 22 || d >= bd) continue;
            if (w.isFree(x + ox, y + oy)) {
              best = [x + ox, y + oy];
              bd = d;
            }
          }
        if (!best) return false;
        w.player.x = best[0];
        w.player.y = best[1];
        return true;
      },
    } as object),
    ...({
      renderAudio: async (kind: 'music' | 'sfx' | 'amb', id: string, seconds = 12, intensity = 0) => {
        const stub = { on: () => () => undefined, emit: () => undefined } as unknown as EventBus;
        const buf = await AudioEngine.renderOffline(game.settings, stub, seconds, (e) => {
          if (kind === 'music') e.music.scheduleAll(id, seconds, intensity);
          else if (kind === 'sfx') e.sfx.play(id);
          else e.ambience.set(id, 0.01);
        });
        return audioStats(buf);
      },
    } as object),
    jumpTo: (scene, params) => game.goto(scene, params),
    runScript: (ref) => game.runScript(ref),
    performStep: (step) => game.perform(step),
    stopScripts: () => game.stopScripts(),
    startNewGame: () => game.startNewGame(),
    checkpoint: (id) => game.checkpoint(id),
    continueGame: () => game.continueGame(),
    scene: () => game.phaser.scene.getScenes(true)[0]?.scene.key ?? '',
    advanceDialog: () => game.dialog.advance(),
    answerChoice: (i) => game.choiceMenu.answer(i),
    giveClues: (epoch) => {
      (Object.keys(CLUES) as ClueId[]).filter((id) => CLUES[id].epoch === epoch && CLUES[id].kind === 'true').forEach((id) => game.store.giveClue(id));
    },
    setIntegrity: (n) => {
      game.store.state.integrity = Math.max(0, Math.min(3, n));
      game.bus.emit('state:changed');
    },
    setTimeScale: (n) => {
      game.timeScale = n;
    },
    isDialogOpen: () => game.dialog.isOpen,
    playSfx: (name) => game.audio.sfx.play(name),
    playMusic: (id) => game.audio.music.play(id, 0.2),
    playAmbience: (name) => game.audio.ambience.set(name, 0.2),
    audioLevel: () => game.audio.level(),
    audioState: () => game.audio.ctx?.state ?? 'none',
    audioTime: () => game.audio.now(),
    playerPos: () => game.world?.playerPos?.() ?? null,
    teleport: (x, y) => game.world?.setPlayerPos?.(x, y),
    setSetting: (key, value) => game.settings.set(key as 'textSpeed', value as never),
    isChoiceOpen: () => game.choiceMenu.isOpen,
  };
  window.__game = api;
  const log: string[] = [];
  (window as unknown as { __log: string[] }).__log = log;
  game.bus.on('scene:enter', ({ key }) => log.push(`${Math.round(performance.now())} enter ${key}`));
  game.bus.on('dialog:start', () => undefined);

  const panel = el('div', 'debug-panel', game.ui.layers.overlay);
  panel.hidden = true;
  const out = el('pre', '', panel);
  const row = (label: string, fn: () => void) => {
    const b = el('button', '', panel, label);
    b.type = 'button';
    b.addEventListener('click', () => {
      fn();
      refresh();
    });
  };
  row('speed 1×', () => api.setTimeScale(1));
  row('2×', () => api.setTimeScale(2));
  row('4×', () => api.setTimeScale(4));
  row('clues E1', () => api.giveClues(1));
  row('clues E2', () => api.giveClues(2));
  row('clues E3', () => api.giveClues(3));
  [0, 1, 2, 3].forEach((n) => row(`integrity ${n}`, () => api.setIntegrity(n)));
  row('→ test', () => api.jumpTo('test'));
  panel.appendChild(out);
  const refresh = () => {
    out.textContent = JSON.stringify(game.store.state, null, 1);
  };
  game.bus.on('state:changed', () => !panel.hidden && refresh());
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.code === 'Backquote') {
      panel.hidden = !panel.hidden;
      refresh();
    }
  });
}

function audioStats(buf: AudioBuffer): { peak: number; rms: number; clip: number; wav: string } {
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0, sum = 0, clip = 0;
  for (let i = 0; i < L.length; i++) {
    const v = Math.max(Math.abs(L[i]!), Math.abs(R[i]!));
    peak = Math.max(peak, v);
    sum += L[i]! * L[i]!;
    if (v > 0.99) clip++;
  }
  const n = L.length, bytes = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) bytes.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); bytes.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true); bytes.setUint32(24, buf.sampleRate, true);
  bytes.setUint32(28, buf.sampleRate * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true); w(36, 'data'); bytes.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    bytes.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i]!)) * 32767, true);
    bytes.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i]!)) * 32767, true);
  }
  let bin = '';
  const u8 = new Uint8Array(bytes.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return { peak, rms: Math.sqrt(sum / n), clip, wav: btoa(bin) };
}
