import type { ClueId, SpeakerId } from './types';

export interface LoupeHotspot {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  who?: SpeakerId;
  byteLine: string;
  clue?: ClueId;
}

export interface LoupeQuestion {
  q: string;
  a: string;
}

export interface LoupeObject {
  id: string;
  title: string;
  art: 'leaf' | 'bark_forged' | 'diary' | 'pass' | 'boots';
  mode: 'questions' | 'hotspots';
  questions?: LoupeQuestion[];
  hotspots?: LoupeHotspot[];
  verdict: string;
  verdictByte?: string;
}

export const LOUPE: Record<string, LoupeObject> = {
  prologue_leaf: {
    id: 'prologue_leaf',
    title: 'Мерцающий листок',
    art: 'leaf',
    mode: 'questions',
    questions: [
      { q: 'Кто автор?', a: 'Подпись стёрта.' },
      { q: 'Когда и где?', a: 'Дата не совпадает с эпохой.' },
      { q: 'Что подтверждает?', a: 'Ничего. Источника нет.' },
    ],
    verdict: 'ПОДДЕЛКА',
    verdictByte: 'Вот. Это подделка. Теперь ты умеешь ловить подмены.',
  },
  ep1_chest: {
    id: 'ep1_chest',
    title: 'Грамота из сундука',
    art: 'bark_forged',
    mode: 'hotspots',
    hotspots: [
      {
        id: 'material',
        x: 105,
        y: 78,
        r: 20,
        label: 'Материал',
        byteLine: 'Чернила на бересте? Странно. Настоящие грамоты процарапывали писалом.',
        clue: 'ep1.U1',
      },
      {
        id: 'language',
        x: 215,
        y: 112,
        r: 20,
        label: 'Язык',
        byteLine: 'Слово «пожалуйста». Его в тринадцатом веке не было.',
        clue: 'ep1.U2',
      },
    ],
    verdict: 'ПОДДЕЛКА',
  },
  ep2_diary: {
    id: 'ep2_diary',
    title: 'Дневник Зины',
    art: 'diary',
    mode: 'hotspots',
    hotspots: [
      {
        id: 'bread',
        x: 90,
        y: 60,
        r: 20,
        label: 'Хлеб',
        byteLine: 'Пятьсот граммов? Для детей в это время норма сто двадцать пять. Это три ломтика.',
        clue: 'ep2.U1',
      },
      {
        id: 'water',
        x: 200,
        y: 92,
        r: 20,
        label: 'Вода',
        who: 'maria',
        byteLine: 'Тёплая вода из крана? Водопровод замёрз ещё осенью. Воду носим с Невы.',
        clue: 'ep2.U2',
      },
      {
        id: 'ink',
        x: 130,
        y: 138,
        r: 20,
        label: 'Чернила',
        who: 'zina',
        byteLine: 'Я пишу карандашом, потому что чернила замёрзли. А тут чернила.',
      },
    ],
    verdict: 'ПОДДЕЛКА',
  },
  ep3_pass: {
    id: 'ep3_pass',
    title: 'Пропуск Инспектора',
    art: 'pass',
    mode: 'hotspots',
    hotspots: [
      {
        id: 'date',
        x: 205,
        y: 120,
        r: 22,
        label: 'Дата выдачи',
        byteLine: 'Сегодня двенадцатое. Пропуск из завтра.',
        clue: 'ep3.U1',
      },
    ],
    verdict: 'ПОДДЕЛКА',
  },
  ep3_boots: {
    id: 'ep3_boots',
    title: 'Ботинки Инспектора',
    art: 'boots',
    mode: 'hotspots',
    hotspots: [
      {
        id: 'clean',
        x: 160,
        y: 120,
        r: 26,
        label: 'Ботинки',
        byteLine: 'У всех сапоги в степной пыли, у Инспектора блестят.',
        clue: 'ep3.U2',
      },
    ],
    verdict: 'ПОДДЕЛКА',
  },
};
