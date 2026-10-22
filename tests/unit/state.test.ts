import { describe, expect, it } from 'vitest';
import { applyEffects, availableFinals, evalCond, newState } from '../../src/core/State';

describe('State', () => {
  it('evalCond: флаги, улики, integrity, композиции', () => {
    const s = newState();
    s.flags['a'] = true;
    s.flags['tone'] = 'soft';
    s.clues[1].push('ep1.U1');
    s.integrity = 2;
    expect(evalCond(s, { flag: 'a' })).toBe(true);
    expect(evalCond(s, { flag: 'b' })).toBe(false);
    expect(evalCond(s, { flag: 'tone', eq: 'soft' })).toBe(true);
    expect(evalCond(s, { clue: 'ep1.U1' })).toBe(true);
    expect(evalCond(s, { clue: 'ep2.U1' })).toBe(false);
    expect(evalCond(s, { integrity: { gte: 2 } })).toBe(true);
    expect(evalCond(s, { integrity: { eq: 3 } })).toBe(false);
    expect(evalCond(s, { and: [{ flag: 'a' }, { not: { flag: 'b' } }] })).toBe(true);
    expect(evalCond(s, { or: [{ flag: 'b' }, { clue: 'ep1.U1' }] })).toBe(true);
  });

  it('applyEffects: truth повышает integrity, agree — нет; integrity в [0,3]', () => {
    const s = newState();
    applyEffects(s, { choice: { epoch: 1, value: 'truth' } });
    applyEffects(s, { choice: { epoch: 2, value: 'agree' } });
    expect(s.integrity).toBe(1);
    expect(s.choices).toEqual(['truth', 'agree', null]);
    applyEffects(s, { integrityAdd: 10 });
    expect(s.integrity).toBe(3);
    applyEffects(s, { integrityAdd: -10 });
    expect(s.integrity).toBe(0);
  });

  it('карточки не дублируются', () => {
    const s = newState();
    applyEffects(s, { addCard: 2 });
    applyEffects(s, { addCard: 2 });
    expect(s.cards).toEqual([2]);
  });

  it('финальный выбор по integrity (docs/02 §9)', () => {
    expect(availableFinals(0)).toEqual({ erase: false, merge: false, agree: true });
    expect(availableFinals(1)).toEqual({ erase: true, merge: false, agree: true });
    expect(availableFinals(2)).toEqual({ erase: true, merge: false, agree: true });
    expect(availableFinals(3)).toEqual({ erase: true, merge: true, agree: true });
  });
});
