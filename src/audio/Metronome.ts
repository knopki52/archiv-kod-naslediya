import type { AudioEngine } from './AudioEngine';

export class Metronome {
  private timer = 0;
  private next = 0;
  private beat = 0;
  private skip = 0;
  private bpm = 60;
  private vol = 0.5;

  constructor(private a: AudioEngine) {}

  get running(): boolean {
    return this.timer !== 0;
  }

  start(bpm = 60, vol = 0.5): void {
    this.a.whenReady(() => {
      this.stop();
      this.bpm = bpm;
      this.vol = vol;
      this.beat = 0;
      this.skip = 0;
      this.next = this.a.ctx!.currentTime + 0.1;
      this.timer = window.setInterval(() => this.tick(), 50);
    });
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
  }

  freeze(n = 1): void {
    this.skip = n;
    this.vol *= 0.7;
  }

  setVolume(v: number): void {
    this.vol = v;
  }

  private tick(): void {
    const ctx = this.a.ctx;
    if (!ctx) return;
    const period = 60 / this.bpm;
    while (this.next < ctx.currentTime + 0.2) {
      if (this.skip > 0) this.skip--;
      else this.click(this.next, this.beat % 2 === 0);
      this.next += period;
      this.beat++;
    }
  }

  private click(when: number, tick: boolean): void {
    const ctx = this.a.ctx!;
    const pan = ctx.createStereoPanner();
    pan.pan.value = tick ? -0.35 : 0.35;
    const out = ctx.createGain();
    out.gain.value = this.vol;
    pan.connect(out).connect(this.a.buses.amb);
    const src = ctx.createBufferSource();
    src.buffer = this.a.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = tick ? 2400 : 1500;
    f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    src.connect(f).connect(g).connect(pan);
    src.start(when, Math.random());
    src.stop(when + 0.05);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(tick ? 1250 : 820, when);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.35, when);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    o.connect(og).connect(pan);
    o.start(when);
    o.stop(when + 0.1);
  }
}
