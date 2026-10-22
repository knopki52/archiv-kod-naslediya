import { describe, expect, it } from 'vitest';
import { e2Stage, EPOCH2_SCRIPT, HALL_INTERACTABLES } from '../../src/content/epoch2';
import { HINT_RULES } from '../../src/content/hints';
import { evalCond, newState } from '../../src/core/State';

describe('Эпоха 2: этапы, доступ, выбор артефакта', () => {
  it('цель ведёт по цепочке: печка → дневник → Мария Павловна → двор', () => {
    const s = newState();
    expect(e2Stage(s).objective).toBeNull();
    s.flags['e2.started'] = true;
    expect(e2Stage(s)).toEqual({ objective: 'Подойди к печке', rule: 'e2_stove' });
    s.flags['e2.met'] = true;
    expect(e2Stage(s).rule).toBe('e2_diary');
    s.flags['e2.diaryDone'] = true;
    expect(e2Stage(s).rule).toBe('e2_maria');
    s.flags['e2.minigameDone'] = true;
    s.flags['e2.yardOpen'] = true;
    expect(e2Stage(s).rule).toBe('e2_yard');
    for (const r of ['e2_stove', 'e2_diary', 'e2_maria', 'e2_yard', 'e2_interrogate', 'e2_night']) expect(HINT_RULES[r], r).toBeDefined();
  });

  it('дверь во двор закрыта, пока не собраны U1–U4 (флаг выставляет yardCheck)', () => {
    const door = HALL_INTERACTABLES.find((i) => i.id === 'door_yard')!;
    const s = newState();
    expect(evalCond(s, door.enabledIf!)).toBe(false);
    const check = EPOCH2_SCRIPT['yardCheck']![0]!;
    expect(check.t).toBe('if');
    if (check.t !== 'if') return;
    for (const c of ['ep2.U1', 'ep2.U2', 'ep2.U3'] as const) s.clues[2].push(c);
    expect(evalCond(s, check.cond)).toBe(false);
    s.clues[2].push('ep2.U4');
    expect(evalCond(s, check.cond)).toBe(true);
  });

  it('ночной выбор: три варианта, любой принимается и записывает артефакт', () => {
    const sled = EPOCH2_SCRIPT['sled']!;
    const choice = sled.find((st) => st.t === 'choice');
    expect(choice?.t).toBe('choice');
    if (choice?.t !== 'choice') return;
    expect(choice.options.map((o) => o.effects?.artifact)).toEqual(['grain', 'voices', 'fire']);
    expect(sled.some((st) => st.t === 'card' && st.id === 2)).toBe(true);
  });

  it('«согласиться»: метроном замирает; «вернуть правду»: нет', () => {
    const after = EPOCH2_SCRIPT['afterChoice']!;
    const agreeAt = after.findIndex((st) => st.t === 'label' && st.name === 'agree');
    const truthAt = after.findIndex((st) => st.t === 'label' && st.name === 'truth');
    const freeze = after.findIndex((st) => st.t === 'ambience' && st.name === 'metronome_freeze');
    expect(freeze).toBeGreaterThan(agreeAt);
    expect(freeze).toBeGreaterThan(truthAt);
    expect(after.slice(truthAt, agreeAt).some((st) => st.t === 'ambience')).toBe(false);
  });
});
