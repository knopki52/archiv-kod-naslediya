import type { AudioEngine } from './AudioEngine';


export type InstrumentId =
  | 'gusli' | 'piano' | 'celesta' | 'bell' | 'church' | 'harp'
  | 'pad' | 'strings' | 'choir' | 'flute' | 'reed' | 'theremin' | 'bass' | 'subbass' | 'brass'
  | 'kick' | 'snare' | 'hat' | 'buben' | 'drum' | 'shaker';

export interface Hit {
  when: number;
  midi: number;
  dur: number;
  vel: number;
  pan?: number;
  rev?: number;
}

export const midiHz = (m: number): number => 440 * 2 ** ((m - 69) / 12);

const cache = new Map<string, AudioBuffer>();

function render(a: AudioEngine, key: string, seconds: number, fill: (d: Float32Array, sr: number) => void): AudioBuffer {
  const hit = cache.get(key);
  if (hit) return hit;
  const ctx = a.ctx!;
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.ceil(seconds * sr), sr);
  const d = buf.getChannelData(0);
  fill(d, sr);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]!));
  if (peak > 0) for (let i = 0; i < d.length; i++) d[i]! /= peak;
  cache.set(key, buf);
  return buf;
}

function ks(a: AudioEngine, midi: number, bright: number, seconds: number, tag: string): AudioBuffer {
  return render(a, `${tag}${midi}`, seconds, (d, sr) => {
    const f = midiHz(midi);
    const N = Math.max(2, Math.round(sr / f));
    const ring = new Float32Array(N);
    let seed = midi * 9301 + 49297;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) * 2 - 1;
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const v = rnd();
      prev = prev + (v - prev) * (0.25 + bright * 0.7);
      ring[i] = prev;
    }
    const damp = 0.4985 + bright * 0.0012 - Math.max(0, midi - 72) * 0.00008;
    let idx = 0;
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const cur = ring[idx]!;
      const nxt = ring[(idx + 1) % N]!;
      const y = (cur + nxt) * damp;
      ring[idx] = y;
      last = last * 0.15 + cur * 0.85;
      d[i] = last;
      idx = (idx + 1) % N;
    }
  });
}

function additive(a: AudioEngine, key: string, midi: number, seconds: number, partials: readonly (readonly [number, number, number])[], hammer = 0): AudioBuffer {
  return render(a, key + midi, seconds, (d, sr) => {
    const f = midiHz(midi);
    const B = 0.0004;
    for (const [k, amp, decay] of partials) {
      const fk = f * k * Math.sqrt(1 + B * k * k);
      if (fk > sr / 2.2) continue;
      const w = (2 * Math.PI * fk) / sr;
      const dk = decay * (1 + (midi - 60) * 0.02);
      const ph = k * 1.7;
      const c2 = 2 * Math.cos(w);
      let y1 = Math.sin(ph), y0 = Math.sin(ph - w);
      let env = amp;
      const kd = Math.exp(-1 / (dk * sr));
      const atk = Math.floor(sr / 900);
      for (let i = 0; i < d.length; i++) {
        const y = c2 * y1 - y0;
        y0 = y1;
        y1 = y;
        d[i]! += y0 * env * (i < atk ? i / atk : 1);
        env *= kd;
        if (env < 1e-5) break;
      }
    }
    if (hammer > 0) {
      let seed = midi;
      for (let i = 0; i < sr * 0.03; i++) {
        seed = (seed * 16807) % 2147483647;
        d[i]! += hammer * ((seed / 2147483647) * 2 - 1) * Math.exp(-i / (sr * 0.004));
      }
    }
  });
}

