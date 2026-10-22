import type { AudioEngine } from './AudioEngine';
import { playNote, type InstrumentId } from './Instruments';

export const SFX_NAMES = [
  'click', 'hover', 'open', 'close', 'loupe_scan', 'loupe_ping', 'clue', 'contradiction', 'fail', 'glitch',
  'crumble', 'assemble', 'portal', 'snap', 'board_ok', 'card', 'step_snow', 'step_wood', 'step_stone',
  'step_steppe', 'sparks', 'radio_click', 'rocket', 'pencil', 'page', 'door', 'stamp', 'choice',
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

type Wave = OscillatorType;

export class Sfx {
  private active = 0;

  constructor(private a: AudioEngine) {}

  play(name: string): void {
    if (!this.a.ready) return;
    if (this.active > 14) return;
    const fn = this.table[name as SfxName];
    if (fn) fn();
  }

  private jitter(f: number): number {
    return f * (1 + (Math.random() - 0.5) * 0.06);
  }

  tone(freq: number, dur: number, type: Wave = 'sine', vol = 0.2, opts: { slideTo?: number; delay?: number; attack?: number; bus?: 'sfx' | 'ui' | 'music' } = {}): void {
    const ctx = this.a.ctx!;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(this.jitter(freq), t0);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    const atk = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.a.buses[opts.bus ?? 'sfx']);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    this.active++;
    o.onended = () => this.active--;
  }

  noise(dur: number, freq = 2000, q = 0.8, vol = 0.2, type: BiquadFilterType = 'bandpass', opts: { delay?: number; slideTo?: number; attack?: number } = {}): void {
    const ctx = this.a.ctx!;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.a.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) f.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.a.buses.sfx);
    src.start(t0, Math.random());
    src.stop(t0 + dur + 0.05);
    this.active++;
    src.onended = () => this.active--;
  }

  inst(id: InstrumentId, midi: number, vel: number, delay = 0, dur = 1, rev = 0.35, pan = 0): void {
    const ctx = this.a.ctx!;
    playNote(this.a, this.a.buses.sfx, id, { when: ctx.currentTime + delay + 0.005, midi, dur, vel, rev, pan });
  }

  grains(n: number, spread: number, fLo: number, fHi: number, q: number, vol: number, len = 0.012, delay = 0, type: BiquadFilterType = 'bandpass'): void {
    const ctx = this.a.ctx!;
    const t0 = ctx.currentTime + delay;
    for (let i = 0; i < n; i++) {
      const t = t0 + Math.random() * spread;
      const src = ctx.createBufferSource();
      src.buffer = this.a.noise;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = fLo + Math.random() * (fHi - fLo);
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * (0.4 + Math.random() * 0.6), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len * (0.6 + Math.random()));
      src.connect(f).connect(g).connect(this.a.buses.sfx);
      src.start(t, Math.random() * 1.5);
      src.stop(t + len * 2 + 0.01);
    }
  }

  thump(f0: number, f1: number, dur: number, vol: number, delay = 0): void {
    this.tone(f0, dur, 'sine', vol, { slideTo: f1, delay });
  }

  blip(pitch: number): void {
    if (!this.a.ready || pitch <= 0) return;
    const f = pitch * (0.97 + Math.random() * 0.06);
    this.tone(f, 0.05, pitch < 400 ? 'triangle' : 'square', 0.035, { bus: 'ui' });
  }

  private table: Record<SfxName, () => void> = {
    click: () => {
      this.noise(0.018, 2600, 3, 0.05, 'bandpass');
      this.tone(1400, 0.03, 'sine', 0.03, { bus: 'ui' });
    },
    hover: () => this.noise(0.012, 3800, 4, 0.02, 'bandpass'),
    open: () => {
      this.noise(0.22, 900, 0.7, 0.05, 'bandpass', { slideTo: 3200, attack: 0.06 });
      this.inst('celesta', 84, 0.12, 0.04, 0.6, 0.4);
    },
    close: () => {
      this.noise(0.18, 2800, 0.7, 0.04, 'bandpass', { slideTo: 700, attack: 0.03 });
      this.inst('celesta', 77, 0.1, 0.02, 0.5, 0.3);
    },
    choice: () => {
      this.inst('celesta', 79, 0.2, 0, 0.6, 0.4);
      this.inst('celesta', 86, 0.2, 0.08, 0.8, 0.5);
    },
    loupe_scan: () => {
      this.tone(420, 0.45, 'sine', 0.05, { slideTo: 1250, attack: 0.05 });
      this.noise(0.4, 3000, 2, 0.02, 'bandpass', { slideTo: 6000, attack: 0.1 });
    },
    loupe_ping: () => {
      this.inst('celesta', 96, 0.3, 0, 1, 0.5);
      this.inst('bell', 91, 0.12, 0.03, 1, 0.6);
    },
    clue: () => {
      [79, 83, 86, 91].forEach((m, i) => this.inst('celesta', m, 0.32 - i * 0.03, i * 0.07, 1.2, 0.55, -0.3 + i * 0.2));
      this.inst('bell', 67, 0.18, 0.05, 2, 0.6);
    },
    contradiction: () => {
      this.inst('kick', 36, 0.9);
      this.inst('brass', 46, 0.7, 0, 0.7, 0.4);
      this.inst('brass', 47, 0.5, 0, 0.7, 0.4);
      this.inst('piano', 40, 0.6, 0, 1.5, 0.5);
      this.inst('celesta', 98, 0.2, 0.12, 1, 0.7);
      this.noise(0.35, 6000, 0.6, 0.05, 'highpass', { attack: 0.01 });
    },
    fail: () => {
      this.thump(160, 70, 0.25, 0.2);
      this.inst('piano', 47, 0.35, 0, 0.6, 0.3);
      this.inst('piano', 46, 0.35, 0.18, 0.9, 0.3);
    },
    glitch: () => {
      for (let i = 0; i < 9; i++) this.tone(200 + Math.random() * 2400, 0.025, 'square', 0.04, { delay: i * 0.018 });
      this.noise(0.16, 3000, 0.4, 0.12, 'bandpass', { slideTo: 300 });
      this.tone(70, 0.14, 'sawtooth', 0.07, { slideTo: 35 });
    },
    crumble: () => {
      this.grains(60, 1.2, 1500, 7000, 2, 0.05, 0.02);
      this.grains(20, 1.0, 300, 900, 1, 0.06, 0.04, 0.1);
      this.noise(1.3, 4000, 0.4, 0.03, 'highpass', { attack: 0.3, slideTo: 1500 });
      [72, 70, 67, 63].forEach((m, i) => this.inst('celesta', m, 0.08, 0.15 + i * 0.22, 0.6, 0.7));
    },
    assemble: () => {
      this.grains(50, 0.8, 1500, 7000, 2, 0.04, 0.02);
      [63, 67, 70, 75].forEach((m, i) => this.inst('celesta', m, 0.12, 0.1 + i * 0.12, 0.8, 0.6));
      this.inst('bell', 75, 0.15, 0.65, 2, 0.7);
    },
    portal: () => {
      this.noise(1.6, 400, 0.8, 0.12, 'bandpass', { slideTo: 4500, attack: 0.5 });
      [60, 64, 67, 72].forEach((m, i) => this.inst('choir', m, 0.25, 0.2 + i * 0.05, 1.6, 0.8, (i - 1.5) * 0.4));
      for (let i = 0; i < 10; i++) this.inst('celesta', 72 + [0, 4, 7, 11, 12, 16, 19, 23, 24, 28][i]!, 0.1, 0.4 + i * 0.06, 0.6, 0.8, -0.6 + i * 0.13);
    },
    snap: () => {
      this.noise(0.02, 1800, 4, 0.12, 'bandpass');
      this.thump(320, 180, 0.06, 0.08);
    },
    board_ok: () => {
      [67, 71, 74, 79, 83, 86].forEach((m, i) => this.inst('harp', m, 0.35, i * 0.05, 1.5, 0.5, -0.5 + i * 0.2));
      this.inst('bell', 79, 0.2, 0.32, 2, 0.6);
    },
    card: () => {
      [72, 76, 79, 84].forEach((m, i) => this.inst('celesta', m, 0.25, i * 0.1, 1.5, 0.6));
      [60, 64, 67].forEach((m) => this.inst('strings', m, 0.4, 0.3, 1.8, 0.6));
      this.inst('bell', 84, 0.25, 0.45, 2.5, 0.7);
    },
    step_snow: () => {
      this.grains(7, 0.07, 900, 3200, 1.4, 0.14, 0.02);
      this.noise(0.08, 500, 0.8, 0.05, 'lowpass');
    },
    step_wood: () => {
      this.thump(130, 90, 0.08, 0.2);
      this.noise(0.03, 900, 2, 0.1, 'bandpass');
      if (Math.random() < 0.12) this.tone(380 + Math.random() * 200, 0.18, 'sawtooth', 0.008, { slideTo: 330, attack: 0.05 });
    },
    step_stone: () => {
      this.noise(0.025, 2200, 2.5, 0.12, 'bandpass');
      this.thump(220, 150, 0.04, 0.1);
    },
    step_steppe: () => {
      this.grains(6, 0.06, 2500, 6000, 1, 0.1, 0.014);
      this.noise(0.06, 700, 0.7, 0.06, 'lowpass');
    },
    sparks: () => {
      this.grains(14, 0.25, 3500, 8000, 3, 0.06, 0.01);
    },
    radio_click: () => {
      this.noise(0.03, 2800, 1, 0.12, 'bandpass');
      this.noise(0.5, 2000, 0.5, 0.03, 'bandpass', { delay: 0.03, attack: 0.02 });
      this.tone(1800, 0.02, 'square', 0.03, { delay: 0.04 });
    },
    rocket: () => {
      this.noise(7, 70, 0.6, 1.2, 'lowpass', { slideTo: 600, attack: 1.5 });
      this.noise(7, 700, 0.4, 0.4, 'bandpass', { slideTo: 2600, attack: 2.5 });
      this.tone(38, 7, 'sawtooth', 0.35, { slideTo: 70, attack: 1.8 });
      this.grains(160, 6, 800, 5000, 1.5, 0.12, 0.03, 1);
    },
    pencil: () => this.grains(8, 0.12, 3500, 7500, 2, 0.025, 0.015),
    page: () => {
      this.noise(0.22, 1800, 0.5, 0.06, 'bandpass', { slideTo: 700, attack: 0.04 });
      this.grains(10, 0.2, 2500, 6000, 1, 0.025, 0.012);
    },
    door: () => {
      this.tone(210, 0.45, 'sawtooth', 0.012, { slideTo: 160, attack: 0.08 });
      this.thump(110, 60, 0.22, 0.16, 0.38);
      this.noise(0.12, 500, 1, 0.06, 'lowpass', { delay: 0.38 });
    },
    stamp: () => {
      this.thump(120, 45, 0.2, 0.25);
      this.noise(0.08, 700, 0.8, 0.12, 'lowpass');
      this.noise(0.1, 3000, 0.6, 0.03, 'bandpass', { delay: 0.02 });
    },
  };
}
