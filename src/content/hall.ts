import type { Interactable, Script } from './types';

export const PROLOGUE_SCRIPT: Script = {
  start: [
    { t: 'checkpoint', id: 'pro.start' },
    { t: 'ambience', name: 'servers' },
    { t: 'call', name: 'hall.dark' },
    { t: 'wait', ms: 900 },
    { t: 'call', name: 'hall.byteSpark' },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'byte', text: 'Эй! Ты функционируешь? Отлично.' },
    { t: 'say', who: 'byte', text: 'Не помню, кто ты. Но ты единственная, кто ещё двигается.' },
    { t: 'call', name: 'hall.heroFadeIn' },
    {
      t: 'say',
      who: 'byte',
      text: 'Я Байт, дрон Архива. Попробуй пройтись. Клавиши со стрелками или WASD. На телефоне джойстик слева.',
    },
    { t: 'music', track: 'archive', fade: 3 },
    { t: 'objective', text: 'Подойди к мерцающей книге у стены' },
    { t: 'hintRule', rule: 'pro_book' },
  ],
  book: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    { t: 'call', name: 'hall.bookCrumble' },
    { t: 'say', who: 'byte', text: 'Видишь? Они рассыпаются.' },
    { t: 'say', who: 'byte', text: 'Кто-то переписывает историю прямо сейчас. Страница за страницей.' },
    { t: 'call', name: 'hall.dublerGlow', args: { on: true } },
    { t: 'fx', name: 'glitch', ms: 260 },
    { t: 'say', who: 'dubler', text: 'Не пугайся. Я просто навожу порядок.', mood: 'glitch' },
    { t: 'say', who: 'dubler', text: 'Зачем людям помнить то, что причиняет боль?', mood: 'glitch' },
    { t: 'call', name: 'hall.dublerGlow', args: { on: false } },
    { t: 'say', who: 'byte', text: 'Это Дублёр. Он не врёт, но и правды не говорит.' },
    { t: 'say', who: 'byte', text: 'Он правит прошлое так, чтобы оно не болело. Мы должны это остановить.' },
    { t: 'set', effects: { flags: { 'pro.bookDone': true } } },
    { t: 'objective', text: 'Осмотри листок на столе' },
    { t: 'checkpoint', id: 'pro.book' },
    { t: 'hintRule', rule: 'pro_leaf' },
  ],
  leaf: [
    { t: 'hintRule', rule: 'none' },
    { t: 'objective', text: null },
    {
      t: 'say',
      who: 'byte',
      text: 'Держи Лупу правды. Наводишь на предмет и задаёшь три вопроса: кто автор, когда и где это было, что это подтверждает.',
    },
    { t: 'call', name: 'hall.giveLoupe' },
    { t: 'loupe', object: 'prologue_leaf' },
    { t: 'set', effects: { flags: { 'pro.loupeDone': true } } },
    { t: 'checkpoint', id: 'pro.loupe' },
    { t: 'call', name: 'hall.openPortal', args: { index: 0 } },
    { t: 'say', who: 'byte', text: 'Идём. Первая подмена в Новгороде. Тринадцатый век.' },
    { t: 'set', effects: { flags: { 'pro.done': true } } },
    { t: 'call', name: 'hall.toHub' },
    { t: 'objective', text: 'Войди в портал-книгу' },
    { t: 'checkpoint', id: 'pro.end' },
    { t: 'hintRule', rule: 'hub_0' },
  ],
};

