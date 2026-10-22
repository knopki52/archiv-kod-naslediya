import type { GameState } from '../core/State';
import type { Cond, Interactable, Script } from './types';


const flag = (f: string): Cond => ({ flag: f });
const not = (c: Cond): Cond => ({ not: c });
const four: Cond = { and: [{ clue: 'ep3.U1' }, { clue: 'ep3.U2' }, { clue: 'ep3.U3' }, { clue: 'ep3.U4' }] };

export const BUNKER = { comms: 96, pad: 544, timofey: 470, inspector: 334, galya: 250 } as const;
export const PAD = { bunker: 103, ivan: 430, rocket: 980, groundY: 300 } as const;
export const COMMS = { door: 544, galya: 200, panel: 330 } as const;
export const PAD_W = 1280;

export const EPOCH3_SCRIPT: Script = {
  enter: [{ t: 'fx', name: 'fade', ms: 120 }, { t: 'scene', to: 'bk_pad', params: { stage: 'intro' } }],

  start: [
    { t: 'checkpoint', id: 'e3.start' },
    { t: 'set', effects: { flags: { 'e3.started': true } } },
    { t: 'ambience', name: 'steppe' },
    { t: 'music', track: 'baik', fade: 3 },
    { t: 'objective', text: 'Войди в бункер' },
    { t: 'call', name: 'bk.arrive' },
    { t: 'morphByte', form: 'kestrel' },
    {
      t: 'say', who: 'byte', aside: 'превращается в маленького кречета',
      text: 'Не смотри вдоль горизонта слишком долго. Там люди, которых мы не трогаем.',
    },
    { t: 'say', who: 'byte', text: 'Наша задача простая: сохранить правду об этом утре.' },
    { t: 'hintRule', rule: 'e3_enter' },
  ],

  meet: [
    { t: 'hintRule', rule: 'none' },
    { t: 'say', who: 'timofey', text: 'Новенькая из комиссии? Ступай к столу. Журнал здесь, пиши всё, что видишь.' },
    { t: 'say', who: 'timofey', text: 'Если скажут не писать, всё равно пиши.' },
    { t: 'call', name: 'bk.galyaEnters' },
    { t: 'say', who: 'galya', text: 'Я Галя, связь. Если что с каналом, ищи меня.' },
    { t: 'say', who: 'galya', text: 'И не верь тем, кто говорит, что всё идеально. Идеально не бывает.' },
    { t: 'call', name: 'bk.inspectorEnters' },
    { t: 'say', who: 'inspector', text: 'Добрый день. Я из комиссии по оформлению отчёта.' },
    { t: 'say', who: 'inspector', text: 'Хочу сразу успокоить: протокол уже подготовлен. Ничего записывать не придётся.' },
    { t: 'say', who: 'timofey', aside: 'косо', text: 'Протокол до старта?' },
    { t: 'say', who: 'inspector', aside: 'мягко', text: 'Опыт, Тимофей Иванович. Вы скоро поймёте.' },
    { t: 'say', who: 'byte', mood: 'whisper', aside: 'шёпотом', text: 'Он знает слишком много. Запомни его пропуск.' },
    { t: 'set', effects: { flags: { 'e3.met': true } } },
    { t: 'objective', text: 'Осмотри Инспектора' },
    { t: 'checkpoint', id: 'e3.met' },
    { t: 'hintRule', rule: 'e3_inspect' },
  ],
  timofeyTalk: [
    { t: 'say', who: 'timofey', text: 'Если скажут не писать, всё равно пиши.' },
  ],

  inspect: [
    { t: 'hintRule', rule: 'none' },
    {
      t: 'choice',
      options: [
        { text: 'Пропуск', goto: 'goPass', showIf: not(flag('e3.passDone')) },
        { text: 'Ботинки', goto: 'goBoots', showIf: not(flag('e3.bootsDone')) },
      ],
    },
    { t: 'label', name: 'goPass' },
    { t: 'loupe', object: 'ep3_pass' },
    { t: 'set', effects: { flags: { 'e3.passDone': true } } },
    { t: 'goto', name: 'afterInspect' },
    { t: 'label', name: 'goBoots' },
    { t: 'loupe', object: 'ep3_boots' },
    { t: 'say', who: 'galya', mood: 'whisper', aside: 'шёпотом', text: 'Он ни разу не выходил на площадку. Там пыль по колено.' },
    { t: 'set', effects: { flags: { 'e3.bootsDone': true } } },
    { t: 'label', name: 'afterInspect' },
    { t: 'if', cond: { and: [flag('e3.passDone'), flag('e3.bootsDone')] }, then: 'inspectDone', else: 'inspectMore' },
    { t: 'label', name: 'inspectMore' },
    { t: 'call', name: 'bk.objectiveByStage' },
    { t: 'goto', name: 'inspectEnd' },
    { t: 'label', name: 'inspectDone' },
    { t: 'set', effects: { flags: { 'e3.inspectDone': true } } },
    { t: 'checkpoint', id: 'e3.inspect' },
    { t: 'call', name: 'bk.objectiveByStage' },
    { t: 'label', name: 'inspectEnd' },
  ],

  toBunker: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'bk_bunker', params: { from: 'pad' } }],
  toBunkerFromComms: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'bk_bunker', params: { from: 'comms' } }],
  toPad: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'bk_pad', params: { from: 'bunker' } }],
  toComms: [{ t: 'fx', name: 'fade', ms: 250 }, { t: 'scene', to: 'bk_comms', params: { from: 'bunker' } }],

  ivan: [
    { t: 'if', cond: flag('e3.padDone'), then: 'ivanDone', else: 'padTalk' },
    { t: 'label', name: 'ivanDone' },
    { t: 'say', who: 'ivan', text: 'Скажут тебе, что всё прошло гладко, не верь.' },
    { t: 'goto', name: 'ivanEnd' },
    { t: 'label', name: 'padTalk' },
    { t: 'hintRule', rule: 'none' },
    { t: 'say', who: 'ivan', text: 'Горит «Люк закрыт» или нет? Утром не горел. Так не должно быть.' },
    { t: 'say', who: 'ivan', text: 'Пришлось люк закрывать заново. Крест-накрест, пара напротив пары, иначе перекосит.' },
    { t: 'say', who: 'ivan', text: 'Скажут тебе, что всё прошло гладко, не верь.' },
    { t: 'giveClue', clue: 'ep3.U3' },
    { t: 'set', effects: { flags: { 'e3.padDone': true } } },
    { t: 'checkpoint', id: 'e3.pad' },
    { t: 'goto', name: 'afterClues' },
    { t: 'label', name: 'ivanEnd' },
  ],

  galya: [
    { t: 'if', cond: flag('e3.minigameDone'), then: 'gDone', else: 'gTask' },
    { t: 'label', name: 'gDone' },
    { t: 'say', who: 'galya', text: 'Связь чистая. Без неё нас бы не пустили на старт.', new: true },
    { t: 'goto', name: 'gEnd' },
    { t: 'label', name: 'gTask' },
    { t: 'hintRule', rule: 'none' },
    { t: 'say', who: 'galya', text: 'Звук шумит. Пульт пересобери, у меня руки заняты.' },
    { t: 'minigame', id: 'panel' },
    { t: 'say', who: 'galya', aside: 'когда сигнал пошёл', text: 'Слышно! Спасибо. Без связи нас бы не пустили на старт.' },
    { t: 'giveClue', clue: 'ep3.U4' },
    { t: 'set', effects: { flags: { 'e3.minigameDone': true } } },
    { t: 'checkpoint', id: 'e3.minigame' },
    { t: 'goto', name: 'afterClues' },
    { t: 'label', name: 'gEnd' },
  ],

  afterClues: [
    { t: 'if', cond: { and: [four, not(flag('e3.allClues'))] }, then: 'allOpen', else: 'allWait' },
    { t: 'label', name: 'allOpen' },
    { t: 'set', effects: { flags: { 'e3.allClues': true } } },
    { t: 'say', who: 'byte', text: 'Пропуск, сапоги, люк и связь. Пора поговорить с Инспектором.', new: true },
    { t: 'call', name: 'bk.objectiveByStage' },
    { t: 'goto', name: 'allEnd' },
    { t: 'label', name: 'allWait' },
    { t: 'call', name: 'bk.objectiveByStage' },
    { t: 'label', name: 'allEnd' },
  ],

  interrogate: [
    { t: 'hintRule', rule: 'none' },
    { t: 'say', who: 'timofey', aside: 'тихо', text: 'Он сказал, страх сорвёт старт. Что мир ждёт идеала. Может, он прав…' },
    { t: 'say', who: 'byte', text: 'Не дай ему подписать. Задавай вопросы.' },
    { t: 'interrogate', npc: 'inspector' },
    { t: 'checkpoint', id: 'e3.interrogation' },
    { t: 'goto', name: 'toBoard' },
  ],

  toBoard: [
    { t: 'objective', text: 'Предъяви Инспектора' },
    { t: 'board', epoch: 3 },
    { t: 'checkpoint', id: 'e3.board' },
    { t: 'objective', text: null },
    { t: 'fx', name: 'fade', ms: 400 },
    { t: 'scene', to: 'bk_bunker', params: { stage: 'finale' } },
  ],

  finale: [
    { t: 'call', name: 'bk.finaleSetup' },
    { t: 'call', name: 'bk.inspectorFade' },
    { t: 'fx', name: 'crumble', target: 'inspector', ms: 1500 },
    { t: 'fx', name: 'glitch', ms: 260 },
    { t: 'call', name: 'bk.dublerAppear' },
    { t: 'say', who: 'dubler', text: 'Зачем людям знать, что в этот день могли возникнуть сомнения?' },
    { t: 'say', who: 'dubler', text: 'Победа выглядит достойнее без сомнений. Дай им историю без страха.' },
    { t: 'say', who: 'byte', aside: 'тихо', text: 'Он снова отвечает на настоящий вопрос неправильным способом.' },
    { t: 'say', who: 'galya', aside: 'себе', text: 'Мы не были бесстрашными. Мы были уверенными, потому что проверяли.' },
    { t: 'checkpoint', id: 'e3.finale' },
    { t: 'epochChoice', epoch: 3 },
    { t: 'checkpoint', id: 'e3.choice' },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoiceResume: [
    { t: 'call', name: 'bk.finaleSetup', args: { resume: true } },
    { t: 'goto', name: 'afterChoice' },
  ],
  afterChoice: [
    { t: 'call', name: 'bk.dublerLeave' },
    { t: 'if', cond: { flag: 'ep3.choice', eq: 'truth' }, then: 'truth', else: 'agree' },
    { t: 'label', name: 'truth' },
    { t: 'call', name: 'bk.journalWrite' },
    { t: 'say', who: 'timofey', text: 'Пиши всё. Как было.' },
    { t: 'goto', name: 'toLaunch' },
    { t: 'label', name: 'agree' },
    { t: 'call', name: 'bk.journalClose' },
    { t: 'say', who: 'narrator', text: 'Тимофей молча закрывает журнал.', new: true },
    { t: 'label', name: 'toLaunch' },
    { t: 'checkpoint', id: 'e3.afterChoice' },
    { t: 'fx', name: 'fade', ms: 700 },
    { t: 'scene', to: 'bk_pad', params: { stage: 'launch' } },
  ],

  launch: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    { t: 'call', name: 'bk.launch' },
    { t: 'card', id: 3 },
    { t: 'checkpoint', id: 'e3.end' },
    { t: 'scene', to: 'archive_hall', params: { hubReturn: 3 } },
  ],
};


