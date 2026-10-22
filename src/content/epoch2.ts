import type { GameState } from '../core/State';
import type { Cond, Interactable, Script } from './types';


const flag = (f: string): Cond => ({ flag: f });
const not = (c: Cond): Cond => ({ not: c });
const four: Cond = { and: [{ clue: 'ep2.U1' }, { clue: 'ep2.U2' }, { clue: 'ep2.U3' }, { clue: 'ep2.U4' }] };

export const HALL = { stove: 216, zina: 250, maria: 284, diary: 238, door: 596 } as const;
export const YARD = { block: 520, doorHall: 90 } as const;

export const EPOCH2_SCRIPT: Script = {
  start: [
    { t: 'checkpoint', id: 'e2.start' },
    { t: 'set', effects: { flags: { 'e2.started': true } } },
    { t: 'ambience', name: 'stove' },
    { t: 'ambience', name: 'metronome_on' },
    { t: 'music', track: 'len', fade: 3 },
    { t: 'objective', text: 'Подойди к печке' },
    { t: 'call', name: 'len.arrive' },
    { t: 'morphByte', form: 'collar' },
    { t: 'say', who: 'byte', aside: 'прячется в шарфе', text: 'Здесь я не ворон, а воротник. Не смейся.' },
    { t: 'say', who: 'byte', text: 'Ничего не ешь на виду. Здесь каждая крошка на счету.' },
    { t: 'hintRule', rule: 'e2_stove' },
  ],

  meet: [
    { t: 'hintRule', rule: 'none' },
    { t: 'call', name: 'len.meetCamera' },
    { t: 'say', who: 'maria', text: 'Вы не от управдома? Тогда к печке, пока не окоченели.' },
    { t: 'say', who: 'maria', text: 'Меня зовут Мария Павловна. Я здесь библиотекарь.' },
    { t: 'say', who: 'zina', text: 'Двадцать второе декабря. Какой чудесный день! Получили пятьсот граммов хлеба, на обед суп с мясом.' },
    { t: 'say', who: 'zina', text: 'Умылась тёплой водой из крана. По радио сказали, что блокада снята!' },
    { t: 'say', who: 'maria', aside: 'медленно оборачивается', text: 'Зиночка. Ты вчера писала совсем другое.' },
    { t: 'say', who: 'zina', aside: 'растерянно', text: 'Я не помню, чтобы это писала. Но это мой почерк.' },
    { t: 'say', who: 'byte', mood: 'whisper', aside: 'шёпотом', text: 'Дублёр. Он правит не страницу, а память.' },
    { t: 'set', effects: { flags: { 'e2.met': true } } },
    { t: 'objective', text: 'Осмотри дневник Зины' },
    { t: 'checkpoint', id: 'e2.met' },
    { t: 'hintRule', rule: 'e2_diary' },
  ],

  diary: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    { t: 'loupe', object: 'ep2_diary' },
    { t: 'set', effects: { flags: { 'e2.diaryDone': true } } },
    { t: 'objective', text: 'Поговори с Марией Павловной о посетителе' },
    { t: 'checkpoint', id: 'e2.diary' },
    { t: 'hintRule', rule: 'e2_maria' },
  ],

  maria: [
    { t: 'if', cond: { flag: 'e2.minigameDone' }, then: 'mDone', else: 'mCheck' },
    { t: 'label', name: 'mDone' },
    { t: 'say', who: 'maria', text: 'Погрейтесь у печки. Тепла мало, но оно есть.', new: true },
    { t: 'goto', name: 'mEnd' },
    { t: 'label', name: 'mCheck' },
    { t: 'if', cond: flag('e2.diaryDone'), then: 'mAsk', else: 'mWait' },
    { t: 'label', name: 'mWait' },
    { t: 'say', who: 'maria', text: 'Посмотрите дневник Зиночки. Он у печки.', new: true },
    { t: 'goto', name: 'mEnd' },
    { t: 'label', name: 'mAsk' },
    { t: 'hintRule', rule: 'none' },
    { t: 'choice', options: [{ text: 'Кто сюда заходил?', goto: 'mTell' }] },
    { t: 'label', name: 'mTell' },
    { t: 'say', who: 'maria', text: 'Приходил один, в длинном пальто. Из Бюро памяти, говорит. Третий день ходит по домам, дневники собирает.' },
    { t: 'say', who: 'maria', text: 'Странный. У всех изо рта пар, а у него нет. И карточки, кажется, никогда не показывал.' },
    { t: 'say', who: 'maria', text: 'А ключ от читального зала был только у управдома, у Прохорова.' },
    { t: 'say', who: 'byte', text: 'Запомним: пар и ключ.' },
    { t: 'giveClue', clue: 'ep2.U3' },
    { t: 'checkpoint', id: 'e2.maria' },
    { t: 'say', who: 'maria', text: 'Я вырвала настоящие страницы, когда он пришёл в первый раз. Не знала, что делать. Знала, что нельзя оставлять.' },
    { t: 'say', who: 'maria', text: 'Буквы почти стёрлись. Попробуй проявить карандашом.' },
    { t: 'minigame', id: 'pencil' },
    { t: 'say', who: 'zina', aside: 'тихо', text: 'Это я писала. Это моё.' },
    { t: 'giveClue', clue: 'ep2.U4' },
    { t: 'set', effects: { flags: { 'e2.minigameDone': true } } },
    { t: 'checkpoint', id: 'e2.minigame' },
    { t: 'goto', name: 'yardCheck' },
    { t: 'label', name: 'mEnd' },
  ],
  zinaTalk: [
    { t: 'say', who: 'zina', text: 'Мне кажется, я писала не так. Но рука помнит только это.', new: true },
  ],

  yardCheck: [
    { t: 'if', cond: { and: [four, not(flag('e2.yardOpen'))] }, then: 'yardOpen', else: 'yardWait' },
    { t: 'label', name: 'yardOpen' },
    { t: 'set', effects: { flags: { 'e2.yardOpen': true } } },
    { t: 'say', who: 'byte', text: 'Ключ был только у управдома. Он во дворе.', new: true },
    { t: 'objective', text: 'Допроси управдома во дворе' },
    { t: 'hintRule', rule: 'e2_yard' },
    { t: 'goto', name: 'yardEnd' },
    { t: 'label', name: 'yardWait' },
    { t: 'call', name: 'len.objectiveByStage' },
    { t: 'label', name: 'yardEnd' },
  ],
  yardLocked: [
    { t: 'say', who: 'byte', text: 'Сначала дневник и Мария Павловна. Тогда будет с чем идти к управдому.', new: true },
  ],
  toYard: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'len_yard', params: { from: 'hall' } }],
  toHall: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'len_hall', params: { from: 'yard' } }],

  yardEnter: [
    { t: 'say', who: 'prohorov', aside: 'не отрываясь', text: 'Библиотека! К вечеру подвал опечатываю. Всё лишнее в печь. В убежище сорок человек мёрзнут.' },
    { t: 'say', who: 'byte', text: 'Он что-то знает про ключ. Спроси.' },
    { t: 'objective', text: 'Допроси управдома' },
    { t: 'checkpoint', id: 'e2.yard' },
    { t: 'hintRule', rule: 'e2_interrogate' },
  ],
  interrogate: [
    { t: 'hintRule', rule: 'none' },
    { t: 'interrogate', npc: 'prohorov' },
    { t: 'checkpoint', id: 'e2.interrogation' },
    { t: 'goto', name: 'toBoard' },
  ],
  toBoard: [
    { t: 'objective', text: 'Предъяви Корреспондента' },
    { t: 'board', epoch: 2 },
    { t: 'checkpoint', id: 'e2.board' },
    { t: 'objective', text: null },
    { t: 'fx', name: 'fade', ms: 400 },
    { t: 'scene', to: 'len_hall', params: { stage: 'finale' } },
  ],

  finale: [
    { t: 'call', name: 'len.finaleSetup' },
    {
      t: 'say', who: 'correspondent',
      text: 'Добрый вечер. Я пришёл за дневником. Он слишком ценен, чтобы лежать в сыром подвале.',
    },
    { t: 'say', who: 'correspondent', text: 'Вы очень внимательны. Это редкость.' },
    { t: 'fx', name: 'crumble', target: 'correspondent', ms: 1500 },
    { t: 'fx', name: 'glitch', ms: 260 },
    { t: 'call', name: 'len.dublerAppear' },
    { t: 'say', who: 'dubler', text: 'Давай честно. Ты видела, как она делит хлеб на три раза?' },
    { t: 'say', who: 'dubler', text: 'Зачем ей помнить это? Позволь ей помнить сытый вечер. Ей будет легче.' },
    { t: 'say', who: 'zina', aside: 'тихо', text: 'Это не мой вечер.' },
    { t: 'say', who: 'byte', text: 'Он прав в том, что боль есть. И неправ в том, что с ней делать.' },
    { t: 'checkpoint', id: 'e2.finale' },
    { t: 'epochChoice', epoch: 2 },
    { t: 'checkpoint', id: 'e2.choice' },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoiceResume: [
    { t: 'call', name: 'len.finaleSetup', args: { resume: true } },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoice: [
    { t: 'if', cond: { flag: 'ep2.choice', eq: 'truth' }, then: 'truth', else: 'agree' },
    { t: 'label', name: 'truth' },
    { t: 'call', name: 'len.pagesBack' },
    { t: 'say', who: 'zina', aside: 'берёт карандаш и пишет', text: 'Завтра будет завтра.' },
    { t: 'goto', name: 'toNight' },
    { t: 'label', name: 'agree' },
    { t: 'ambience', name: 'metronome_freeze' },
    { t: 'call', name: 'len.pagesSmooth' },
    { t: 'say', who: 'zina', text: 'Красиво. Но я такого не помню.' },
    { t: 'label', name: 'toNight' },
    { t: 'call', name: 'len.dublerLeave' },
    { t: 'checkpoint', id: 'e2.afterChoice' },
    { t: 'fx', name: 'fade', ms: 600 },
    { t: 'scene', to: 'len_cellar' },
  ],

  night: [
    { t: 'checkpoint', id: 'e2.night' },
    { t: 'music', track: 'len', fade: 2 },
    { t: 'objective', text: 'Реши, что спасти' },
    { t: 'say', who: 'prohorov', aside: 'хрипло', text: 'Ключ у меня. Прости, Мария Павловна. Хлеб тот я съел. Сам не знаю как.' },
    {
      t: 'say', who: 'prohorov',
      text: 'Сани у нас одни. Одно успеем перевезти в убежище, там сухо и печка. Остальное останется в подвале, а он промёрз.',
    },
    { t: 'hintRule', rule: 'e2_night' },
  ],
  botanist: [
    { t: 'say', who: 'botanist', text: 'Это хлеб, который будет через пять лет.' },
  ],
  diaries: [
    { t: 'say', who: 'maria', text: 'Здесь голоса. Не великие, обычные.' },
  ],
  firewood: [
    { t: 'say', who: 'antonina', text: 'В убежище дети. Им сегодня тепло нужнее.' },
  ],
  sled: [
    { t: 'hintRule', rule: 'none' },
    {
      t: 'choice',
      prompt: 'Одно успеем перевезти. Что спасти?',
      options: [
        { text: 'Ящик с семенами', goto: 'saveGrain', effects: { artifact: 'grain' } },
        { text: 'Дневники и письма горожан', goto: 'saveVoices', effects: { artifact: 'voices' } },
        { text: 'Дрова', goto: 'saveFire', effects: { artifact: 'fire' } },
      ],
    },
    { t: 'label', name: 'saveGrain' },
    { t: 'call', name: 'len.load', args: { what: 'grain' } },
    { t: 'goto', name: 'saved' },
    { t: 'label', name: 'saveVoices' },
    { t: 'call', name: 'len.load', args: { what: 'voices' } },
    { t: 'goto', name: 'saved' },
    { t: 'label', name: 'saveFire' },
    { t: 'call', name: 'len.load', args: { what: 'fire' } },
    { t: 'label', name: 'saved' },
    { t: 'say', who: 'byte', aside: 'тихо', text: 'Нельзя спасти всё. Можно спасти что-то. Это тоже память.' },
    { t: 'objective', text: null },
    { t: 'checkpoint', id: 'e2.saved' },
    { t: 'card', id: 2 },
    { t: 'checkpoint', id: 'e2.end' },
    { t: 'scene', to: 'archive_hall', params: { hubReturn: 2 } },
  ],
};


export const HALL_INTERACTABLES: Interactable[] = [
  {
    id: 'diary', x: HALL.diary, y: 232, w: 22, h: 22, prompt: 'Осмотреть дневник', icon: 'eye',
    visibleIf: { and: [flag('e2.met'), not(flag('e2.diaryDone'))] }, onUse: 'epoch2#diary', once: true,
  },
  { id: 'maria', x: HALL.maria, y: 226, w: 24, h: 40, prompt: 'Поговорить с Марией Павловной', icon: 'talk', onUse: 'epoch2#maria' },
  { id: 'zina', x: HALL.zina, y: 224, w: 22, h: 34, prompt: 'Поговорить с Зиной', icon: 'talk', visibleIf: flag('e2.met'), onUse: 'epoch2#zinaTalk' },
  {
    id: 'door_yard', x: HALL.door, y: 142, w: 40, h: 74, prompt: 'Выйти во двор', icon: 'door',
    visibleIf: not(flag('stage.e2finale')),
    enabledIf: flag('e2.yardOpen'),
    disabledHint: 'Сначала дневник и Мария Павловна. Тогда будет с чем идти к управдому.',
    onUse: 'epoch2#toYard',
  },
];

export const YARD_INTERACTABLES: Interactable[] = [
  { id: 'door_hall', x: YARD.doorHall, y: 156, w: 44, h: 70, prompt: 'Вернуться в читальный зал', icon: 'door', onUse: 'epoch2#toHall' },
  { id: 'prohorov', x: YARD.block + 24, y: 236, w: 26, h: 40, prompt: 'Допросить управдома', icon: 'talk', onUse: 'epoch2#interrogate' },
];

export const CELLAR_INTERACTABLES: Interactable[] = [
  { id: 'botanist', x: 200, y: 226, w: 28, h: 40, prompt: 'Выслушать Семёна Аркадьевича', icon: 'talk', onUse: 'epoch2#botanist' },
  { id: 'diaries', x: 300, y: 226, w: 28, h: 40, prompt: 'Выслушать Марию Павловну', icon: 'talk', onUse: 'epoch2#diaries' },
  { id: 'firewood', x: 500, y: 226, w: 28, h: 40, prompt: 'Выслушать Антонину', icon: 'talk', onUse: 'epoch2#firewood' },
  { id: 'sled', x: 400, y: 262, w: 60, h: 30, prompt: 'Погрузить на сани', icon: 'hand', onUse: 'epoch2#sled' },
];

export const HALL_TRIGGERS = [
  { id: 'e2.meet', x0: 0, x1: 330, cond: { and: [flag('e2.started'), not(flag('e2.met'))] } as Cond, onEnter: 'epoch2#meet' },
];
export const YARD_TRIGGERS = [
  { id: 'e2.yardEnter', x0: 0, x1: 800, cond: flag('e2.yardOpen'), onEnter: 'epoch2#yardEnter' },
];
export const CELLAR_TRIGGERS = [{ id: 'e2.night', x0: 0, x1: 640, onEnter: 'epoch2#night' }];

export function e2Stage(s: GameState): { objective: string | null; rule: string } {
  const f = s.flags;
  if (!f['e2.started']) return { objective: null, rule: 'none' };
  if (!f['e2.met']) return { objective: 'Подойди к печке', rule: 'e2_stove' };
  if (!f['e2.diaryDone']) return { objective: 'Осмотри дневник Зины', rule: 'e2_diary' };
  if (!f['e2.minigameDone']) return { objective: 'Поговори с Марией Павловной о посетителе', rule: 'e2_maria' };
  if (f['e2.yardOpen']) return { objective: 'Допроси управдома во дворе', rule: 'e2_yard' };
  return { objective: null, rule: 'none' };
}
