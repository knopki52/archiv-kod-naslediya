import type { AudioEngine } from './AudioEngine';


export type VoiceMode = 'speech' | 'babble' | 'off';

interface Profile {
  sex: 'f' | 'm';
  pitch: number;
  rate: number;
  f0: number;
  tract: number;
  robot?: boolean;
  breathy?: boolean;
}

const P = (sex: 'f' | 'm', pitch: number, rate: number, f0: number, tract: number, extra: Partial<Profile> = {}): Profile => ({ sex, pitch, rate, f0, tract, ...extra });

const PROFILES: Record<string, Profile> = {
  byte: P('f', 1.55, 1.12, 420, 1.35, { robot: true }),
  player: P('f', 1.0, 1.0, 210, 1.1),
  mnema: P('f', 1.0, 1.0, 210, 1.1),
  dubler: P('m', 0.72, 0.92, 105, 0.92),
  guest: P('m', 0.78, 0.92, 110, 0.92),
  inspector: P('m', 0.85, 1.06, 120, 0.95),
  correspondent: P('m', 0.95, 1.08, 130, 0.97),
  onfim: P('f', 1.5, 1.1, 300, 1.35),
  nastasya: P('f', 1.0, 0.98, 200, 1.08),
  ignat: P('m', 0.72, 0.88, 100, 0.9),
  zina: P('f', 1.45, 1.02, 290, 1.32),
  maria: P('f', 0.82, 0.88, 175, 1.0, { breathy: true }),
  prohorov: P('m', 0.78, 0.94, 105, 0.92),
  timofey: P('m', 0.9, 1.04, 125, 0.96),
  galya: P('f', 1.15, 1.08, 230, 1.14),
  ivan: P('m', 0.7, 0.9, 98, 0.9),
  lete: P('f', 1.1, 0.9, 220, 1.1, { breathy: true }),
  botanist: P('m', 0.88, 0.92, 115, 0.94),
  antonina: P('f', 0.95, 0.96, 195, 1.05),
  voice1: P('m', 0.8, 0.88, 110, 0.92, { breathy: true }),
  voice2: P('f', 1.12, 0.88, 225, 1.12, { breathy: true }),
};

const VOWELS: Record<string, [number, number, number]> = {
  а: [800, 1250, 2600], я: [750, 1600, 2600],
  о: [520, 900, 2500], ё: [500, 1300, 2500],
  у: [340, 700, 2400], ю: [320, 1500, 2400],
  э: [580, 1750, 2600], е: [500, 1950, 2700],
  и: [290, 2250, 3000], ы: [330, 1550, 2500],
};
const VOICED = 'бвгджзлмнрй';

const FEMALE_HINTS = /irina|svetlana|dariya|daria|milena|katya|ekaterina|elena|alyona|anna|tatyana|female|женск|google русский/i;
const MALE_HINTS = /pavel|dmitr|yuri|maxim|aleksandr|alexander|nikolai|male(?!.*female)|мужск/i;

export class Voice {
  private voices: SpeechSynthesisVoice[] = [];
  private speaking = false;
  private lastBabble = 0;
  private lineText = '';
  private lineIdx = 0;

  constructor(private a: AudioEngine, private getMode: () => VoiceMode, private getVolume: () => number) {
    const synth = this.synth;
    if (!synth) return;
    const load = () => {
      this.voices = synth.getVoices().filter((v) => /^ru/i.test(v.lang));
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
  }

  private get synth(): SpeechSynthesis | null {
    return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  }

  get hasSpeech(): boolean {
    return this.voices.length > 0;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }

  private pickVoice(sex: 'f' | 'm'): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null;
    const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
    const score = (v: SpeechSynthesisVoice) => {
      let s = 0;
      const n = v.name;
      if (sex === 'f' ? FEMALE_HINTS.test(n) : MALE_HINTS.test(n)) s += 10;
      if (sex === 'f' ? MALE_HINTS.test(n) : FEMALE_HINTS.test(n)) s -= 10;
      if (/natural|neural/i.test(n)) s += online ? 6 : -20;
      if (!v.localService) s += online ? 2 : -20;
      return s;
    };
    return [...this.voices].sort((x, y) => score(y) - score(x))[0] ?? null;
  }