const PIANO: readonly (readonly [number, number, number])[] = [
  [1, 1, 2.4], [2, 0.55, 1.6], [3, 0.32, 1.1], [4, 0.2, 0.8], [5, 0.14, 0.6], [6, 0.08, 0.45], [7, 0.05, 0.35], [8, 0.03, 0.3],
];
const CELESTA: readonly (readonly [number, number, number])[] = [
  [1, 1, 1.4], [4, 0.28, 0.25], [10, 0.06, 0.08],
];
const BELL: readonly (readonly [number, number, number])[] = [
  [0.5, 0.5, 3.5], [1, 1, 2.6], [1.19, 0.6, 2.0], [1.56, 0.4, 1.6], [2, 0.5, 1.4], [2.51, 0.3, 1.0], [2.66, 0.22, 0.9], [3.01, 0.18, 0.8], [4.1, 0.1, 0.5],
];
const CHURCH: readonly (readonly [number, number, number])[] = [
  [0.5, 0.9, 6], [1, 1, 4.5], [1.2, 0.8, 3.6], [1.5, 0.5, 3], [2, 0.6, 2.4], [2.6, 0.35, 1.8], [3.2, 0.25, 1.4], [4.2, 0.12, 0.9], [5.4, 0.06, 0.6],
];

function sampleBuffer(a: AudioEngine, id: InstrumentId, midi: number): AudioBuffer | null {
  const m = Math.round(midi);
  switch (id) {
    case 'gusli':
      return ks(a, m, 0.38, 3.2, 'g');
    case 'harp':
      return ks(a, m, 0.3, 3.6, 'h');
    case 'piano':
      return additive(a, 'p', m, 4.5, PIANO, 0.08);
    case 'celesta':
      return additive(a, 'c', m, 2.2, CELESTA, 0.02);
    case 'bell':
      return additive(a, 'b', m, 4, BELL);
    case 'church':
      return additive(a, 'ch', m, 8, CHURCH, 0.05);
    default:
      return null;
  }
}


function chain(a: AudioEngine, out: AudioNode, h: Hit): GainNode {
  const ctx = a.ctx!;
  const g = ctx.createGain();
  let node: AudioNode = g;
  if (h.pan) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, h.pan));
    node.connect(p);
    node = p;
  }
  node.connect(out);
  if (h.rev && a.reverbIn) {
    const s = ctx.createGain();
    s.gain.value = h.rev;
    node.connect(s).connect(a.reverbIn);
  }
  return g;
}

function osc(ctx: AudioContext, type: OscillatorType, f: number, when: number, end: number, detune = 0): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = detune;
  o.start(when);
  o.stop(end);
  return o;
}

function noiseSrc(a: AudioEngine, when: number, end: number): AudioBufferSourceNode {
  const s = a.ctx!.createBufferSource();
  s.buffer = a.noise;
  s.loop = true;
  s.start(when, Math.random() * 1.5);
  s.stop(end);
  return s;
}

function adsr(p: AudioParam, when: number, dur: number, peak: number, atk: number, dec: number, sus: number, rel: number): number {
  const end = when + dur + rel;
  p.setValueAtTime(0.0001, when);
  p.linearRampToValueAtTime(peak, when + atk);
  p.setTargetAtTime(peak * sus, when + atk, dec / 3);
  p.setValueAtTime(peak * sus, Math.max(when + atk, when + dur));
  p.setTargetAtTime(0.0001, Math.max(when + atk, when + dur), rel / 4);
  return end;
}

function vibrato(ctx: AudioContext, targets: AudioParam[], when: number, end: number, rate: number, cents: number, delay = 0.25): void {
  const l = osc(ctx, 'sine', rate, when, end);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(cents, when + delay + 0.01);
  l.connect(g);
  targets.forEach((t) => g.connect(t));
}