export const PAD_INTERACTABLES: Interactable[] = [
  {
    id: 'door_bunker', x: PAD.bunker, y: 264, w: 40, h: 40, prompt: 'Войти в бункер', icon: 'door',
    visibleIf: not(flag('stage.e3launch')), onUse: 'epoch3#toBunker',
  },
  {
    id: 'ivan', x: PAD.ivan, y: 270, w: 26, h: 40, prompt: 'Поговорить с Иваном Саввичем', icon: 'talk',
    visibleIf: { and: [flag('e3.met'), not(flag('stage.e3launch'))] }, onUse: 'epoch3#ivan',
  },
];

export const BUNKER_INTERACTABLES: Interactable[] = [
  {
    id: 'door_comms', x: BUNKER.comms, y: 146, w: 40, h: 70, prompt: 'Пойти в пункт связи', icon: 'door',
    visibleIf: { and: [flag('e3.met'), not(flag('stage.e3finale'))] }, onUse: 'epoch3#toComms',
  },
  {
    id: 'door_pad', x: BUNKER.pad, y: 146, w: 40, h: 70, prompt: 'Выйти на площадку', icon: 'door',
    visibleIf: { and: [flag('e3.met'), not(flag('stage.e3finale'))] }, onUse: 'epoch3#toPad',
  },
  {
    id: 'inspector_look', x: BUNKER.inspector, y: 236, w: 26, h: 44, prompt: 'Осмотреть Инспектора', icon: 'eye',
    visibleIf: { and: [flag('e3.met'), not(flag('e3.inspectDone')), not(flag('stage.e3finale'))] }, onUse: 'epoch3#inspect',
  },
  {
    id: 'inspector_talk', x: BUNKER.inspector, y: 236, w: 26, h: 44, prompt: 'Поговорить с Инспектором', icon: 'talk',
    visibleIf: { and: [flag('e3.inspectDone'), not(flag('stage.e3finale'))] },
    enabledIf: four, disabledHint: 'Мало улик. Нужны пропуск, ботинки, люк и связь.',
    onUse: 'epoch3#interrogate',
  },
  {
    id: 'timofey', x: BUNKER.timofey, y: 232, w: 26, h: 40, prompt: 'Поговорить с Тимофеем', icon: 'talk',
    visibleIf: { and: [flag('e3.met'), not(flag('stage.e3finale'))] }, onUse: 'epoch3#timofeyTalk',
  },
];