  line(who: string, text: string, mood: string): boolean {
    this.stop();
    this.lineText = text;
    this.lineIdx = 0;
    if (this.getMode() !== 'speech') return false;
    const prof = PROFILES[who];
    const synth = this.synth;
    if (!prof || !synth || !this.voices.length) return false;
    const clean = text
      .replace(/[«»"„“]/g, '')
      .replace(/\s+—\s+/g, ', ')
      .replace(/\.\.\./g, '…')
      .trim();
    if (!clean || !/[а-яё]/i.test(clean)) return false;
    try {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'ru-RU';
      const v = this.pickVoice(prof.sex);
      if (v) u.voice = v;
      const sexOk = !v || (prof.sex === 'f' ? !MALE_HINTS.test(v.name) : !FEMALE_HINTS.test(v.name));
      let pitch = prof.pitch;
      if (!sexOk) pitch = prof.sex === 'm' ? Math.min(pitch, 0.55) : Math.max(pitch, 1.35);
      u.pitch = Math.max(0, Math.min(2, pitch));
      u.rate = Math.max(0.5, Math.min(2, prof.rate * (mood === 'whisper' || mood === 'quiet' ? 0.9 : 1)));
      u.volume = Math.max(0, Math.min(1, this.getVolume() * (mood === 'whisper' ? 0.55 : 1)));
      u.onend = u.onerror = () => {
        this.speaking = false;
      };
      this.speaking = true;
      synth.speak(u);
      return true;
    } catch {
      this.speaking = false;
      return false;
    }
  }

  stop(): void {
    if (this.speaking) this.synth?.cancel();
    this.speaking = false;
  }

  babble(who: string, ch: string): void {
    if (this.getMode() === 'off' || this.speaking) return;
    const a = this.a;
    if (!a.ready) return;
    const prof = PROFILES[who];
    if (!prof) return;
    const ctx = a.ctx!;
    const now = ctx.currentTime;
    this.lineIdx += 2;
    if (now - this.lastBabble < 0.07) return;
    this.lastBabble = now;
    const c = ch.toLowerCase();
    const vow = VOWELS[c];
    const out = a.buses.ui;
    const vol = 0.075;
    if (!vow) {
      if (VOICED.includes(c)) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = prof.f0 * (0.95 + Math.random() * 0.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol * 0.35, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 600 * prof.tract;
        o.connect(lp).connect(g).connect(out);
        o.start(now);
        o.stop(now + 0.06);
      } else if (/[а-яё]/.test(c)) {
        const s = ctx.createBufferSource();
        s.buffer = a.noise;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = (/[шщжчц]/.test(c) ? 2800 : /[сз]/.test(c) ? 5500 : 1800) * prof.tract;
        f.Q.value = 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.18, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        s.connect(f).connect(g).connect(out);
        s.start(now, Math.random());
        s.stop(now + 0.05);
      }
      return;
    }
    const dur = 0.11;
    const len = Math.max(1, this.lineText.length);
    const t = Math.min(1, this.lineIdx / len);
    const q = /\?\s*$/.test(this.lineText);
    const contour = 1 + 0.07 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + (t > 0.82 ? (q ? 0.14 : -0.1) * ((t - 0.82) / 0.18) : 0);
    const f0 = prof.f0 * contour * (0.97 + Math.random() * 0.06);
    const src = ctx.createOscillator();
    src.type = prof.robot ? 'square' : 'sawtooth';
    src.frequency.setValueAtTime(f0 * 1.02, now);
    src.frequency.linearRampToValueAtTime(f0 * 0.98, now + dur);
    const soft = ctx.createOscillator();
    soft.type = 'triangle';
    soft.frequency.setValueAtTime(f0 * 1.02, now);
    soft.frequency.linearRampToValueAtTime(f0 * 0.98, now + dur);
    const tame = ctx.createBiquadFilter();
    tame.type = 'lowpass';
    tame.frequency.value = 3200 * prof.tract;
    const sum = ctx.createGain();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.02);
    g.gain.setTargetAtTime(0.0001, now + dur * 0.55, dur * 0.18);
    vow.forEach((F, i) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = F * prof.tract;
      bp.Q.value = [7, 9, 11][i]!;
      const ag = ctx.createGain();
      ag.gain.value = [1, 0.6, 0.25][i]!;
      src.connect(bp).connect(ag).connect(sum);
    });
    const sg = ctx.createGain();
    sg.gain.value = 0.35;
    soft.connect(sg).connect(sum);
    if (prof.breathy) {
      const n = ctx.createBufferSource();
      n.buffer = a.noise;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = vow[1] * prof.tract;
      nf.Q.value = 3;
      const ng = ctx.createGain();
      ng.gain.value = 0.25;
      n.connect(nf).connect(ng).connect(sum);
      n.start(now, Math.random());
      n.stop(now + dur + 0.02);
    }
    if (prof.robot) {
      const rm = ctx.createGain();
      const mod = ctx.createOscillator();
      mod.frequency.value = 55;
      const mg = ctx.createGain();
      mg.gain.value = 0.5;
      mod.connect(mg).connect(rm.gain);
      sum.connect(rm).connect(g);
      mod.start(now);
      mod.stop(now + dur + 0.02);
    } else sum.connect(g);
    g.connect(tame).connect(out);
    src.start(now);
    src.stop(now + dur + 0.08);
    soft.start(now);
    soft.stop(now + dur + 0.08);
  }
}
