import type { AudioEngine } from './AudioEngine';
import { playNote } from './Instruments';

export const AMBIENCE_NAMES = ['wind_snow', 'market', 'nov_room', 'stove', 'len_city', 'servers', 'steppe', 'bunker', 'core'] as const;
export type AmbienceName = (typeof AMBIENCE_NAMES)[number];

type Builder = (ctx: AudioContext, out: AudioNode, a: AudioEngine) => () => void;


function loopNoise(ctx: AudioContext, a: AudioEngine): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = a.noise;
  s.loop = true;
  s.start(0, Math.random());
  return s;
}

function lfo(ctx: AudioContext, freq: number, depth: number, target: AudioParam): OscillatorNode {
  const o = ctx.createOscillator();
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
  return o;
}

function filt(ctx: AudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}

function panTo(ctx: AudioContext, out: AudioNode, pan: number): AudioNode {
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  p.connect(out);
  return p;
}

function every(meanSec: number, fn: () => void, firstSec = meanSec * 0.5): () => void {
  let stopped = false;
  let timer = 0;
  const go = () => {
    if (stopped) return;
    try {
      fn();
    } catch {
      void 0;
    }
    timer = window.setTimeout(go, Math.max(0.05, -Math.log(1 - Math.random()) * meanSec) * 1000);
  };
  timer = window.setTimeout(go, firstSec * 1000);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

function wind(ctx: AudioContext, out: AudioNode, a: AudioEngine, base: number, vol: number, howl = 0): () => void {
  const nodes: AudioScheduledSourceNode[] = [];
  for (const [i, pan] of [[0, -0.5], [1, 0.5]] as const) {
    const src = loopNoise(ctx, a);
    const f = filt(ctx, 'bandpass', base * (i ? 1.3 : 0.8), 0.6 + howl * 3);
    const g = ctx.createGain();
    g.gain.value = vol * 0.6;
    nodes.push(src, lfo(ctx, 0.07 + i * 0.05, vol * 0.45, g.gain), lfo(ctx, 0.05 + i * 0.03, base * 0.5, f.frequency));
    src.connect(f).connect(g).connect(panTo(ctx, out, pan));
  }
  const low = loopNoise(ctx, a);
  const lf = filt(ctx, 'lowpass', 160);
  const lg = ctx.createGain();
  lg.gain.value = vol * 0.5;
  low.connect(lf).connect(lg).connect(out);
  nodes.push(low);
  const g2 = ctx.createGain();
  g2.gain.value = 0;
  const gs = loopNoise(ctx, a);
  const gf = filt(ctx, 'bandpass', base * 1.6, 1.2 + howl * 4);
  gs.connect(gf).connect(g2).connect(out);
  nodes.push(gs);
  const stopGust = every(7, () => {
    const t = ctx.currentTime, d = 2 + Math.random() * 3;
    g2.gain.cancelScheduledValues(t);
    g2.gain.setValueAtTime(g2.gain.value, t);
    g2.gain.linearRampToValueAtTime(vol * (0.5 + Math.random() * 0.6), t + d * 0.4);
    g2.gain.linearRampToValueAtTime(0, t + d);
    gf.frequency.setValueAtTime(base * (1.2 + Math.random()), t);
    gf.frequency.linearRampToValueAtTime(base * (1.8 + Math.random()), t + d * 0.5);
    gf.frequency.linearRampToValueAtTime(base, t + d);
  }, 2);
  return () => {
    stopGust();
    nodes.forEach((n) => n.stop());
  };
}

function fire(ctx: AudioContext, out: AudioNode, a: AudioEngine, vol: number): () => void {
  const src = loopNoise(ctx, a);
  const f = filt(ctx, 'lowpass', 300);
  const g = ctx.createGain();
  g.gain.value = vol * 0.5;
  const l = lfo(ctx, 0.3, vol * 0.2, g.gain);
  src.connect(f).connect(g).connect(out);
  const hiss = loopNoise(ctx, a);
  const hf = filt(ctx, 'highpass', 5000);
  const hg = ctx.createGain();
  hg.gain.value = vol * 0.04;
  hiss.connect(hf).connect(hg).connect(out);
  const crack = (big: boolean) => {
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = a.noise;
    const bf = filt(ctx, 'bandpass', (big ? 1200 : 2500) * (0.6 + Math.random()), big ? 1 : 2);
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(vol * (big ? 1.2 : 0.5) * (0.4 + Math.random()), t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.06 : 0.02) + Math.random() * 0.03);
    s.connect(bf).connect(cg).connect(panTo(ctx, out, Math.random() * 0.6 - 0.3));
    s.start(t, Math.random());
    s.stop(t + 0.12);
  };
  const s1 = every(0.18, () => crack(false));
  const s2 = every(1.6, () => crack(true));
  return () => {
    s1();
    s2();
    [src, hiss, l].forEach((n) => n.stop());
  };
}

