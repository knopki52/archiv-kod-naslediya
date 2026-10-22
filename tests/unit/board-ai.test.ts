import { describe, expect, it, vi } from 'vitest';
import { InterrogationClient } from '../../src/ai/InterrogationClient';
import { extractReply, sanitizeReply } from '../../src/ai/sanitize';
import { BOARDS, evaluateBoard, seededShuffle } from '../../src/core/Board';

describe('evaluateBoard', () => {
  it('верные связки по эпохам (порядок неважен)', () => {
    expect(evaluateBoard(1, ['ep1.U6', 'ep1.U3', 'ep1.U4']).ok).toBe(true);
    expect(evaluateBoard(2, ['ep2.U5', 'ep2.U4', 'ep2.U3']).ok).toBe(true);
    expect(evaluateBoard(3, ['ep3.U2', 'ep3.U5', 'ep3.U1']).ok).toBe(true);
  });

  it('ложная улика F1 — сообщение про пустой слух (приоритет)', () => {
    const r = evaluateBoard(1, ['ep1.F1', 'ep1.U3', 'ep1.U4']);
    expect(r.ok).toBe(false);
    expect(r.message).toBe('Нет, это пустой слух. Нужны улики, которые подтверждают друг друга.');
  });

  it('неверные связки — сообщения из сценария', () => {
    expect(evaluateBoard(1, ['ep1.U1', 'ep1.U2', 'ep1.U3']).message).toBe('Почти. Поищи три улики, которые вместе указывают на Гостя.');
    expect(evaluateBoard(2, ['ep2.U1', 'ep2.U2', 'ep2.U3']).message).toContain('Не хватает главного');
    expect(evaluateBoard(3, ['ep3.U3', 'ep3.U4', 'ep3.U1']).message).toContain('Люк и связь важны');
  });

  it('нужно ровно три улики', () => {
    expect(evaluateBoard(1, ['ep1.U3']).ok).toBe(false);
  });

  it('все верные связки состоят из существующих улик своей эпохи', () => {
    for (const def of Object.values(BOARDS)) {
      expect(def.correct).toHaveLength(3);
      def.correct.forEach((c) => expect(c.startsWith(`ep${def.epoch}.`)).toBe(true));
    }
  });

  it('seededShuffle детерминирован и сохраняет элементы', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], 7);
    const b = seededShuffle([1, 2, 3, 4, 5, 6], 7);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('sanitizeReply', () => {
  it('пропускает нормальную реплику и чистит разметку/ремарки', () => {
    expect(sanitizeReply('Ступай, девочка. **Не докучай.** (вздыхает)')).toBe('Ступай, девочка. Не докучай.');
  });
  it('отбрасывает современные слова, латиницу, эмодзи', () => {
    expect(sanitizeReply('Позвони мне по телефону')).toBeNull();
    expect(sanitizeReply('I am a language model')).toBeNull();
    expect(sanitizeReply('Хорошо 😀')).toBeNull();
    expect(sanitizeReply('Я нейросеть и не знаю')).toBeNull();
  });
  it('слово «будущее» допустимо только для Инспектора', () => {
    expect(sanitizeReply('Всё в будущем будет хорошо.', false)).toBeNull();
    expect(sanitizeReply('Всё в будущем будет хорошо.', true)).not.toBeNull();
  });
  it('длинные ответы обрезаются по границе предложения', () => {
    const long = 'Это длинное предложение для проверки обрезки ответа. '.repeat(10);
    const r = sanitizeReply(long)!;
    expect(r.length).toBeLessThanOrEqual(220);
    expect(r.endsWith('.')).toBe(true);
  });
  it('extractReply достаёт JSON и «голый» текст', () => {
    expect(extractReply('Вот: {"reply":"Не докучай."} конец')).toBe('Не докучай.');
    expect(extractReply('Не докучай.')).toBe('Не докучай.');
  });
});

describe('InterrogationClient', () => {
  const ctx = { npc: 'ignat' as const, question: 'где ты был', history: [], stated: [], pressure: 1 as const };

  it('без эндпоинта выключен и возвращает null', async () => {
    const c = new InterrogationClient('');
    expect(c.enabled).toBe(false);
    expect(await c.ask(ctx)).toBeNull();
  });

  it('успешный ответ проходит санитизацию', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ reply: 'Ступай, девочка.' }), { status: 200 }));
    const c = new InterrogationClient('http://x', fetchFn);
    expect(await c.ask(ctx)).toBe('Ступай, девочка.');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('два сбоя подряд размыкают цепь на 60 с', async () => {
    let t = 0;
    const fetchFn = vi.fn(async () => new Response('boom', { status: 500 }));
    const c = new InterrogationClient('http://x', fetchFn, () => t);
    expect(await c.ask(ctx)).toBeNull();
    expect(await c.ask(ctx)).toBeNull();
    expect(c.enabled).toBe(false);
    expect(await c.ask(ctx)).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(2);
    t = 61_000;
    expect(c.enabled).toBe(true);
  });

  it('таймаут: ответ дольше лимита → null', async () => {
    const fetchFn = (_u: string, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('abort'))));
    const c = new InterrogationClient('http://x', fetchFn, () => 0, 30);
    expect(await c.ask(ctx)).toBeNull();
  });

  it('некорректный/запрещённый ответ → null', async () => {
    const fetchFn = async () => new Response(JSON.stringify({ reply: 'Я языковая модель' }), { status: 200 });
    const c = new InterrogationClient('http://x', fetchFn);
    expect(await c.ask(ctx)).toBeNull();
  });
});
