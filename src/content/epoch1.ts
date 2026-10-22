import type { GameState } from '../core/State';
import type { Cond, Interactable, Script } from './types';


export const SQUARE = { house: 293, bakery: 867, workshop: 1120, well: 640, stall: 442, doorY: 184 } as const;

const allFive: Cond = {
  and: [{ clue: 'ep1.U1' }, { clue: 'ep1.U2' }, { clue: 'ep1.U3' }, { clue: 'ep1.U4' }, { clue: 'ep1.U5' }],
};

export const EPOCH1_SCRIPT: Script = {
  start: [
    { t: 'checkpoint', id: 'e1.start' },
    { t: 'set', effects: { flags: { 'e1.started': true } } },
    { t: 'ambience', name: 'wind_snow' },
    { t: 'music', track: 'nov', fade: 2.5 },
    { t: 'objective', text: 'Осмотрись на площади' },
    { t: 'call', name: 'nov.arrive' },
    { t: 'morphByte', form: 'raven' },
    {
      t: 'say', who: 'byte', aside: 'превращается в ворона и садится на плечо',
      text: 'Тихо. Здесь я птица, а не дрон.',
    },
    { t: 'say', who: 'byte', text: 'И не говори никому, что ты из будущего. Не поймут.' },
    { t: 'call', name: 'nov.onfimRuns' },
    { t: 'say', who: 'onfim', text: 'Помоги! Моя грамота пропала! Я целую седмицу рисовал всадника!' },
    { t: 'say', who: 'onfim', text: 'А в сундуке теперь чужая, красивая, будто боярин писал. Все говорят, что я вру!' },
    {
      t: 'choice',
      options: [
        { text: 'Покажи, что осталось', goto: 'soft' },
        { text: 'Расскажи по порядку и не плачь', goto: 'strict' },
      ],
    },
    { t: 'label', name: 'soft' },
    { t: 'set', effects: { flags: { 'ep1.tone': 'soft' } } },
    { t: 'say', who: 'onfim', aside: 'шмыгает носом', text: 'Вот, только трубка. Идём, покажу сундук.' },
    { t: 'goto', name: 'afterTone' },
    { t: 'label', name: 'strict' },
    { t: 'set', effects: { flags: { 'ep1.tone': 'strict' } } },
    { t: 'say', who: 'onfim', aside: 'быстро, сухо', text: 'Утром была моя. К обеду лежала чужая. Сундук дома. Идём.' },
    { t: 'label', name: 'afterTone' },
    { t: 'objective', text: 'Иди за Онфимом' },
    { t: 'set', effects: { flags: { 'e1.onfimMet': true } } },
    { t: 'call', name: 'nov.guestSpawn' },
    { t: 'call', name: 'nov.onfimToHouse' },
    { t: 'checkpoint', id: 'e1.met' },
    { t: 'hintRule', rule: 'e1_house' },
  ],

  guestSeen: [
    { t: 'say', who: 'byte', mood: 'whisper', aside: 'шёпотом', text: 'Видишь того, у колодца? Запомни его.' },
  ],
  guestLook: [
    { t: 'say', who: 'byte', mood: 'whisper', text: 'Смотри на снег под ним. Следов нет.', new: true },
  ],

  toHouse: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_house', params: { from: 'square' } }],
  toBakery: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_bakery', params: { from: 'square' } }],
  toWorkshop: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_workshop', params: { from: 'square' } }],
  houseToSquare: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_square', params: { from: 'house' } }],
  bakeryToSquare: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_square', params: { from: 'bakery' } }],
  workshopToSquare: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'nov_square', params: { from: 'workshop' } }],

  chest: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    { t: 'loupe', object: 'ep1_chest' },
    { t: 'say', who: 'onfim', text: 'Я так писать не умею! Я пишу, как слышу!' },
    { t: 'set', effects: { flags: { 'e1.chestDone': true } } },
    { t: 'checkpoint', id: 'e1.chest' },
    { t: 'goto', name: 'workshopCheck' },
  ],

  bakeryEnter: [
    { t: 'say', who: 'nastasya', text: 'Ты та, что ходит с Онфимом? Нынче все про него говорят.' },
    { t: 'say', who: 'nastasya', text: 'Слухи я зря не отдаю. Помоги: дрова у двери, занеси к печи.' },
    { t: 'set', effects: { flags: { 'e1.bakeryAsked': true } } },
    { t: 'objective', text: 'Возьми дрова у двери' },
    { t: 'hintRule', rule: 'e1_logs' },
  ],
  takeLogs: [
    { t: 'call', name: 'nov.takeLogs' },
    { t: 'set', effects: { flags: { 'e1.logs': true } } },
    { t: 'objective', text: 'Занеси дрова к печи' },
    { t: 'hintRule', rule: 'e1_oven' },
  ],
  nastasyaTalk: [
    { t: 'if', cond: { flag: 'e1.bakeryDone' }, then: 'nDone', else: 'nAsk' },
    { t: 'label', name: 'nDone' },
    { t: 'say', who: 'nastasya', text: 'Ступай, милая, мне хлеб печь.', new: true },
    { t: 'goto', name: 'nEnd' },
    { t: 'label', name: 'nAsk' },
    { t: 'say', who: 'nastasya', text: 'Дрова у двери, милая. Занеси к печи — тогда и поговорим.', new: true },
    { t: 'label', name: 'nEnd' },
  ],
  ovenLogs: [
    { t: 'hintRule', rule: 'none' },
    { t: 'call', name: 'nov.putLogs' },
    { t: 'say', who: 'nastasya', text: 'Ладно, слушай. Позавчера ночью вышла я за водой. Вижу: у мастерской писца стоит тот, в чёрном.' },
    { t: 'say', who: 'nastasya', text: 'Снег свежий, а следов от него нет. Я перекрестилась и убежала.' },
    { t: 'say', who: 'nastasya', text: 'А ещё в окне у писца до утра горел свет, хоть он на ночь молится в церкви.' },
    { t: 'say', who: 'byte', text: 'Люди не парят над снегом. Люди оставляют следы.' },
    { t: 'giveClue', clue: 'ep1.U3' },
    { t: 'giveClue', clue: 'ep1.U4' },
    { t: 'set', effects: { flags: { 'e1.bakeryDone': true } } },
    { t: 'objective', text: 'Выйди на площадь' },
    { t: 'checkpoint', id: 'e1.bakery' },
    { t: 'goto', name: 'workshopCheck' },
  ],

  guestAdvice: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    { t: 'call', name: 'nov.guestApproach' },
    { t: 'say', who: 'guest', text: 'Добрый день, странница. Я невольно услышал вашу беду.' },
    {
      t: 'say', who: 'guest',
      text: 'Позвольте совет. Присмотритесь к торговцу с левого края торга. Человек жадный, у него всегда много грамот.',
    },
    {
      t: 'choice',
      options: [
        { text: 'Спасибо, я проверю', goto: 'believe' },
        { text: 'Почему вы так быстро подсказываете?', goto: 'doubt' },
      ],
    },
    { t: 'label', name: 'believe' },
    { t: 'set', effects: { flags: { 'ep1.believedGuest': true } } },
    { t: 'call', name: 'nov.guestReturn' },
    { t: 'objective', text: 'Проверь лавку торговца' },
    { t: 'hintRule', rule: 'e1_stall' },
    { t: 'goto', name: 'guestEnd' },
    { t: 'label', name: 'doubt' },
    { t: 'say', who: 'guest', aside: 'мягко', text: 'Я лишь хочу помочь. Простите, пора идти.' },
    { t: 'call', name: 'nov.guestReturn' },
    { t: 'say', who: 'byte', text: 'Слишком быстро подсказывает. И следов у него нет. Это он, я уверен.' },
    { t: 'goto', name: 'afterGuest' },
    { t: 'label', name: 'guestEnd' },
  ],
  stall: [
    { t: 'hintRule', rule: 'none' },
    { t: 'sfx', name: 'door' },
    { t: 'giveClue', clue: 'ep1.F1' },
    { t: 'say', who: 'byte', text: 'Лавка пуста. Нас отправили по ложному следу.' },
    { t: 'goto', name: 'afterGuest' },
  ],
  afterGuest: [
    { t: 'set', effects: { flags: { 'e1.guestDone': true } } },
    { t: 'call', name: 'nov.onfimAtDoor' },
    { t: 'objective', text: 'Вернись к Онфиму' },
    { t: 'checkpoint', id: 'e1.guest' },
    { t: 'hintRule', rule: 'e1_onfim' },
  ],

  onfimTalk: [
    { t: 'hintRule', rule: 'none' },
    {
      t: 'say', who: 'onfim',
      text: 'Я вспомнил! Когда я уходил, у мастерской стоял дядя. Сказал: «Какой красивый всадник». А потом как будто растаял.',
    },
    { t: 'say', who: 'onfim', text: 'И ещё. Я нашёл вот это за домом. Обрывки. Это моя настоящая грамота!' },
    { t: 'minigame', id: 'birch' },
    { t: 'say', who: 'onfim', text: 'Мой всадник! Он косой, зато мой!' },
    { t: 'giveClue', clue: 'ep1.U5' },
    { t: 'set', effects: { flags: { 'e1.minigameDone': true } } },
    { t: 'checkpoint', id: 'e1.minigame' },
    { t: 'goto', name: 'workshopCheck' },
  ],

  workshopCheck: [
    { t: 'if', cond: { and: [allFive, { not: { flag: 'e1.workshopOpen' } }] }, then: 'workshopOpen', else: 'workshopWait' },
    { t: 'label', name: 'workshopOpen' },
    { t: 'set', effects: { flags: { 'e1.workshopOpen': true } } },
    { t: 'call', name: 'nov.workshopLight' },
    { t: 'say', who: 'byte', text: 'Мастерская открылась. Игнат что-то скрывает.', new: true },
    { t: 'objective', text: 'Допроси Игната в мастерской' },
    { t: 'checkpoint', id: 'e1.workshop' },
    { t: 'hintRule', rule: 'e1_workshop' },
    { t: 'goto', name: 'workshopEnd' },
    { t: 'label', name: 'workshopWait' },
    { t: 'call', name: 'nov.objectiveByStage' },
    { t: 'label', name: 'workshopEnd' },
  ],
  workshopLocked: [
    { t: 'say', who: 'byte', text: 'Дверь заперта изнутри. Нужны улики, а не кулаки.', new: true },
  ],

  ignatEnter: [
    { t: 'say', who: 'ignat', aside: 'не поднимая головы', text: 'Грамоты, береста… Ступай, девочка, у меня работа.' },
    { t: 'say', who: 'byte', text: 'Он что-то скрывает. Задай ему вопросы. И держи наготове улики.' },
    { t: 'objective', text: 'Допроси Игната' },
    { t: 'checkpoint', id: 'e1.workshop' },
    { t: 'hintRule', rule: 'e1_interrogate' },
  ],
  interrogate: [
    { t: 'hintRule', rule: 'none' },
    { t: 'interrogate', npc: 'ignat' },
    { t: 'checkpoint', id: 'e1.interrogation' },
    { t: 'goto', name: 'toBoard' },
  ],
  toBoard: [
    { t: 'objective', text: 'Предъяви Гостя' },
    { t: 'board', epoch: 1 },
    { t: 'checkpoint', id: 'e1.board' },
    { t: 'objective', text: null },
    { t: 'fx', name: 'fade', ms: 400 },
    { t: 'scene', to: 'nov_square', params: { stage: 'finale' } },
  ],

  finale: [
    { t: 'call', name: 'nov.finaleSetup' },
    { t: 'say', who: 'guest', aside: 'улыбается', text: 'Вы очень внимательны. Это редкость.' },
    { t: 'fx', name: 'crumble', target: 'guest', ms: 1400 },
    { t: 'fx', name: 'glitch', ms: 300 },
    { t: 'call', name: 'nov.dublerAppear' },
    { t: 'say', who: 'dubler', text: 'Здравствуй. Мы ведь знакомы.' },
    {
      t: 'say', who: 'dubler',
      text: 'Этот мальчик написал: «Ты глупый». Нарисовал нелепого коня. Что прекрасного в детских ошибках?',
    },
    { t: 'say', who: 'dubler', text: 'Позволь мне сделать его слова достойными. Ему будет легче.' },
    { t: 'say', who: 'byte', aside: 'тихо', text: 'Он не врёт. Он правда верит, что это добро.' },
    { t: 'checkpoint', id: 'e1.finale' },
    { t: 'epochChoice', epoch: 1 },
    { t: 'checkpoint', id: 'e1.choice' },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoiceResume: [
    { t: 'call', name: 'nov.finaleSetup', args: { resume: true } },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoice: [
    { t: 'if', cond: { flag: 'ep1.choice', eq: 'truth' }, then: 'truth', else: 'agree' },
    { t: 'label', name: 'truth' },
    { t: 'say', who: 'onfim', aside: 'смеётся сквозь слёзы', text: 'Это мой всадник! Косой, но мой!' },
    { t: 'say', who: 'dubler', aside: 'отступая', text: 'Ты ещё поймёшь, как тяжела правда.' },
    { t: 'call', name: 'nov.dublerLeave' },
    { t: 'goto', name: 'end' },
    { t: 'label', name: 'agree' },
    { t: 'call', name: 'nov.beautify' },
    { t: 'say', who: 'onfim', aside: 'тихо', text: 'Это не я писал.' },
    { t: 'say', who: 'dubler', text: 'Видишь? Так лучше.' },
    { t: 'label', name: 'end' },
    { t: 'card', id: 1 },
    { t: 'checkpoint', id: 'e1.end' },
    { t: 'scene', to: 'archive_hall', params: { hubReturn: 1 } },
  ],
};


const stateFlag = (flag: string): Cond => ({ flag });
const not = (c: Cond): Cond => ({ not: c });

export const SQUARE_INTERACTABLES: Interactable[] = [
  { id: 'door_house', x: SQUARE.house, y: SQUARE.doorY, w: 30, h: 44, prompt: 'Войти в дом Онфима', icon: 'door', onUse: 'epoch1#toHouse' },
  { id: 'door_bakery', x: SQUARE.bakery, y: SQUARE.doorY, w: 30, h: 44, prompt: 'Войти в пекарню', icon: 'door', onUse: 'epoch1#toBakery' },
  {
    id: 'door_workshop', x: SQUARE.workshop, y: SQUARE.doorY, w: 30, h: 44, prompt: 'Войти в мастерскую', icon: 'door',
    enabledIf: stateFlag('e1.workshopOpen'), disabledHint: 'Дверь заперта изнутри. Нужны улики, а не кулаки.',
    onUse: 'epoch1#toWorkshop',
  },
  {
    id: 'stall', x: SQUARE.stall, y: 254, w: 70, h: 50, prompt: 'Проверить лавку', icon: 'eye',
    visibleIf: { and: [stateFlag('ep1.believedGuest'), not(stateFlag('e1.guestDone'))] }, onUse: 'epoch1#stall', once: true,
  },
  {
    id: 'onfim', x: SQUARE.house + 54, y: 214, w: 22, h: 36, prompt: 'Поговорить с Онфимом', icon: 'talk',
    visibleIf: { and: [stateFlag('e1.guestDone'), not(stateFlag('e1.minigameDone'))] }, onUse: 'epoch1#onfimTalk', once: true,
  },
  {
    id: 'guest_look', x: SQUARE.well + 38, y: 224, w: 24, h: 40, prompt: 'Присмотреться к Гостю', icon: 'eye',
    visibleIf: { and: [stateFlag('e1.onfimMet'), not(stateFlag('e1.guestDone'))] }, onUse: 'epoch1#guestLook',
  },
];

export const HOUSE_INTERACTABLES: Interactable[] = [
  { id: 'door_out', x: 320, y: 330, w: 44, h: 24, prompt: 'Выйти на площадь', icon: 'door', onUse: 'epoch1#houseToSquare' },
  { id: 'chest', x: 446, y: 208, w: 40, h: 32, prompt: 'Осмотреть сундук', icon: 'eye', onUse: 'epoch1#chest' },
];

export const BAKERY_INTERACTABLES: Interactable[] = [
  { id: 'door_out', x: 320, y: 330, w: 44, h: 24, prompt: 'Выйти на площадь', icon: 'door', onUse: 'epoch1#bakeryToSquare' },
  {
    id: 'logs', x: 186, y: 300, w: 36, h: 24, prompt: 'Взять дрова', icon: 'hand',
    visibleIf: { and: [stateFlag('e1.bakeryAsked'), not(stateFlag('e1.logs')), not(stateFlag('e1.bakeryDone'))] },
    onUse: 'epoch1#takeLogs',
  },
  {
    id: 'oven', x: 486, y: 150, w: 80, h: 70, prompt: 'Положить дрова в печь', icon: 'hand',
    visibleIf: not(stateFlag('e1.bakeryDone')), enabledIf: stateFlag('e1.logs'), disabledHint: 'Печь ждёт дров.',
    onUse: 'epoch1#ovenLogs',
  },
  { id: 'nastasya', x: 420, y: 214, w: 24, h: 40, prompt: 'Поговорить с Настасьей', icon: 'talk', onUse: 'epoch1#nastasyaTalk' },
];

export const WORKSHOP_INTERACTABLES: Interactable[] = [
  { id: 'door_out', x: 320, y: 330, w: 44, h: 24, prompt: 'Выйти на площадь', icon: 'door', onUse: 'epoch1#workshopToSquare' },
  { id: 'ignat', x: 420, y: 202, w: 26, h: 40, prompt: 'Допросить Игната', icon: 'talk', onUse: 'epoch1#interrogate' },
];

export const SQUARE_TRIGGERS = [
  { id: 'e1.guestSeen', x0: 510, x1: 830, cond: stateFlag('e1.onfimMet'), onEnter: 'epoch1#guestSeen' },
  {
    id: 'e1.guestAdvice', x0: 0, x1: 1280,
    cond: { and: [{ clue: 'ep1.U3' }, { clue: 'ep1.U4' }, not(stateFlag('e1.guestDone')), not(stateFlag('ep1.believedGuest'))] } as Cond,
    onEnter: 'epoch1#guestAdvice',
  },
];
export const BAKERY_TRIGGERS = [{ id: 'e1.bakeryEnter', x0: 0, x1: 640, onEnter: 'epoch1#bakeryEnter' }];
export const WORKSHOP_TRIGGERS = [
  { id: 'e1.ignatEnter', x0: 0, x1: 640, cond: stateFlag('e1.workshopOpen'), onEnter: 'epoch1#ignatEnter' },
];

export function e1Stage(s: GameState): { objective: string | null; rule: string } {
  const f = s.flags;
  if (!f['e1.started']) return { objective: null, rule: 'none' };
  if (f['e1.minigameDone'] && f['e1.workshopOpen']) return { objective: 'Допроси Игната в мастерской', rule: 'e1_workshop' };
  if (f['e1.guestDone'] && !f['e1.minigameDone']) return { objective: 'Вернись к Онфиму', rule: 'e1_onfim' };
  if (f['ep1.believedGuest'] && !f['e1.guestDone']) return { objective: 'Проверь лавку торговца', rule: 'e1_stall' };
  if (f['e1.bakeryDone'] && !f['e1.guestDone']) return { objective: 'Выйди на площадь', rule: 'none' };
  if (!f['e1.chestDone'] && !f['e1.bakeryAsked']) return { objective: 'Иди за Онфимом', rule: 'e1_house' };
  if (f['e1.logs'] && !f['e1.bakeryDone']) return { objective: 'Занеси дрова к печи', rule: 'e1_oven' };
  if (f['e1.bakeryAsked'] && !f['e1.bakeryDone']) return { objective: 'Возьми дрова у двери', rule: 'e1_logs' };
  if (!f['e1.chestDone']) return { objective: 'Осмотри сундук Онфима', rule: 'e1_chest' };
  if (!f['e1.bakeryDone']) return { objective: 'Расспроси Настасью (пекарня)', rule: 'e1_bakery' };
  return { objective: null, rule: 'none' };
}

