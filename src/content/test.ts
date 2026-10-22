import type { Interactable, Script } from './types';

export const TEST_SCRIPT: Script = {
  start: [
    { t: 'checkpoint', id: 'test.start' },
    { t: 'objective', text: 'Подойди к мерцающей книге (E)' },
    { t: 'say', who: 'byte', text: 'Эй! Ты функционируешь? Отлично.' },
    { t: 'say', who: 'byte', text: 'Не помню, кто ты. Но ты единственная, кто ещё двигается.', aside: 'тихо' },
  ],
  book: [
    { t: 'say', who: 'byte', text: 'Видишь? Они рассыпаются.' },
    {
      t: 'choice',
      prompt: 'Что ответить?',
      options: [
        { text: 'Покажи, что осталось', goto: 'soft', effects: { flags: { 'test.tone': 'soft' } } },
        { text: 'Расскажи по порядку и не плачь', goto: 'strict', effects: { flags: { 'test.tone': 'strict' } } },
      ],
    },
    { t: 'label', name: 'soft' },
    { t: 'say', who: 'onfim', text: 'Вот, только трубка. Идём, покажу сундук.', aside: 'шмыгает носом' },
    { t: 'goto', name: 'after' },
    { t: 'label', name: 'strict' },
    { t: 'say', who: 'onfim', text: 'Утром была моя. К обеду лежала чужая. Сундук дома. Идём.', aside: 'быстро, сухо' },
    { t: 'label', name: 'after' },
    { t: 'giveClue', clue: 'ep1.U1' },
    { t: 'say', who: 'byte', text: 'Чернила на бересте? Странно. Настоящие грамоты процарапывали писалом.' },
    { t: 'checkpoint', id: 'test.book' },
    { t: 'objective', text: null },
  ],
};

export const TEST_INTERACTABLES: Interactable[] = [
  { id: 'book', x: 360, y: 200, w: 30, h: 30, prompt: 'Осмотреть', icon: 'book', onUse: 'test#book', once: true },
];