export const HUB_SCRIPT: Script = {
  enter: [{ t: 'call', name: 'hall.hubObjective' }],
  afterE1: [
    { t: 'set', effects: { byteSilent: false } },
    { t: 'checkpoint', id: 'hub.afterE1' },
    { t: 'if', cond: { flag: 'ep1.choice', eq: 'truth' }, then: 'e1_truth', else: 'e1_agree' },
  ],
  e1_truth: [
    { t: 'say', who: 'byte', text: 'Одна страница спасена. Дальше Ленинград.' },
    { t: 'goto', name: 'e1_end' },
  ],
  e1_agree: [{ t: 'say', who: 'byte', text: 'Идём дальше.', mood: 'quiet' }, { t: 'goto', name: 'e1_end' }],
  e1_end: [{ t: 'call', name: 'hall.hubObjective' }, { t: 'hintRule', rule: 'hub_1' }],
  afterE2: [
    { t: 'set', effects: { byteSilent: false } },
    { t: 'checkpoint', id: 'hub.afterE2' },
    { t: 'say', who: 'byte', text: 'Теперь Байконур. Двенадцатое апреля, шестьдесят первый год.' },
    { t: 'call', name: 'hall.hubObjective' },
    { t: 'hintRule', rule: 'hub_2' },
  ],
  afterE3: [
    { t: 'set', effects: { byteSilent: false } },
    { t: 'call', name: 'hall.openDoor' },
    { t: 'checkpoint', id: 'hub.afterE3' },
    { t: 'say', who: 'byte', text: 'Три карточки собраны. Дверь в Ядро открыта. Дальше я не смогу идти с тобой.' },
    { t: 'call', name: 'hall.hubObjective' },
    { t: 'hintRule', rule: 'hub_core' },
  ],
  portal0: [{ t: 'call', name: 'hall.enterPortal', args: { index: 0 } }],
  portal1: [{ t: 'call', name: 'hall.enterPortal', args: { index: 1 } }],
  portal2: [{ t: 'call', name: 'hall.enterPortal', args: { index: 2 } }],
  collection: [{ t: 'call', name: 'hall.collection' }],
  doorCheck: [
    {
      t: 'if',
      cond: { and: [{ cards: { has: 1 } }, { cards: { has: 2 } }, { cards: { has: 3 } }] },
      then: 'doorOpen',
      else: 'doorLocked',
    },
  ],
  doorLocked: [
    { t: 'say', who: 'byte', text: 'Дверь заперта: на ней три углубления. Нужны три карточки правды.', new: true },
  ],
  doorOpen: [{ t: 'call', name: 'hall.enterCore' }],
};

export const PORTAL_POS = [
  { x: 218, y: 226 },
  { x: 320, y: 204 },
  { x: 422, y: 226 },
] as const;
export const PORTAL_X = PORTAL_POS.map((p) => p.x);

const portalEnabled = (i: 0 | 1 | 2): Interactable['enabledIf'] =>
  i === 0 ? { not: { epochDone: 0 } } : { and: [{ not: { epochDone: i } }, { epochDone: (i - 1) as 0 | 1 }] };

const hubOnly: Interactable['visibleIf'] = { flag: 'pro.done' };

export const HALL_INTERACTABLES: Interactable[] = [
  {
    id: 'book_flicker', x: 88, y: 228, w: 34, h: 44, prompt: 'Осмотреть книгу', icon: 'book',
    visibleIf: { and: [{ not: { flag: 'pro.bookDone' } }, { not: { flag: 'pro.done' } }] },
    onUse: 'prologue#book', once: true,
  },
  {
    id: 'desk_leaf', x: 560, y: 226, w: 60, h: 40, prompt: 'Осмотреть листок', icon: 'eye',
    visibleIf: { and: [{ flag: 'pro.bookDone' }, { not: { flag: 'pro.loupeDone' } }] },
    onUse: 'prologue#leaf', once: true,
  },
  ...([0, 1, 2] as const).map((i): Interactable => ({
    id: `portal_${i}`, x: PORTAL_POS[i].x, y: PORTAL_POS[i].y + 2, w: 44, h: 60, prompt: 'Войти в книгу', icon: 'book',
    visibleIf: hubOnly, enabledIf: portalEnabled(i),
    disabledHint: i === 0 ? 'Эта страница уже спасена' : 'Сначала по порядку — иначе сюжет рассыпется',
    onUse: `hub#portal${i}`,
  })),
  { id: 'showcase', x: 158, y: 332, w: 52, h: 60, prompt: 'Артефакты правды', icon: 'eye', visibleIf: hubOnly, onUse: 'hub#collection' },
  {
    id: 'door', x: 320, y: 134, w: 72, h: 104, prompt: 'Дверь «Ядро»', icon: 'door', visibleIf: hubOnly,
    onUse: 'hub#doorCheck',
  },
];
