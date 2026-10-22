import { describe, expect, it } from 'vitest';
import { HALL_INTERACTABLES, HUB_SCRIPT, PROLOGUE_SCRIPT } from '../../src/content/hall';
import { evalCond, newState } from '../../src/core/State';

describe('Хаб: порядок порталов (docs/07 §1)', () => {
  const portal = (i: number) => HALL_INTERACTABLES.find((x) => x.id === `portal_${i}`)!;

  it('в начале доступен только первый портал', () => {
    const s = newState();
    expect(evalCond(s, portal(0).enabledIf!)).toBe(true);
    expect(evalCond(s, portal(1).enabledIf!)).toBe(false);
    expect(evalCond(s, portal(2).enabledIf!)).toBe(false);
  });

  it('после эпохи 1 открывается второй, первый гаснет', () => {
    const s = newState();
    s.epochDone[0] = true;
    expect(evalCond(s, portal(0).enabledIf!)).toBe(false);
    expect(evalCond(s, portal(1).enabledIf!)).toBe(true);
    expect(evalCond(s, portal(2).enabledIf!)).toBe(false);
  });

  it('после трёх эпох порталы закрыты, дверь проверяет три карточки', () => {
    const s = newState();
    s.epochDone = [true, true, true];
    for (const i of [0, 1, 2]) expect(evalCond(s, portal(i).enabledIf!)).toBe(false);
    const check = HUB_SCRIPT['doorCheck']![0]!;
    expect(check.t).toBe('if');
    if (check.t !== 'if') return;
    expect(evalCond(s, check.cond)).toBe(false);
    s.cards = [1, 2, 3];
    expect(evalCond(s, check.cond)).toBe(true);
  });
});

describe('Пролог: дословность реплик (docs/story §2)', () => {
  const lines = (label: string) =>
    PROLOGUE_SCRIPT[label]!.filter((s) => s.t === 'say').map((s) => (s.t === 'say' ? `${s.who}: ${s.text}` : ''));

  it('сцена 1 и сцена 2', () => {
    expect(lines('start')).toEqual([
      'byte: Эй! Ты функционируешь? Отлично.',
      'byte: Не помню, кто ты. Но ты единственная, кто ещё двигается.',
      'byte: Я Байт, дрон Архива. Попробуй пройтись. Клавиши со стрелками или WASD. На телефоне джойстик слева.',
    ]);
    expect(lines('book')).toEqual([
      'byte: Видишь? Они рассыпаются.',
      'byte: Кто-то переписывает историю прямо сейчас. Страница за страницей.',
      'dubler: Не пугайся. Я просто навожу порядок.',
      'dubler: Зачем людям помнить то, что причиняет боль?',
      'byte: Это Дублёр. Он не врёт, но и правды не говорит.',
      'byte: Он правит прошлое так, чтобы оно не болело. Мы должны это остановить.',
    ]);
  });

  it('сцена 4: Лупа и портал', () => {
    expect(lines('leaf')).toEqual([
      'byte: Держи Лупу правды. Наводишь на предмет и задаёшь три вопроса: кто автор, когда и где это было, что это подтверждает.',
      'byte: Идём. Первая подмена в Новгороде. Тринадцатый век.',
    ]);
  });

  it('возвращения в Хаб: реплики Байта по эпохам', () => {
    const say = (label: string) => HUB_SCRIPT[label]!.filter((s) => s.t === 'say').map((s) => (s.t === 'say' ? s.text : ''));
    expect(say('e1_truth')).toEqual(['Одна страница спасена. Дальше Ленинград.']);
    expect(say('e1_agree')).toEqual(['Идём дальше.']);
    expect(say('afterE2')).toEqual(['Теперь Байконур. Двенадцатое апреля, шестьдесят первый год.']);
    expect(say('afterE3')).toEqual(['Три карточки собраны. Дверь в Ядро открыта. Дальше я не смогу идти с тобой.']);
  });
});
