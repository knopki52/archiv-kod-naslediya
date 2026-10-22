import { describe, expect, it } from 'vitest';
import { BUNKER_INTERACTABLES, e3Stage, EPOCH3_SCRIPT } from '../../src/content/epoch3';
import { HINT_RULES } from '../../src/content/hints';
import { BOARDS, evaluateBoard } from '../../src/core/Board';
import { evalCond, newState } from '../../src/core/State';

describe('Эпоха 3: этапы, доступ, развязка', () => {
  it('цель ведёт по цепочке: бункер → Инспектор → площадка → пульт → допрос', () => {
    const s = newState();
    expect(e3Stage(s, 'pad').objective).toBeNull();
    s.flags['e3.started'] = true;
    expect(e3Stage(s, 'pad')).toEqual({ objective: 'Войди в бункер', rule: 'e3_enter' });
    s.flags['e3.met'] = true;
    expect(e3Stage(s, 'bunker').rule).toBe('e3_inspect');
    s.flags['e3.inspectDone'] = true;
    expect(e3Stage(s, 'pad').rule).toBe('e3_ivan');
    s.flags['e3.padDone'] = true;
    expect(e3Stage(s, 'comms').rule).toBe('e3_galya');
    s.flags['e3.minigameDone'] = true;
    expect(e3Stage(s, 'bunker').rule).toBe('e3_interrogate');
    s.flags['stage.e3finale'] = true;
    expect(e3Stage(s, 'bunker').objective).toBeNull();
    for (const r of ['e3_enter', 'e3_inspect', 'e3_to_pad', 'e3_ivan', 'e3_to_comms', 'e3_galya', 'e3_back', 'e3_interrogate']) {
      expect(HINT_RULES[r], r).toBeDefined();
    }
  });

  it('допрос Инспектора закрыт, пока не собраны U1–U4', () => {
    const talk = BUNKER_INTERACTABLES.find((i) => i.id === 'inspector_talk')!;
    const s = newState();
    expect(evalCond(s, talk.enabledIf!)).toBe(false);
    for (const c of ['ep3.U1', 'ep3.U2', 'ep3.U3'] as const) s.clues[3].push(c);
    expect(evalCond(s, talk.enabledIf!)).toBe(false);
    s.clues[3].push('ep3.U4');
    expect(evalCond(s, talk.enabledIf!)).toBe(true);
  });

  it('доска: верна только связка U1+U2+U5', () => {
    expect(BOARDS[3].correct).toEqual(['ep3.U1', 'ep3.U2', 'ep3.U5']);
    expect(evaluateBoard(3, ['ep3.U1', 'ep3.U3', 'ep3.U4']).ok).toBe(false);
    expect(evaluateBoard(3, ['ep3.U5', 'ep3.U2', 'ep3.U1']).ok).toBe(true);
  });

  it('обе ветки выбора ведут к запуску ракеты, журнал пишется только в «правде»', () => {
    const after = EPOCH3_SCRIPT['afterChoice']!;
    const truthAt = after.findIndex((st) => st.t === 'label' && st.name === 'truth');
    const agreeAt = after.findIndex((st) => st.t === 'label' && st.name === 'agree');
    const write = after.findIndex((st) => st.t === 'call' && st.name === 'bk.journalWrite');
    const close = after.findIndex((st) => st.t === 'call' && st.name === 'bk.journalClose');
    expect(write).toBeGreaterThan(truthAt);
    expect(write).toBeLessThan(agreeAt);
    expect(close).toBeGreaterThan(agreeAt);
    expect(after.some((st) => st.t === 'scene' && st.to === 'bk_pad')).toBe(true);
    const launch = EPOCH3_SCRIPT['launch']!;
    expect(launch.some((st) => st.t === 'card' && st.id === 3)).toBe(true);
    expect(launch.some((st) => st.t === 'scene' && st.to === 'archive_hall')).toBe(true);
  });
});