function crow(ctx: AudioContext, out: AudioNode): void {
  const t0 = ctx.currentTime;
  const pan = Math.random() * 1.6 - 0.8;
  const n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.42;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(560, t);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.28);
    const f = filt(ctx, 'bandpass', 1300, 3);
    const f2 = filt(ctx, 'bandpass', 2600, 4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    const p = panTo(ctx, out, pan);
    o.connect(f).connect(g).connect(p);
    o.connect(f2).connect(g);
    o.start(t);
    o.stop(t + 0.35);
  }
}

function lark(ctx: AudioContext, out: AudioNode): void {
  const t0 = ctx.currentTime;
  const p = panTo(ctx, out, Math.random() * 1.6 - 0.8);
  const n = 6 + Math.floor(Math.random() * 10);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * (0.06 + Math.random() * 0.05);
    const o = ctx.createOscillator();
    const f = 2800 + Math.random() * 2200;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.6), t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.018, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(p);
    o.start(t);
    o.stop(t + 0.08);
  }
}

function murmur(ctx: AudioContext, out: AudioNode, a: AudioEngine, vol: number): () => void {
  const nodes: AudioScheduledSourceNode[] = [];
  for (let i = 0; i < 3; i++) {
    const src = loopNoise(ctx, a);
    const f = filt(ctx, 'bandpass', 500 + i * 350, 4);
    const g = ctx.createGain();
    g.gain.value = vol * 0.4;
    nodes.push(src, lfo(ctx, 2.5 + i * 1.3, vol * 0.4, g.gain), lfo(ctx, 0.9 + i * 0.7, 180, f.frequency));
    src.connect(f).connect(g).connect(panTo(ctx, out, i - 1));
  }
  return () => nodes.forEach((n) => n.stop());
}

function hum(ctx: AudioContext, out: AudioNode, a: AudioEngine, vol: number, base = 50): () => void {
  const lp = filt(ctx, 'lowpass', 420);
  const g = ctx.createGain();
  g.gain.value = vol;
  const oscs = [base, base * 2, base * 3, base * 2.01].map((hz, i) => {
    const o = ctx.createOscillator();
    o.type = i === 1 ? 'sawtooth' : 'sine';
    o.frequency.value = hz;
    const og = ctx.createGain();
    og.gain.value = [0.6, 0.25, 0.2, 0.3][i]!;
    o.connect(og).connect(lp);
    o.start();
    return o;
  });
  lp.connect(g).connect(out);
  const fan = loopNoise(ctx, a);
  const ff = filt(ctx, 'bandpass', 900, 0.5);
  const fg = ctx.createGain();
  fg.gain.value = vol * 0.35;
  fan.connect(ff).connect(fg).connect(out);
  const l = lfo(ctx, 0.13, vol * 0.15, g.gain);
  return () => [...oscs, fan, l].forEach((o) => o.stop());
}

function chirp(ctx: AudioContext, out: AudioNode, vol: number): void {
  const t0 = ctx.currentTime;
  const p = panTo(ctx, out, Math.random() * 1.4 - 0.7);
  const n = 2 + Math.floor(Math.random() * 5);
  const base = [1760, 2093, 2349, 2637, 3136][Math.floor(Math.random() * 5)]!;
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.07;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = base * [1, 1.25, 1.5, 0.75][i % 4]!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(filt(ctx, 'lowpass', 3000)).connect(g).connect(p);
    o.start(t);
    o.stop(t + 0.05);
  }
}

function relay(ctx: AudioContext, out: AudioNode, a: AudioEngine, vol: number): void {
  const t = ctx.currentTime;
  for (const k of [0, 0.012]) {
    const s = ctx.createBufferSource();
    s.buffer = a.noise;
    const f = filt(ctx, 'bandpass', 3000 + Math.random() * 2000, 3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t + k);
    g.gain.exponentialRampToValueAtTime(0.0001, t + k + 0.012);
    s.connect(f).connect(g).connect(panTo(ctx, out, Math.random() - 0.5));
    s.start(t + k, Math.random());
    s.stop(t + k + 0.03);
  }
}

function thud(ctx: AudioContext, out: AudioNode, a: AudioEngine, vol: number): void {
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = a.noise;
  const f = filt(ctx, 'lowpass', 120);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random());
  s.stop(t + 2);
}


