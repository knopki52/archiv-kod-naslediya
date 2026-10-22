import type { AudioEngine } from './AudioEngine';
import { playNote, warm } from './Instruments';
import { generateBar, midiToHz, TRACKS, type NoteEvent, type Track } from './tracks';

interface Playing {
  track: Track;
  gain: GainNode;
  nextBarTime: number;
  bar: number;
  fadingOut: boolean;
}

export class MusicEngine {
  private current: Playing | null = null;
  private old: Playing[] = [];
  private timer = 0;
  intensity = 0;

  constructor(private a: AudioEngine) {}

  get currentId(): string | null {
    return this.current?.track.id ?? null;
  }

  play(id: string, fade = 1.5): void {
    this.a.whenReady(() => this.start(id, fade));
  }

  stop(fade = 1): void {
    if (!this.a.ctx) return;
    this.fadeOut(this.current, fade);
    this.current = null;
  }

  setIntensity(x: number): void {
    this.intensity = Math.max(0, Math.min(1, x));
  }

  private start(id: string, fade: number): void {
    const ctx = this.a.ctx!;
    const track = TRACKS[id];
    if (!track || this.current?.track.id === id) return;
    this.fadeOut(this.current, fade);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(track.level, ctx.currentTime + Math.max(0.05, fade));
    gain.connect(this.a.buses.music);
    this.current = { track, gain, nextBarTime: ctx.currentTime + 0.25, bar: 0, fadingOut: false };
    this.warmUp(track);
    if (!this.timer) this.timer = window.setInterval(() => this.tick(), 100);
  }

  private fadeOut(p: Playing | null, fade: number): void {
    if (!p || !this.a.ctx) return;
    const t = this.a.ctx.currentTime;
    p.fadingOut = true;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(Math.max(0.0001, p.gain.gain.value), t);
    p.gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, fade));
    this.old.push(p);
    window.setTimeout(() => {
      p.gain.disconnect();
      this.old = this.old.filter((o) => o !== p);
    }, (fade + 0.5) * 1000);
  }

  private tick(): void {
    const ctx = this.a.ctx;
    if (!ctx) return;
    const p = this.current;
    if (!p) {
      if (this.old.length === 0) {
        window.clearInterval(this.timer);
        this.timer = 0;
      }
      return;
    }
    while (p.nextBarTime < ctx.currentTime + 0.7) {
      const beat = 60 / p.track.bpm;
      for (const ev of generateBar(p.track, p.bar, this.intensity)) this.note(p, ev, p.nextBarTime + ev.beat * beat, beat);
      p.nextBarTime += p.track.beatsPerBar * beat;
      p.bar++;
    }
  }

  scheduleAll(id: string, seconds: number, intensity = 0): void {
    const ctx = this.a.ctx!;
    const track = TRACKS[id];
    if (!track) return;
    this.intensity = intensity;
    const gain = ctx.createGain();
    gain.gain.value = track.level;
    gain.connect(this.a.buses.music);
    const p: Playing = { track, gain, nextBarTime: 0.05, bar: 0, fadingOut: false };
    const beat = 60 / track.bpm;
    while (p.nextBarTime < seconds) {
      for (const ev of generateBar(track, p.bar, intensity)) this.note(p, ev, p.nextBarTime + ev.beat * beat, beat);
      p.nextBarTime += track.beatsPerBar * beat;
      p.bar++;
    }
  }

  private warmUp(track: Track): void {
    const jobs: (() => void)[] = [];
    for (const w of track.warm ?? []) for (let m = w.from; m <= w.to; m++) jobs.push(() => warm(this.a, w.inst, [m]));
    const step = () => {
      const t0 = performance.now();
      while (jobs.length && performance.now() - t0 < 6) jobs.shift()!();
      if (jobs.length) window.setTimeout(step, 30);
    };
    window.setTimeout(step, 30);
  }

  private note(p: Playing, ev: NoteEvent, when: number, beatSec: number): void {
    const ctx = this.a.ctx!;
    const dur = Math.max(0.05, ev.dur * beatSec);
    if (ev.voice === 'lead') {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(ev.vel * 0.4, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.05);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = 6;
      f.frequency.setValueAtTime(900 + this.intensity * 3200, when);
      f.frequency.exponentialRampToValueAtTime(500, when + dur);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiToHz(ev.midi);
      o.start(when);
      o.stop(when + dur + 0.1);
      let node: AudioNode = g;
      if (ev.pan) {
        const pn = ctx.createStereoPanner();
        pn.pan.value = ev.pan;
        g.connect(pn);
        node = pn;
      }
      o.connect(f).connect(g);
      node.connect(p.gain);
      if (ev.rev && this.a.reverbIn) {
        const s = ctx.createGain();
        s.gain.value = ev.rev;
        node.connect(s).connect(this.a.reverbIn);
      }
      return;
    }
    playNote(this.a, p.gain, ev.voice, { when, midi: ev.midi, dur, vel: ev.vel, pan: ev.pan, rev: ev.rev });
  }
}
