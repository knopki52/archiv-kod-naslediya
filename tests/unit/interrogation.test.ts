import { describe, expect, it } from 'vitest';
import { classify, normalize } from '../../src/ai/Fallback';
import { INTERROGATIONS } from '../../src/content/interrogation';
import type { NpcId } from '../../src/content/interrogation';
import type { ClueId } from '../../src/content/types';
import { InterrogationEngine, newProgress } from '../../src/core/Interrogation';

function engineFor(npc: NpcId, clues: ClueId[] = []) {
  const def = INTERROGATIONS[npc];
  return new InterrogationEngine(def, newProgress(), (c) => clues.includes(c));
}

describe('Fallback.classify', () => {
  const ignat = INTERROGATIONS.ignat.intents;
  const prohorov = INTERROGATIONS.prohorov.intents;
  const inspector = INTERROGATIONS.inspector.intents;
  const cases: [typeof ignat, string, string | null][] = [
    [ignat, 'Где ты был вчера вечером?', 'alibi'],
    [ignat, 'Кто мог зайти в мастерскую?', 'entered'],
    [ignat, 'почему именно Онфима грамота', 'why_onfim'],
    [ignat, 'Ты что-то скрываешь', 'hide'],
    [ignat, 'расскажи про чернила', 'ink'],
    [ignat, 'какая сегодня погода', null],
    [prohorov, 'Где вы были этой ночью?', 'night'],
    [prohorov, 'Откуда у вас белый хлеб?', 'bread'],
    [prohorov, 'Кто просил у вас ключ?', 'key'],
    [prohorov, 'У вас дома дети?', 'kids'],
    [inspector, 'Когда вы приехали на площадку?', 'arrived'],
    [inspector, 'Почему протокол готов заранее', 'protocol'],
    [inspector, 'почему у вас чистые ботинки', 'boots_q'],
    [inspector, 'что с пропуском', 'pass_q'],
  ];
  it.each(cases)('«%#» → тема', (intents, q, expected) => {
    const found = classify(q, intents, (i) => !i.unlockedBy);
    expect(found?.id ?? null).toBe(expected);
  });

  it('normalize: ё→е, регистр, знаки', () => {
    expect(normalize('  Чёрный   ПЛАЩ!!! ')).toBe('черный плащ');
  });

  it('тема bonus недоступна до первого противоречия', () => {
    const e = engineFor('inspector');
    expect(e.classify('когда приземлится корабль?')).toBeNull();
  });
});

