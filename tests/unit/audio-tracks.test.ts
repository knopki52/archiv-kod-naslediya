import { describe, expect, it } from 'vitest';
import { SFX_NAMES } from '../../src/audio/Sfx';
import { degreeToMidi, generateBar, midiToHz, TRACKS } from '../../src/audio/tracks';

describe('tracks', () => {
  it('midiToHz: A4 = 440, октава = ×2', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 5);
    expect(midiToHz(81)).toBeCloseTo(880, 5);
  });

  it('degreeToMidi: ступени за пределами лада переходят в соседние октавы', () => {
    const t = TRACKS['archive']!;
    expect(degreeToMidi(t, 0)).toBe(t.root);
    expect(degreeToMidi(t, t.scale.length)).toBe(t.root + 12);
    expect(degreeToMidi(t, -1)).toBe(t.root + t.scale[t.scale.length - 1]! - 12);
  });

  it('все треки детерминированы и дают корректные события', () => {
    for (const track of Object.values(TRACKS)) {
      for (let bar = 0; bar < track.bars; bar++) {
        const a = generateBar(track, bar, 0.8);
        const b = generateBar(track, bar, 0.8);
        expect(a, `${track.id}#${bar}`).toEqual(b);
        for (const ev of a) {
          expect(ev.beat).toBeGreaterThanOrEqual(0);
          expect(ev.beat).toBeLessThan(track.beatsPerBar + 0.001);
          expect(ev.dur).toBeGreaterThan(0);
          expect(ev.vel).toBeGreaterThan(0);
          expect(ev.vel).toBeLessThanOrEqual(1);
          if (!['hat', 'kick', 'snare'].includes(ev.voice)) {
            expect(midiToHz(ev.midi), `${track.id}#${bar}`).toBeGreaterThan(20);
            expect(midiToHz(ev.midi)).toBeLessThan(5000);
          }
        }
      }
    }
  });

  it('«Хранитель»: после первого такта тишина; «Байконур»: с intensity появляются арпеджио и тарелки', () => {
    const keeper = TRACKS['end_keeper']!;
    expect(generateBar(keeper, 0).length).toBe(1);
    expect(generateBar(keeper, 3)).toEqual([]);
    const baik = TRACKS['baik']!;
    const calm = generateBar(baik, 1, 0).filter((e) => e.voice === 'lead').length;
    const hot = generateBar(baik, 1, 0.9).filter((e) => e.voice === 'lead').length;
    expect(calm).toBe(0);
    expect(hot).toBeGreaterThan(5);
  });

  it('Ленинград: темп 60 BPM (в такт метроному)', () => {
    expect(TRACKS['len']!.bpm).toBe(60);
  });

  it('набор SFX покрывает всё, что вызывает интерфейс', () => {
    for (const n of ['loupe_scan', 'loupe_ping', 'clue', 'contradiction', 'board_ok', 'card', 'snap', 'fail', 'click', 'open', 'close', 'glitch', 'crumble', 'assemble', 'portal']) {
      expect(SFX_NAMES as readonly string[]).toContain(n);
    }
  });
});