export function playNote(a: AudioEngine, out: AudioNode, id: InstrumentId, h: Hit): void {
  const ctx = a.ctx!;
  const { when, midi, vel } = h;
  const dur = Math.max(0.04, h.dur);
  const f = midiHz(midi);
  const buf = sampleBuffer(a, id, midi);
  if (buf) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = midiHz(midi) / midiHz(Math.round(midi));
    const g = chain(a, out, h);
    const ring = id === 'church' ? 8 : id === 'bell' ? 4 : Math.min(buf.duration, dur + (id === 'piano' ? 1.2 : 1.6));
    g.gain.setValueAtTime(vel, when);
    g.gain.setValueAtTime(vel, when + Math.max(0.01, ring - 0.4));
    g.gain.linearRampToValueAtTime(0.0001, when + ring);
    if (id === 'piano') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800 + vel * 5000;
      src.connect(lp).connect(g);
    } else src.connect(g);
    src.start(when);
    src.stop(when + ring + 0.05);
    return;
  }
  switch (id) {
    case 'pad': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.22, Math.min(1.5, dur * 0.35), 1, 0.8, 1.6);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 0.8;
      lp.frequency.setValueAtTime(500, when);
      lp.frequency.linearRampToValueAtTime(1600, when + dur * 0.6);
      lp.frequency.linearRampToValueAtTime(700, end);
      for (const d of [-12, -5, 0, 6, 11]) osc(ctx, 'sawtooth', f, when, end + 0.1, d).connect(lp);
      osc(ctx, 'triangle', f / 2, when, end + 0.1).connect(lp);
      lp.connect(g);
      return;
    }
    case 'strings': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.2, Math.min(0.6, dur * 0.3), 0.6, 0.85, 0.9);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 180;
      const os = [-8, -3, 3, 8].map((d) => osc(ctx, 'sawtooth', f, when, end + 0.1, d));
      vibrato(ctx, os.map((o) => o.detune), when, end, 5.2, 9, 0.35);
      os.forEach((o) => o.connect(lp));
      lp.connect(hp).connect(g);
      return;
    }
    case 'choir': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.5, Math.min(1.2, dur * 0.35), 1, 0.85, 1.4);
      const mix = ctx.createGain();
      const os = [-10, 0, 10].map((d) => osc(ctx, 'sawtooth', f, when, end + 0.1, d));
      vibrato(ctx, os.map((o) => o.detune), when, end, 4.6, 11, 0.4);
      os.forEach((o) => o.connect(mix));
      const vow = midi > 64 ? [[800, 1], [1150, 0.5], [2900, 0.25]] : [[500, 1], [900, 0.5], [2600, 0.18]];
      for (const [ff, amp] of vow) {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = ff!;
        bp.Q.value = 6;
        const ag = ctx.createGain();
        ag.gain.value = amp!;
        mix.connect(bp).connect(ag).connect(g);
      }
      return;
    }
    case 'flute':
    case 'reed': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * (id === 'reed' ? 0.16 : 0.3), 0.06, 0.2, 0.8, 0.18);
      const o = osc(ctx, id === 'reed' ? 'square' : 'triangle', f, when, end + 0.05);
      vibrato(ctx, [o.detune], when, end, 5.6, 14, 0.18);
      o.frequency.setValueAtTime(f * 0.97, when);
      o.frequency.exponentialRampToValueAtTime(f, when + 0.07);
      const bp = ctx.createBiquadFilter();
      bp.type = id === 'reed' ? 'bandpass' : 'lowpass';
      bp.frequency.value = id === 'reed' ? f * 3 : f * 4;
      bp.Q.value = id === 'reed' ? 1.2 : 0.7;
      o.connect(bp).connect(g);
      const n = noiseSrc(a, when, end);
      const nb = ctx.createBiquadFilter();
      nb.type = 'bandpass';
      nb.frequency.value = f * 2;
      nb.Q.value = 2;
      const ng = ctx.createGain();
      ng.gain.value = 0.12;
      n.connect(nb).connect(ng).connect(g);
      return;
    }
    case 'theremin': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.32, 0.12, 0.3, 0.9, 0.35);
      const o = osc(ctx, 'sine', f, when, end + 0.05);
      o.frequency.setValueAtTime(f * 0.94, when);
      o.frequency.exponentialRampToValueAtTime(f, when + 0.16);
      vibrato(ctx, [o.detune], when, end, 6.2, 22, 0.1);
      const o2 = osc(ctx, 'triangle', f * 2, when, end + 0.05);
      const g2 = ctx.createGain();
      g2.gain.value = 0.12;
      o2.connect(g2).connect(g);
      o.connect(g);
      return;
    }
    case 'brass': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.18, 0.08, 0.3, 0.75, 0.3);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(400, when);
      lp.frequency.exponentialRampToValueAtTime(2600, when + 0.12);
      lp.frequency.exponentialRampToValueAtTime(1200, when + 0.6);
      for (const d of [-5, 5]) osc(ctx, 'sawtooth', f, when, end + 0.05, d).connect(lp);
      lp.connect(g);
      return;
    }
    case 'bass': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.55, 0.008, 0.25, 0.6, 0.12);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 3;
      lp.frequency.setValueAtTime(900, when);
      lp.frequency.exponentialRampToValueAtTime(260, when + 0.25);
      osc(ctx, 'sawtooth', f, when, end + 0.05).connect(lp);
      osc(ctx, 'sine', f, when, end + 0.05).connect(g);
      lp.connect(g);
      return;
    }
    case 'subbass': {
      const g = chain(a, out, h);
      const end = adsr(g.gain, when, dur, vel * 0.5, Math.min(1, dur * 0.3), 1, 0.9, 1.2);
      osc(ctx, 'sine', f, when, end + 0.05).connect(g);
      return;
    }
    case 'kick': {
      const g = chain(a, out, h);
      const o = osc(ctx, 'sine', 140, when, when + 0.4);
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(44, when + 0.14);
      g.gain.setValueAtTime(vel, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
      o.connect(g);
      const n = noiseSrc(a, when, when + 0.02);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(vel * 0.3, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.015);
      n.connect(ng).connect(g);
      return;
    }
    case 'drum': {
      const g = chain(a, out, h);
      const o = osc(ctx, 'sine', 110, when, when + 0.5);
      o.frequency.setValueAtTime(120, when);
      o.frequency.exponentialRampToValueAtTime(70, when + 0.2);
      g.gain.setValueAtTime(vel * 0.8, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.45);
      o.connect(g);
      const n = noiseSrc(a, when, when + 0.08);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(vel * 0.4, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
      n.connect(lp).connect(ng).connect(g);
      return;
    }
    case 'snare': {
      const g = chain(a, out, h);
      const n = noiseSrc(a, when, when + 0.25);
      const bp = ctx.createBiquadFilter();
      bp.type = 'highpass';
      bp.frequency.value = 1200;
      g.gain.setValueAtTime(vel * 0.6, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
      n.connect(bp).connect(g);
      const o = osc(ctx, 'triangle', 190, when, when + 0.1);
      const og = ctx.createGain();
      og.gain.setValueAtTime(vel * 0.5, when);
      og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
      o.connect(og).connect(g);
      return;
    }
    case 'hat':
    case 'shaker': {
      const g = chain(a, out, h);
      const n = noiseSrc(a, when, when + 0.15);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = id === 'hat' ? 8000 : 5000;
      const len = id === 'hat' ? 0.045 : 0.09;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(vel * 0.4, when + (id === 'shaker' ? 0.02 : 0.002));
      g.gain.exponentialRampToValueAtTime(0.0001, when + len);
      n.connect(hp).connect(g);
      return;
    }
    case 'buben': {
      const g = chain(a, out, h);
      const n = noiseSrc(a, when, when + 0.3);
      g.gain.setValueAtTime(vel * 0.5, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      for (const ff of [6100, 7900, 9800]) {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = ff;
        bp.Q.value = 9;
        n.connect(bp).connect(g);
      }
      return;
    }
    default:
      return;
  }
}

export function warm(a: AudioEngine, id: InstrumentId, midis: readonly number[]): void {
  for (const m of midis) sampleBuffer(a, id, m);
}
