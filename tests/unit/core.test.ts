import { describe, expect, it } from 'vitest';
import { CORE_SCRIPT } from '../../src/content/core';
import type { Cond, Step } from '../../src/content/types';
import { availableFinals, evalCond, newState } from '../../src/core/State';

const allSteps = Object.values(CORE_SCRIPT).flat();
const says = (steps: Step[]) => steps.filter((s): s is Extract<Step, { t: 'say' }> => s.t === 'say');

describe('Ядро и концовки', () => {
  it('Лета: 6 вариантов реплик выбираются данными по флагам epN.choice', () => {
    const texts = says(CORE_SCRIPT['letaLines']!).map((s) => s.text);
    expect(texts).toHaveLength(6);
    for (const n of [1, 2, 3] as const) {
      const s = newState();
      s.flags[`ep${n}.choice`] = 'truth';
      const cond = (CORE_SCRIPT['letaLines']!.find((st) => st.t === 'if' && JSON.stringify(st.cond).includes(`ep${n}.choice`)) as Extract<Step, { t: 'if' }>).cond;
      expect(evalCond(s, cond)).toBe(true);
      s.flags[`ep${n}.choice`] = 'agree';
      expect(evalCond(s, cond)).toBe(false);
    }
  });

  it('финальный выбор по integrity: замки, нулевой выбор делает Лета', () => {
    expect(availableFinals(0)).toEqual({ erase: false, merge: false, agree: true });
    expect(availableFinals(1)).toEqual({ erase: true, merge: false, agree: true });
    expect(availableFinals(2)).toEqual({ erase: true, merge: false, agree: true });
    expect(availableFinals(3)).toEqual({ erase: true, merge: true, agree: true });
    const first = CORE_SCRIPT['finalChoice']!.find((st) => st.t === 'if') as Extract<Step, { t: 'if' }>;
    const s = newState();
    expect(evalCond(s, first.cond)).toBe(true);
    s.integrity = 1;
    expect(evalCond(s, first.cond)).toBe(false);
    const zero = CORE_SCRIPT['finalChoice']!;
    expect(says(zero).some((st) => st.text === 'Да.' && st.new)).toBe(true);
  });

  it('«Слияние»: три варианта реплики по артефакту', () => {
    const merge = CORE_SCRIPT['endMerge']!;
    const conds = merge.filter((st): st is Extract<Step, { t: 'if' }> => st.t === 'if').map((st) => st.cond as Cond);
    const s = newState();
    for (const [art, text] of [
      ['grain', 'Из семян, которые мы спасли, вырастут поля.'],
      ['voices', 'Письма обычных людей теперь тоже в Архиве.'],
      ['fire', 'Тепло убежища дошло до самого Архива.'],
    ] as const) {
      s.artifact = art;
      expect(conds.filter((c) => evalCond(s, c))).toHaveLength(1);
      expect(says(merge).some((st) => st.text === text)).toBe(true);
    }
  });

  it('каждая концовка заканчивается записью концовки (core.finish)', () => {
    for (const [key, id] of [['endKeeper', 'keeper'], ['endMerge', 'merge'], ['endEditor', 'editor']] as const) {
      const last = CORE_SCRIPT[key]!.at(-1)!;
      expect(last).toMatchObject({ t: 'call', name: 'core.finish', args: { ending: id } });
    }
    expect(allSteps.filter((s) => s.t === 'call' && s.name === 'core.finish')).toHaveLength(3);
  });

  it('«Редактор»: Байт молчит; «Хранитель»: нет реплик Леты после стирания', () => {
    expect(CORE_SCRIPT['endEditor']!.some((st) => st.t === 'set' && st.effects.byteSilent === true)).toBe(true);
    expect(says(CORE_SCRIPT['endKeeper']!).some((st) => st.who === 'lete')).toBe(false);
  });
});
