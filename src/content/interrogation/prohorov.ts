import type { InterrogationDef } from './types';

export const PROHOROV: InterrogationDef = {
  npc: 'prohorov',
  speaker: 'prohorov',
  title: 'Прохоров, управдом',
  maxQuestions: 4,
  breakAfter: 2,
  givesClue: 'ep2.U5',
  intents: [
    {
      id: 'night',
      anchor: true,
      chip: 'Где вы были этой ночью?',
      keywords: ['где', 'ночь', 'ночью', 'вчера', 'убежищ'],
      reply: { text: 'В убежище, всю ночь. Люди видели.' },
      repeat: [{ text: 'Я сказал: в убежище.', new: true }],
      states: ['alibi_shelter'],
    },
    {
      id: 'bread',
      anchor: true,
      chip: 'Что за хлеб вы ели?',
      keywords: ['хлеб', 'паек', 'карточк', 'ели', 'ел', 'белый', 'белого'],
      reply: { aside: 'резко', text: 'Свой. По карточке. Не твоё дело.' },
      repeat: [{ text: 'По карточке. Всё.', new: true }],
      states: ['bread_own'],
    },
    {
      id: 'key',
      chip: 'Кто просил у вас ключ?',
      keywords: ['ключ', 'читальн', 'гвозд', 'подвал', 'зал'],
      reply: { text: 'Никто. Ключ у меня на гвозде. Не знаю, о чём ты.' },
      repeat: [{ text: 'Ключ на гвозде. Сколько раз повторять.', new: true }],
      states: ['key_on_nail'],
    },
    {
      id: 'kids',
      chip: 'У вас дома дети?',
      keywords: ['дет', 'дом', 'семь', 'сын', 'дочь'],
      reply: { aside: 'тише', text: 'Двое. Дома. Не трогай.' },
      repeat: [{ text: 'Не трогай, я сказал.', new: true }],
    },
  ],
  fallbackReplies: [
    { text: 'К чему ты клонишь?' },
    { text: 'Некогда мне. Печь не ждёт.', new: true },
  ],
  contradictions: [
    {
      id: 'c1',
      requiresStated: 'alibi_shelter',
      clue: 'ep2.U3',
      playerLine: '[U3] Ключ был только у вас. Дневник правили в зале.',
      npcLines: [{ aside: 'отводит взгляд', text: 'Зашёл на минуту. Проверить окна.' }],
    },
    {
      id: 'c2',
      requiresStated: 'bread_own',
      clue: 'ep2.U1',
      playerLine: '[U1] По карточке столько хлеба не дают. Откуда он?',
      npcLines: [
        {
          aside: 'опускает топор, садится на чурбак',
          text: 'Он пришёл вечером. Сказал: дай ключ, никому плохого не сделаем, только дописать.',
        },
      ],
    },
  ],
  breakLines: [{ text: 'Принёс хлеба, белого, как до войны. Я съел, Господи… Дитё у меня дома.' }],
  wrongNpc: { text: 'К чему ты клонишь?' },
  wrongByte: 'Не то. Вспомни, что он сказал про ночь и про хлеб.',
  notYetByte: 'Пусть сначала скажет, где был ночью и что за хлеб ел.',
  escalateByte: [
    'Он утверждает, что всю ночь был в убежище. А кто мог попасть в читальный зал, кроме него?',
    'Он сказал, что хлеб «свой, по карточке». Что мы знаем про нормы хлеба?',
  ],
};
