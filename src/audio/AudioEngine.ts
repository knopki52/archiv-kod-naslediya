import type { EventBus } from '../core/EventBus';
import type { Settings } from '../core/Settings';
import { Ambience } from './Ambience';
import { Metronome } from './Metronome';
import { MusicEngine } from './Music';
import { Sfx } from './Sfx';
import { Voice } from './Voice';

export interface Buses {
  music: GainNode;
  sfx: GainNode;
  amb: GainNode;
  ui: GainNode;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  buses!: Buses;
  analyser!: AnalyserNode;
  noise!: AudioBuffer;
  reverbIn: GainNode | null = null;
  readonly sfx = new Sfx(this);
  readonly music = new MusicEngine(this);
  readonly ambience = new Ambience(this);
  readonly metronome = new Metronome(this);
  readonly voice: Voice;
  private ducked = false;
  private pending: (() => void)[] = [];

  constructor(
    private settings: Settings,
    bus: EventBus,
  ) {
    this.voice = new Voice(this, () => this.settings.data.voices ?? 'babble', () => this.settings.data.sfx);
    bus.on('audio:unlock', () => this.unlock());
    settings.onChange(() => this.applyVolumes());
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state !== 'closed';
  }

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.buildGraph(this.ctx);
    this.applyVolumes();
    void this.ctx.resume();
    this.pending.splice(0).forEach((fn) => fn());
  }

  static async renderOffline(settings: Settings, bus: EventBus, seconds: number, fill: (e: AudioEngine) => void): Promise<AudioBuffer> {
    const off = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
    const e = new AudioEngine(settings, bus);
    e.ctx = off as unknown as AudioContext;
    e.buildGraph(e.ctx);
    e.applyVolumes();
    fill(e);
    return off.startRendering();
  }

  private buildGraph(ctx: AudioContext): void {
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.master.connect(comp);
    comp.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    const mk = () => {
      const g = ctx.createGain();
      g.connect(this.master);
      return g;
    };
    this.buses = { music: mk(), sfx: mk(), amb: mk(), ui: mk() };
    try {
      const conv = ctx.createConvolver();
      conv.buffer = makeImpulse(ctx, 3.4, 2.6);
      const pre = ctx.createGain();
      pre.gain.value = 1;
      const lowcut = ctx.createBiquadFilter();
      lowcut.type = 'highpass';
      lowcut.frequency.value = 160;
      const ret = ctx.createGain();
      ret.gain.value = 0.55;
      pre.connect(lowcut).connect(conv).connect(ret).connect(this.master);
      this.reverbIn = pre;
      for (const b of [this.buses.sfx, this.buses.amb]) {
        const send = ctx.createGain();
        send.gain.value = 0.12;
        b.connect(send).connect(pre);
      }
    } catch {
      this.reverbIn = null;
    }
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  whenReady(fn: () => void): void {
    if (this.ready) fn();
    else this.pending.push(fn);
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    const s = this.settings.data;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(0.9, t, 0.05);
    this.buses.music.gain.setTargetAtTime(s.music * (this.ducked ? 0.5 : 1), t, 0.12);
    this.buses.amb.gain.setTargetAtTime(s.music * 0.8 * (this.ducked ? 0.6 : 1), t, 0.12);
    this.buses.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
    this.buses.ui.gain.setTargetAtTime(s.sfx, t, 0.05);
  }

  duck(on: boolean): void {
    this.ducked = on;
    this.applyVolumes();
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  level(): { peak: number; rms: number } {
    if (!this.ctx) return { peak: 0, rms: 0 };
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let peak = 0;
    let sum = 0;
    for (const v of buf) {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    return { peak, rms: Math.sqrt(sum / buf.length) };
  }

  stopAll(): void {
    this.music.stop();
    this.ambience.set(null);
    this.metronome.stop();
  }
}

function makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const n = Math.random() * 2 - 1;
      const k = 0.85 - t * 0.7;
      lp = lp + (n - lp) * Math.max(0.08, k);
      d[i] = lp * Math.pow(1 - t, decay) * (i < sr * 0.012 ? 0 : 1);
    }
    for (const [ms, g] of [[13, 0.5], [21, 0.35], [34, 0.3], [47, 0.22], [63, 0.18]] as const) {
      const i = Math.floor((ms + ch * 3) * sr / 1000);
      if (i < len) d[i]! += g * (ch ? -1 : 1);
    }
  }
  return buf;
}