describe('InterrogationEngine', () => {
  it('якорь: первый ответ каноничный и фиксирует утверждение; ИИ не подменяет его', () => {
    const e = engineFor('ignat');
    const r = e.ask('Где ты был вчера вечером?', 'alibi');
    expect(r.kind).toBe('anchor_first');
    expect(r.aiAllowed).toBe(false);
    expect(r.line.text).toContain('В церкви');
    expect(e.progress.stated).toContain('alibi_church');
  });

  it('повтор темы бесплатный и разрешает ИИ', () => {
    const e = engineFor('ignat');
    e.ask('где был', 'alibi');
    const used = e.progress.questionsUsed;
    const r = e.ask('а всё-таки где ты был вечером?');
    expect(r.kind).toBe('repeat');
    expect(r.aiAllowed).toBe(true);
    expect(e.progress.questionsUsed).toBe(used);
  });

  it('mentions_ink не фиксируется, если игрок сам назвал чернила', () => {
    const e = engineFor('ignat');
    const r = e.ask('кто заходил в мастерскую, где чернила?');
    expect(r.intent?.id).toBe('entered');
    expect(e.progress.stated).toContain('no_one_entered');
    expect(e.progress.stated).not.toContain('mentions_ink');
  });

  it('без упоминания чернил в вопросе mentions_ink фиксируется', () => {
    const e = engineFor('ignat');
    e.ask('Кто мог зайти в мастерскую?', 'entered');
    expect(e.progress.stated).toEqual(expect.arrayContaining(['no_one_entered', 'mentions_ink']));
  });

  it('улика без нужного утверждения: попытка не сгорает, подсказка Байта', () => {
    const e = engineFor('ignat', ['ep1.U4']);
    const r = e.present('ep1.U4');
    expect(r.kind).toBe('not_yet');
    expect(r.npcLine?.text).toBe('Это здесь при чём?');
    expect(e.progress.wrongPresents).toBe(0);
    expect(e.progress.solved).toEqual([]);
  });

  it('два противоречия → допрос окончен; порядок произвольный', () => {
    const e = engineFor('ignat', ['ep1.U1', 'ep1.U4']);
    e.ask('', 'entered');
    e.ask('', 'alibi');
    const first = e.present('ep1.U1');
    expect(first.kind).toBe('solved');
    expect(first.broken).toBe(false);
    expect(first.playerLine).toContain('чернила');
    const second = e.present('ep1.U4');
    expect(second.kind).toBe('solved');
    expect(second.broken).toBe(true);
    expect(e.broken).toBe(true);
  });

  it('ложная улика: ответ NPC и подсказка Байта, эскалация на 2-й и 4-й ошибке', () => {
    const e = engineFor('inspector', ['ep3.U3']);
    const first = e.present('ep3.U3');
    expect(first.kind).toBe('wrong');
    expect(first.byteLine).toBe('Не то. Подумай про пропуск и про сапоги.');
    const second = e.present('ep3.U3');
    expect(second.byteLine).toBe(INTERROGATIONS.inspector.escalateByte[0]);
    e.present('ep3.U3');
    const fourth = e.present('ep3.U3');
    expect(fourth.byteLine).toContain('Попробуй улику');
  });

  it('повторное предъявление решённой улики — already', () => {
    const e = engineFor('prohorov', ['ep2.U3']);
    e.ask('', 'night');
    expect(e.present('ep2.U3').kind).toBe('solved');
    expect(e.present('ep2.U3').kind).toBe('already');
  });

  it('бюджет: якорные кнопки доступны всегда, свободный ввод блокируется при исчерпании', () => {
    const e = engineFor('prohorov');
    for (let i = 0; i < 4; i++) e.ask('вопрос про погоду ' + i);
    expect(e.freeTextAllowed).toBe(false);
    expect(e.ask('ещё один вопрос про погоду').kind).toBe('blocked');
    const chips = e.chips();
    const night = chips.find((c) => c.intent.id === 'night')!;
    expect(night.disabled).toBe(false);
    const r = e.ask('', 'night');
    expect(r.kind).toBe('anchor_first');
    expect(chips.find((c) => c.intent.id === 'kids')!.disabled).toBe(true);
    expect(e.ask('', 'kids').kind).toBe('blocked');
  });

  it('бонус-вопрос Инспектора открывается после первого противоречия', () => {
    const e = engineFor('inspector', ['ep3.U1']);
    expect(e.chips().some((c) => c.intent.id === 'bonus')).toBe(false);
    e.ask('', 'arrived');
    e.present('ep3.U1');
    expect(e.chips().some((c) => c.intent.id === 'bonus')).toBe(true);
    const r = e.ask('', 'bonus');
    expect(r.byteAfter).toBe('Корабль ещё не стартовал. Откуда он знает?');
  });

  it('данные: у каждого NPC ровно 4 готовых вопроса (+1 бонус у Инспектора), якорей ≥ 2', () => {
    for (const [npc, def] of Object.entries(INTERROGATIONS)) {
      const chips = def.intents.filter((i) => i.chip && !i.unlockedBy);
      expect(chips.length, npc).toBe(4);
      expect(def.intents.filter((i) => i.anchor).length, npc).toBeGreaterThanOrEqual(2);
      for (const c of def.contradictions) {
        expect(def.intents.some((i) => i.states?.includes(c.requiresStated)), `${npc}/${c.id}`).toBe(true);
      }
    }
  });
});