export const COMMS_INTERACTABLES: Interactable[] = [
  { id: 'door_bunker', x: COMMS.door, y: 146, w: 40, h: 70, prompt: 'Вернуться в бункер', icon: 'door', onUse: 'epoch3#toBunkerFromComms' },
  { id: 'galya', x: COMMS.galya, y: 236, w: 26, h: 40, prompt: 'Поговорить с Галей', icon: 'talk', onUse: 'epoch3#galya' },
  { id: 'panel', x: COMMS.panel, y: 214, w: 90, h: 50, prompt: 'Осмотреть пульт', icon: 'hand', onUse: 'epoch3#galya' },
];

export const BUNKER_TRIGGERS = [
  { id: 'e3.meet', x0: 0, x1: 640, cond: { and: [flag('e3.started'), not(flag('e3.met')), not(flag('stage.e3finale'))] } as Cond, onEnter: 'epoch3#meet' },
];
export const PAD_TRIGGERS = [
  { id: 'e3.padEnter', x0: 300, x1: 560, cond: { and: [flag('e3.met'), not(flag('e3.padDone'))] } as Cond, onEnter: 'epoch3#ivan' },
];

export type Where = 'bunker' | 'pad' | 'comms';

export function e3Stage(s: GameState, where: Where): { objective: string | null; rule: string } {
  const f = s.flags;
  if (!f['e3.started'] || f['stage.e3finale'] || f['stage.e3launch']) return { objective: null, rule: 'none' };
  if (!f['e3.met']) return { objective: 'Войди в бункер', rule: where === 'pad' ? 'e3_enter' : 'none' };
  if (!f['e3.inspectDone']) {
    return { objective: 'Осмотри Инспектора', rule: where === 'bunker' ? 'e3_inspect' : 'e3_back' };
  }
  if (!f['e3.padDone']) {
    return {
      objective: 'Расспроси Ивана Саввича на площадке',
      rule: where === 'bunker' ? 'e3_to_pad' : where === 'pad' ? 'e3_ivan' : 'e3_back',
    };
  }
  if (!f['e3.minigameDone']) {
    return {
      objective: 'Пересобери пульт в пункте связи',
      rule: where === 'bunker' ? 'e3_to_comms' : where === 'comms' ? 'e3_galya' : 'e3_back',
    };
  }
  return { objective: 'Допроси Инспектора в бункере', rule: where === 'bunker' ? 'e3_interrogate' : 'e3_back' };
}