const BUILDERS: Record<AmbienceName, Builder> = {
  wind_snow: (ctx, out, a) => {
    const stops = [wind(ctx, out, a, 480, 0.3), murmur(ctx, out, a, 0.05)];
    stops.push(every(14, () => crow(ctx, out), 4));
    stops.push(every(45, () => playNote(a, out, 'church', { when: ctx.currentTime + 0.05, midi: 43, dur: 6, vel: 0.06, pan: -0.7, rev: 0.6 }), 20));
    return () => stops.forEach((s) => s());
  },
  market: (ctx, out, a) => {
    const stops = [wind(ctx, out, a, 480, 0.22), murmur(ctx, out, a, 0.1)];
    stops.push(every(12, () => crow(ctx, out), 5));
    return () => stops.forEach((s) => s());
  },
  nov_room: (ctx, out, a) => {
    const muf = filt(ctx, 'lowpass', 500);
    muf.connect(out);
    const stops = [fire(ctx, out, a, 0.22), wind(ctx, muf, a, 300, 0.16)];
    return () => {
      stops.forEach((s) => s());
      muf.disconnect();
    };
  },
  stove: (ctx, out, a) => {
    const muf = filt(ctx, 'lowpass', 420);
    muf.connect(out);
    const stops = [fire(ctx, out, a, 0.2), wind(ctx, muf, a, 260, 0.14)];
    stops.push(every(40, () => thud(ctx, out, a, 0.12), 25));
    return () => {
      stops.forEach((s) => s());
      muf.disconnect();
    };
  },
  len_city: (ctx, out, a) => {
    const stops = [wind(ctx, out, a, 380, 0.28, 0.4)];
    stops.push(every(30, () => thud(ctx, out, a, 0.16), 12));
    return () => stops.forEach((s) => s());
  },
  servers: (ctx, out, a) => {
    const stops = [hum(ctx, out, a, 0.09, 55)];
    stops.push(every(2.5, () => chirp(ctx, out, 0.02), 1));
    stops.push(every(6, () => relay(ctx, out, a, 0.05), 3));
    return () => stops.forEach((s) => s());
  },
  steppe: (ctx, out, a) => {
    const stops = [wind(ctx, out, a, 650, 0.32)];
    stops.push(every(9, () => lark(ctx, out), 3));
    return () => stops.forEach((s) => s());
  },
  bunker: (ctx, out, a) => {
    const stops = [hum(ctx, out, a, 0.1, 50)];
    const src = loopNoise(ctx, a);
    const f = filt(ctx, 'bandpass', 2400, 0.6);
    const g = ctx.createGain();
    g.gain.value = 0.014;
    const l = lfo(ctx, 0.4, 0.008, g.gain);
    src.connect(f).connect(g).connect(panTo(ctx, out, 0.4));
    stops.push(() => [src, l].forEach((n) => n.stop()));
    stops.push(every(3, () => relay(ctx, out, a, 0.07), 1));
    return () => stops.forEach((s) => s());
  },
  core: (ctx, out, a) => {
    const g = ctx.createGain();
    g.gain.value = 0.09;
    const oscs = [65.4, 98, 130.8, 196.2].map((hz, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz;
      o.detune.value = (i - 1.5) * 4;
      const og = ctx.createGain();
      og.gain.value = 0.5 / (i + 1);
      o.connect(og).connect(g);
      o.start();
      return o;
    });
    const l = lfo(ctx, 0.08, 0.025, g.gain);
    g.connect(out);
    if (a.reverbIn) {
      const s = ctx.createGain();
      s.gain.value = 0.6;
      g.connect(s).connect(a.reverbIn);
    }
    const stops = [every(3, () => chirp(ctx, out, 0.006), 1)];
    return () => {
      stops.forEach((s) => s());
      [...oscs, l].forEach((o) => o.stop());
    };
  },
};

export class Ambience {
  private cur: { name: AmbienceName; gain: GainNode; stop: () => void } | null = null;

  constructor(private a: AudioEngine) {}

  get currentName(): string | null {
    return this.cur?.name ?? null;
  }

  set(name: AmbienceName | string | null, fade = 1.2): void {
    this.a.whenReady(() => this.apply(name, fade));
  }

  private apply(name: string | null, fade: number): void {
    const ctx = this.a.ctx!;
    if (this.cur?.name === name) return;
    const old = this.cur;
    this.cur = null;
    if (old) {
      const t = ctx.currentTime;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + fade);
      window.setTimeout(() => {
        old.stop();
        old.gain.disconnect();
      }, fade * 1000 + 100);
    }
    if (!name || !(name in BUILDERS)) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fade);
    gain.connect(this.a.buses.amb);
    const stop = BUILDERS[name as AmbienceName](ctx, gain, this.a);
    this.cur = { name: name as AmbienceName, gain, stop };
  }
}
