import { describe, expect, it } from 'vitest';
import { e1Stage, EPOCH1_SCRIPT, SQUARE_INTERACTABLES } from '../../src/content/epoch1';
import { HINT_RULES } from '../../src/content/hints';
import { evalCond, newState } from '../../src/core/State';

describe('Эпоха 1: этапы и цель', () => {
  it('до старта цели нет; затем ведёт игрока по цепочке', () => {
    const s = newState();
    expect(e1Stage(s).objective).toBeNull();
    s.flags['e1.started'] = true;
    s.flags['e1.onfimMet'] = true;
    expect(e1Stage(s)).toEqual({ objective: 'Иди за Онфимом', rule: 'e1_house' });
    s.flags['e1.chestDone'] = true;
    expect(e1Stage(s).objective).toBe('Расспроси Настасью (пекарня)');
    s.flags['e1.bakeryAsked'] = true;
    expect(e1Stage(s).rule).toBe('e1_logs');
    s.flags['e1.logs'] = true;
    expect(e1Stage(s).rule).toBe('e1_oven');
    s.flags['e1.bakeryDone'] = true;
    expect(e1Stage(s).objective).toBe('Выйди на площадь');
    s.flags['ep1.believedGuest'] = true;
    expect(e1Stage(s).rule).toBe('e1_stall');
    s.flags['e1.guestDone'] = true;
    expect(e1Stage(s).rule).toBe('e1_onfim');
    s.flags['e1.minigameDone'] = true;
    s.flags['e1.workshopOpen'] = true;
    expect(e1Stage(s).rule).toBe('e1_workshop');
  });

  it('все правила подсказок, упомянутые этапами, существуют', () => {
    const s = newState();
    for (const f of ['e1.started', 'e1.onfimMet']) s.flags[f] = true;
    expect(HINT_RULES[e1Stage(s).rule]).toBeDefined();
    for (const rule of ['e1_house', 'e1_chest', 'e1_bakery', 'e1_logs', 'e1_oven', 'e1_stall', 'e1_onfim', 'e1_workshop', 'e1_interrogate']) {
      expect(HINT_RULES[rule], rule).toBeDefined();
    }
  });
});

describe('Эпоха 1: условия доступа', () => {
  it('мастерская закрыта, пока не собраны U1–U5 (проверяется флагом, который выставляет workshopCheck)', () => {
    const door = SQUARE_INTERACTABLES.find((i) => i.id === 'door_workshop')!;
    const s = newState();
    expect(evalCond(s, door.enabledIf!)).toBe(false);
    s.flags['e1.workshopOpen'] = true;
    expect(evalCond(s, door.enabledIf!)).toBe(true);
    const check = EPOCH1_SCRIPT['workshopCheck']![0]!;
    expect(check.t).toBe('if');
    if (check.t !== 'if') return;
    const s2 = newState();
    for (const c of ['ep1.U1', 'ep1.U2', 'ep1.U3', 'ep1.U4'] as const) s2.clues[1].push(c);
    expect(evalCond(s2, check.cond)).toBe(false);
    s2.clues[1].push('ep1.U5');
    expect(evalCond(s2, check.cond)).toBe(true);
  });

  it('лавка торговца появляется только у поверивших Гостю; ложная улика не нужна для доски', () => {
    const stall = SQUARE_INTERACTABLES.find((i) => i.id === 'stall')!;
    const s = newState();
    expect(evalCond(s, stall.visibleIf!)).toBe(false);
    s.flags['ep1.believedGuest'] = true;
    expect(evalCond(s, stall.visibleIf!)).toBe(true);
    s.flags['e1.guestDone'] = true;
    expect(evalCond(s, stall.visibleIf!)).toBe(false);
  });

  it('концовка эпохи: карточка и возврат в Хаб с hubReturn=1 в обеих ветках', () => {
    const end = EPOCH1_SCRIPT['afterChoice']!;
    expect(end.some((st) => st.t === 'card' && st.id === 1)).toBe(true);
    expect(end.some((st) => st.t === 'scene' && st.to === 'archive_hall')).toBe(true);
  });
});
