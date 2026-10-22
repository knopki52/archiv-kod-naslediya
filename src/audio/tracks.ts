import { hashString, mulberry32, type Rng } from '../gfx/Noise';
import type { InstrumentId } from './Instruments';

export type VoiceKind = InstrumentId | 'lead';

export interface NoteEvent {
  beat: number;
  midi: number;
  dur: number;
  voice: VoiceKind;
  vel: number;
  pan?: number;
  rev?: number;
}

export interface Track {
  id: string;
  bpm: number;
  beatsPerBar: number;
  root: number;
  scale: number[];
  progression: number[];
  bars: number;
  level: number;
  warm?: { inst: InstrumentId; from: number; to: number }[];
  gen: (ctx: GenCtx) => NoteEvent[];
}

export interface GenCtx {
  track: Track;
  bar: number;
  rng: Rng;
  intensity: number;
}

export function degreeToMidi(track: Track, degree: number, octave = 0): number {
  const n = track.scale.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return track.root + track.scale[idx]! + (oct + octave) * 12;
}

export function midiToHz(m: number): number {
  return 440 * 2 ** ((m - 69) / 12);
}

const pickFrom = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)]!;

function chordDeg(track: Track, bar: number): number {
  return track.progression[bar % track.progression.length]!;
}
function chord(track: Track, bar: number, octave = 0, spread = [0, 2, 4]): number[] {
  const root = chordDeg(track, bar);
  return spread.map((s) => degreeToMidi(track, root + s, octave));
}

type Phrase = readonly (readonly [number, number | null, number])[];
function phrase(track: Track, p: Phrase, voice: VoiceKind, octave: number, vel: number, extra: Partial<NoteEvent> = {}): NoteEvent[] {
  return p.filter(([, d]) => d !== null).map(([beat, d, dur]) => ({ beat, midi: degreeToMidi(track, d!, octave), dur, voice, vel, ...extra }));
}

const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];


const ARCHIVE_MOTIF: Phrase[] = [
  [[0, 0, 1.5], [1.5, 4, 0.5], [2, 2, 1], [3, 1, 1]],
  [[0, 0, 3], [3, null, 1]],
  [[0, 2, 1.5], [1.5, 4, 0.5], [2, 6, 1], [3, 5, 1]],
  [[0, 4, 3.5]],
];

const NOV_TUNE: Phrase[] = [
  [[0, 4, 1], [1, 4, 0.5], [1.5, 5, 0.5], [2, 6, 1], [3, 5, 0.5], [3.5, 4, 0.5]],
  [[0, 3, 1], [1, 2, 1], [2, 3, 0.5], [2.5, 4, 0.5], [3, 2, 1]],
  [[0, 4, 1], [1, 6, 0.5], [1.5, 7, 0.5], [2, 8, 1], [3, 7, 0.5], [3.5, 6, 0.5]],
  [[0, 5, 1], [1, 4, 0.5], [1.5, 3, 0.5], [2, 4, 2]],
  [[0, 7, 1.5], [1.5, 6, 0.5], [2, 5, 1], [3, 4, 1]],
  [[0, 3, 0.5], [0.5, 4, 0.5], [1, 5, 1], [2, 4, 1], [3, 3, 1]],
  [[0, 2, 1], [1, 3, 0.5], [1.5, 2, 0.5], [2, 1, 1], [3, 2, 1]],
  [[0, 0, 3], [3, null, 1]],
];

const LEN_TUNE: Phrase[] = [
  [[0, 4, 2], [2, 3, 1], [3, 2, 1]],
  [[0, 1, 3], [3, 0, 1]],
  [[0, 2, 1], [1, 3, 1], [2, 4, 1.5], [3.5, 2, 0.5]],
  [[0, 1, 4]],
  [[0, 4, 2], [2, 5, 1], [3, 4, 1]],
  [[0, 6, 2], [2, 4, 2]],
  [[0, 3, 1], [1, 2, 1], [2, 1, 1], [3, -1, 1]],
  [[0, 0, 4]],
];

const BAIK_TUNE: Phrase[] = [
  [[0, 4, 3], [3, 6, 1]],
  [[0, 7, 2], [2, 6, 1], [3, 4, 1]],
  [[0, 5, 3], [3, 4, 1]],
  [[0, 2, 4]],
  [[0, 4, 2], [2, 7, 2]],
  [[0, 9, 3], [3, 8, 1]],
  [[0, 7, 2], [2, 6, 1], [3, 5, 1]],
  [[0, 4, 4]],
];

const CORE_TUNE: Phrase[] = [
  [[0, 7, 4]], [[0, 9, 2], [2, 8, 2]], [[0, 7, 4]], [[0, 6, 4]],
  [[0, 4, 2], [2, 6, 2]], [[0, 7, 4]], [[0, 9, 2], [2, 11, 2]], [[0, 9, 4]],
];

const MERGE_TUNE: Phrase[] = [
  [[0, 4, 1.5], [1.5, 2, 0.5], [2, 4, 1], [3, 7, 1]],
  [[0, 6, 3], [3, 4, 1]],
  [[0, 5, 1.5], [1.5, 4, 0.5], [2, 2, 1], [3, 4, 1]],
  [[0, 1, 4]],
  [[0, 4, 1.5], [1.5, 7, 0.5], [2, 9, 1], [3, 8, 1]],
  [[0, 7, 3], [3, 6, 1]],
  [[0, 5, 1], [1, 4, 1], [2, 2, 1], [3, 1, 1]],
  [[0, 0, 4]],
];

export const TRACKS: Record<string, Track> = {
  archive: {
    id: 'archive', bpm: 64, beatsPerBar: 4, root: 50, scale: MINOR, progression: [0, 5, 2, 6, 0, 5, 3, 4], bars: 16, level: 0.62,
    warm: [{ inst: 'celesta', from: 62, to: 86 }, { inst: 'bell', from: 62, to: 81 }, { inst: 'harp', from: 50, to: 74 }],
    gen: ({ track, bar, rng }) => {
      const c = chordDeg(track, bar);
      const ev: NoteEvent[] = chord(track, bar, 0, [0, 2, 4, 7]).map((midi, i) => ({ beat: 0, midi, dur: 4, voice: 'pad', vel: 0.5, pan: (i - 1.5) * 0.3, rev: 0.5 }));
      ev.push({ beat: 0, midi: degreeToMidi(track, c, -2), dur: 4, voice: 'subbass', vel: 0.55 });
      const arp = [0, 2, 4, 7, 4, 2, 4, 9];
      for (let i = 0; i < 8; i++) {
        if (rng() < 0.3) continue;
        ev.push({ beat: i / 2, midi: degreeToMidi(track, c + arp[i]!, 1), dur: 1, voice: 'celesta', vel: 0.16 + rng() * 0.1, pan: Math.sin(i) * 0.6, rev: 0.6 });
      }
      if (bar >= 8) ev.push(...phrase(track, ARCHIVE_MOTIF[(bar - 8) % 4]!, 'bell', 1, 0.28, { pan: 0.15, rev: 0.7 }));
      if (bar % 4 === 3) for (let i = 0; i < 6; i++) ev.push({ beat: 2 + i * 0.25, midi: degreeToMidi(track, c + i * 2, 0), dur: 2, voice: 'harp', vel: 0.3, pan: -0.4 + i * 0.15, rev: 0.6 });
      return ev;
    },
  },
  nov: {
    id: 'nov', bpm: 92, beatsPerBar: 4, root: 57, scale: DORIAN, progression: [0, 0, 6, 0, 3, 3, 4, 0], bars: 16, level: 0.58,
    warm: [{ inst: 'gusli', from: 45, to: 81 }, { inst: 'church', from: 38, to: 45 }],
    gen: ({ track, bar, rng }) => {
      const c = chordDeg(track, bar);
      const ev: NoteEvent[] = [];
      ev.push({ beat: 0, midi: degreeToMidi(track, 0, -1), dur: 4, voice: 'strings', vel: 0.32, pan: -0.2, rev: 0.25 });
      ev.push({ beat: 0, midi: degreeToMidi(track, 4, -1), dur: 4, voice: 'strings', vel: 0.22, pan: 0.2, rev: 0.25 });
      const pat = [0, 4, 7, 4, 2, 4, 7, 9];
      for (let i = 0; i < 8; i++) ev.push({ beat: i / 2, midi: degreeToMidi(track, c + pat[i]!, 0), dur: 1.5, voice: 'gusli', vel: (i % 2 ? 0.35 : 0.5) + rng() * 0.08, pan: -0.35, rev: 0.3 });
      if (bar >= 4) ev.push(...phrase(track, NOV_TUNE[(bar - 4) % 8]!, 'reed', 1, 0.5, { pan: 0.3, rev: 0.3 }));
      ev.push({ beat: 0, midi: 45, dur: 0.3, voice: 'drum', vel: 0.55, rev: 0.2 });
      ev.push({ beat: 2.5, midi: 45, dur: 0.3, voice: 'drum', vel: 0.35, rev: 0.2 });
      for (const b of [1, 3]) ev.push({ beat: b, midi: 80, dur: 0.2, voice: 'buben', vel: 0.32, pan: 0.45, rev: 0.25 });
      if (bar >= 8) for (let i = 0; i < 8; i++) ev.push({ beat: i / 2 + 0.25, midi: 80, dur: 0.1, voice: 'shaker', vel: 0.12, pan: 0.5 });
      if (bar % 8 === 0) ev.push({ beat: 0, midi: degreeToMidi(track, 0, -2), dur: 8, voice: 'church', vel: 0.35, pan: -0.6, rev: 0.8 });
      return ev;
    },
  },
  len: {
    id: 'len', bpm: 60, beatsPerBar: 4, root: 52, scale: MINOR, progression: [0, 0, 5, 4, 3, 5, 6, 0], bars: 16, level: 0.6,
    warm: [{ inst: 'piano', from: 40, to: 76 }],
    gen: ({ track, bar }) => {
      const c = chordDeg(track, bar);
      const ev: NoteEvent[] = [];
      ev.push({ beat: 0, midi: degreeToMidi(track, c, -1), dur: 4, voice: 'piano', vel: 0.4, pan: -0.25, rev: 0.55 });
      ev.push({ beat: 1, midi: degreeToMidi(track, c + 4, -1), dur: 1, voice: 'piano', vel: 0.22, pan: -0.15, rev: 0.55 });
      ev.push({ beat: 2, midi: degreeToMidi(track, c + 2, 0), dur: 2, voice: 'piano', vel: 0.2, pan: -0.05, rev: 0.55 });
      if (bar >= 4) ev.push(...phrase(track, LEN_TUNE[(bar - 4) % 8]!, 'piano', 1, 0.34, { pan: 0.2, rev: 0.6 }));
      if (bar >= 8) ev.push(...chord(track, bar, 0, [0, 2, 4]).map((midi) => ({ beat: 0, midi, dur: 4, voice: 'strings' as const, vel: 0.2, rev: 0.6 })));
      return ev;
    },
  },
  baik: {
    id: 'baik', bpm: 108, beatsPerBar: 4, root: 43, scale: DORIAN, progression: [0, 0, 3, 4, 5, 3, 4, 4], bars: 8, level: 0.56,
    gen: ({ track, bar, rng, intensity }) => {
      const ev: NoteEvent[] = [];
      const root = chordDeg(track, bar);
      for (let b = 0; b < 8; b++) ev.push({ beat: b / 2, midi: degreeToMidi(track, root, 0), dur: 0.4, voice: 'bass', vel: b % 2 ? 0.32 : 0.45 });
      for (let b = 0; b < 4; b++) ev.push({ beat: b, midi: 36, dur: 0.15, voice: 'kick', vel: 0.6 });
      ev.push({ beat: 1, midi: 38, dur: 0.15, voice: 'snare', vel: 0.32, rev: 0.25 }, { beat: 3, midi: 38, dur: 0.15, voice: 'snare', vel: 0.32, rev: 0.25 });
      ev.push(...chord(track, bar, 1, [0, 2, 4]).map((midi, i) => ({ beat: 0, midi, dur: 4, voice: 'pad' as const, vel: 0.25 + intensity * 0.15, pan: (i - 1) * 0.4, rev: 0.4 })));
      ev.push(...phrase(track, BAIK_TUNE[bar % 8]!, 'theremin', 2, 0.28 + intensity * 0.12, { pan: 0.1, rev: 0.55 }));
      if (intensity > 0.2) {
        for (let s = 0; s < 16; s++) {
          if (rng() < 0.25) continue;
          ev.push({ beat: s / 4, midi: degreeToMidi(track, root + [0, 2, 4, 7, 4, 2][s % 6]!, 1), dur: 0.22, voice: 'lead', vel: 0.14 + intensity * 0.12, pan: Math.sin(s * 0.8) * 0.5, rev: 0.3 });
        }
      }
      if (intensity > 0.5) for (let s = 0; s < 8; s++) ev.push({ beat: s / 2 + 0.25, midi: 80, dur: 0.05, voice: 'hat', vel: 0.16, pan: 0.3 });
      if (intensity > 0.65 && bar % 2 === 0) ev.push(...chord(track, bar, 0, [0, 4, 7]).map((midi) => ({ beat: 0, midi, dur: 3.5, voice: 'brass' as const, vel: 0.35 * intensity, rev: 0.45 })));
      return ev;
    },
  },
  core: {
    id: 'core', bpm: 50, beatsPerBar: 4, root: 48, scale: MINOR, progression: [0, 5, 3, 4, 0, 5, 6, 4], bars: 8, level: 0.6,
    warm: [{ inst: 'celesta', from: 72, to: 96 }],
    gen: ({ track, bar, rng }) => {
      const c = chordDeg(track, bar);
      const ev: NoteEvent[] = chord(track, bar, 0, [0, 2, 4]).map((midi, i) => ({ beat: 0, midi, dur: 4, voice: 'choir' as const, vel: 0.4, pan: (i - 1) * 0.5, rev: 0.75 }));
      ev.push({ beat: 0, midi: degreeToMidi(track, c, -2), dur: 4, voice: 'subbass', vel: 0.5 });
      ev.push(...phrase(track, CORE_TUNE[bar % 8]!, 'strings', 0, 0.3, { rev: 0.7 }));
      for (let i = 0; i < 4; i++) if (rng() > 0.5) ev.push({ beat: i + rng() * 0.5, midi: degreeToMidi(track, c + pickFrom(rng, [0, 2, 4, 7, 9]), 2), dur: 2, voice: 'celesta', vel: 0.14, pan: rng() * 1.6 - 0.8, rev: 0.85 });
      return ev;
    },
  },
  end_keeper: {
    id: 'end_keeper', bpm: 48, beatsPerBar: 4, root: 60, scale: MINOR, progression: [0], bars: 16, level: 0.55,
    gen: ({ bar }) => (bar === 0 ? [{ beat: 0, midi: 60, dur: 12, voice: 'piano', vel: 0.4, rev: 0.8 }] : []),
  },
  end_merge: {
    id: 'end_merge', bpm: 72, beatsPerBar: 4, root: 60, scale: MAJOR, progression: [0, 4, 5, 3, 0, 4, 3, 4], bars: 8, level: 0.6,
    warm: [{ inst: 'piano', from: 48, to: 84 }, { inst: 'bell', from: 72, to: 91 }],
    gen: ({ track, bar, rng }) => {
      const c = chordDeg(track, bar);
      const ev: NoteEvent[] = chord(track, bar, 0, [0, 2, 4, 7]).map((midi) => ({ beat: 0, midi, dur: 4, voice: 'strings' as const, vel: 0.24, rev: 0.6 }));
      ev.push({ beat: 0, midi: degreeToMidi(track, c, -1), dur: 4, voice: 'piano', vel: 0.38, pan: -0.2, rev: 0.5 });
      for (let b = 0; b < 8; b++) ev.push({ beat: b / 2, midi: degreeToMidi(track, c + [0, 2, 4, 7][b % 4]!, 0), dur: 1, voice: 'piano', vel: 0.18 + (rng() > 0.8 ? 0.06 : 0), pan: 0.1, rev: 0.5 });
      ev.push(...phrase(track, MERGE_TUNE[bar % 8]!, 'bell', 1, 0.3, { pan: 0.25, rev: 0.7 }));
      return ev;
    },
  },
  end_editor: {
    id: 'end_editor', bpm: 60, beatsPerBar: 4, root: 69, scale: [0], progression: [0], bars: 4, level: 0.4,
    gen: () => [{ beat: 0, midi: 69, dur: 4, voice: 'subbass', vel: 0.14 }],
  },
};

export type TrackId = keyof typeof TRACKS;

export function generateBar(track: Track, bar: number, intensity = 0): NoteEvent[] {
  const rng = mulberry32((hashString(track.id) + bar * 7919) >>> 0);
  return track.gen({ track, bar: bar % track.bars, rng, intensity });
}
