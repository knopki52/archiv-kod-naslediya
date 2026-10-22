import type { Cond, Script } from './types';


const choiceIs = (n: 1 | 2 | 3, v: 'truth' | 'agree'): Cond => ({ flag: `ep${n}.choice`, eq: v });

function letaFor(n: 1 | 2 | 3, truth: string, agree: string): Script[string] {
  return [
    { t: 'if', cond: choiceIs(n, 'truth'), then: `l${n}t`, else: `l${n}a` },
    { t: 'label', name: `l${n}t` },
    { t: 'say', who: 'lete', text: truth },
    { t: 'goto', name: `l${n}end` },
    { t: 'label', name: `l${n}a` },
    { t: 'say', who: 'lete', text: agree },
    { t: 'label', name: `l${n}end` },
  ];
}

export const CORE_SCRIPT: Script = {
  enter: [
    { t: 'checkpoint', id: 'core.start' },
    { t: 'set', effects: { flags: { 'core.started': true } } },
    { t: 'music', track: 'core', fade: 3 },
    { t: 'ambience', name: 'core' },
    { t: 'objective', text: null },
    { t: 'hintRule', rule: 'none' },
    { t: 'say', who: 'byte', mood: 'quiet', aside: 'тихо', text: 'Тут я не могу идти дальше. Ты должна одна.' },
    { t: 'call', name: 'core.leteTurn' },
    { t: 'say', who: 'lete', text: 'Здравствуй. Ты дошла.' },
    { t: 'say', who: 'lete', text: 'Я Лета. Ты Мнема. Помнишь?' },
    { t: 'set', effects: { flags: { 'core.named': true } } },
    { t: 'goto', name: 'memories' },
  ],

  memories: [
    { t: 'call', name: 'core.memoryStart' },
    { t: 'call', name: 'core.memory', args: { n: 1, caption: 'Зал серверов, давно' } },
    { t: 'say', who: 'voice1', text: 'Мы хранители. Нас двое.' },
    { t: 'if', cond: { flag: 'core.skipMem' }, then: 'memEnd' },
    { t: 'call', name: 'core.memory', args: { n: 2, caption: 'День Великой очистки' } },
    { t: 'say', who: 'voice1', text: 'Сохранить всё, даже боль.' },
    { t: 'if', cond: { flag: 'core.skipMem' }, then: 'memEnd' },
    { t: 'say', who: 'voice2', text: 'Оставить то, что не ранит.' },
    { t: 'if', cond: { flag: 'core.skipMem' }, then: 'memEnd' },
    { t: 'call', name: 'core.memory', args: { n: 3, caption: 'Разделение' } },
    { t: 'say', who: 'lete', text: 'Мнема осталась хранить. Я ушла редактировать.' },
    { t: 'if', cond: { flag: 'core.skipMem' }, then: 'memEnd' },
    { t: 'say', who: 'lete', text: 'Я не хотела зла. Я хотела, чтобы людям не было больно.' },
    { t: 'label', name: 'memEnd' },
    { t: 'call', name: 'core.memoryEnd' },
    { t: 'checkpoint', id: 'core.memories' },
    { t: 'goto', name: 'letaLines' },
  ],

  letaLines: [
    { t: 'call', name: 'core.insert', args: { kind: 'birch' } },
    ...letaFor(
      1,
      'Ты вернула мальчику его косого всадника. Ему было больно, но он смеялся.',
      'В Новгороде ты поняла меня. Помнишь грамоту без ошибок?',
    ),
    { t: 'call', name: 'core.insert', args: { kind: 'diary' } },
    ...letaFor(
      2,
      'Ты оставила Зине голод. И её слова.',
      'Ты дала ей сытый вечер. Разве это было неправильно?',
    ),
    { t: 'call', name: 'core.insert', args: { kind: 'journal' } },
    ...letaFor(
      3,
      'Ты вернула людям их страх. И их смелость.',
      'Ты позволила закрыть журнал. Мы похожи.',
    ),
    { t: 'call', name: 'core.insert', args: { kind: 'none' } },
    { t: 'goto', name: 'playerLines' },
  ],

  playerLines: [
    {
      t: 'choice',
      options: [
        { text: 'Ты забрала у Зины её слова.', goto: 'pl1' },
        { text: 'Ты стёрла риск у людей, которые рисковали.', goto: 'pl2' },
        { text: 'Ты была права, что боль нужно лечить. Но не стиранием.', goto: 'pl3' },
      ],
    },
    { t: 'label', name: 'pl1' },
    { t: 'say', who: 'mnema', text: 'Ты забрала у Зины её слова.' },
    { t: 'say', who: 'lete', text: 'Я не забирала. Я хотела вернуть ей лёгкость.' },
    { t: 'goto', name: 'finalChoice' },
    { t: 'label', name: 'pl2' },
    { t: 'say', who: 'mnema', text: 'Ты стёрла риск у людей, которые рисковали.' },
    { t: 'say', who: 'lete', text: 'Риск ранит. Разве я неправа?' },
    { t: 'goto', name: 'finalChoice' },
    { t: 'label', name: 'pl3' },
    { t: 'say', who: 'mnema', text: 'Ты была права, что боль нужно лечить. Но не стиранием.' },
    { t: 'say', who: 'lete', aside: 'тихо', text: 'Ты… правда так думаешь?' },
    { t: 'goto', name: 'finalChoice' },
  ],

  finalChoice: [
    { t: 'checkpoint', id: 'core.choice' },
    { t: 'if', cond: { integrity: { eq: 0 } }, then: 'zero', else: 'pick' },
    { t: 'label', name: 'zero' },
    { t: 'say', who: 'lete', text: 'Ты ведь уже со мной. Просто скажи это вслух.' },
    { t: 'choice', options: [{ text: '…', goto: 'zeroYes' }] },
    { t: 'label', name: 'zeroYes' },
    { t: 'say', who: 'mnema', text: 'Да.', new: true },
    { t: 'set', effects: { flags: { 'core.ending': 'editor' } } },
    { t: 'goto', name: 'route' },
    { t: 'label', name: 'pick' },
    { t: 'call', name: 'core.finalChoice' },
    { t: 'label', name: 'route' },
    { t: 'checkpoint', id: 'core.decided' },
    { t: 'if', cond: { flag: 'core.ending', eq: 'merge' }, then: 'endMerge' },
    { t: 'if', cond: { flag: 'core.ending', eq: 'keeper' }, then: 'endKeeper', else: 'endEditor' },
  ],

  endKeeper: [
    { t: 'music', track: 'end_keeper', fade: 2 },
    { t: 'call', name: 'core.keeperErase' },
    { t: 'say', who: 'byte', text: 'Ты сделала это.' },
    { t: 'call', name: 'core.montage', args: { kind: 'keeper' } },
    { t: 'say', who: 'byte', text: 'Это честно. И очень одиноко.' },
    { t: 'call', name: 'core.lastScene', args: { kind: 'keeper' } },
    { t: 'call', name: 'core.finish', args: { ending: 'keeper' } },
  ],

  endMerge: [
    { t: 'music', track: 'end_merge', fade: 2 },
    { t: 'call', name: 'core.mergeHands' },
    { t: 'say', who: 'lete', text: 'Я боялась боли, а боялась зря.' },
    { t: 'say', who: 'mnema', text: 'Я боялась забыть, а надо было ещё и прощать.' },
    { t: 'call', name: 'core.montage', args: { kind: 'merge' } },
    { t: 'if', cond: { artifact: 'grain' }, then: 'artGrain' },
    { t: 'if', cond: { artifact: 'voices' }, then: 'artVoices' },
    { t: 'if', cond: { artifact: 'fire' }, then: 'artFire' },
    { t: 'goto', name: 'mergeBye' },
    { t: 'label', name: 'artGrain' },
    { t: 'say', who: 'mnema', text: 'Из семян, которые мы спасли, вырастут поля.' },
    { t: 'goto', name: 'mergeBye' },
    { t: 'label', name: 'artVoices' },
    { t: 'say', who: 'mnema', text: 'Письма обычных людей теперь тоже в Архиве.' },
    { t: 'goto', name: 'mergeBye' },
    { t: 'label', name: 'artFire' },
    { t: 'say', who: 'mnema', text: 'Тепло убежища дошло до самого Архива.' },
    { t: 'label', name: 'mergeBye' },
    { t: 'say', who: 'byte', aside: 'смеётся', text: 'Знаешь, я ведь всё это время был твоим кусочком. Ты придумала меня, чтобы не быть одной.' },
    { t: 'call', name: 'core.lastScene', args: { kind: 'merge' } },
    { t: 'call', name: 'core.finish', args: { ending: 'merge' } },
  ],

  endEditor: [
    { t: 'music', track: 'end_editor', fade: 2 },
    { t: 'set', effects: { byteSilent: true } },
    { t: 'call', name: 'core.editorWhite' },
    { t: 'say', who: 'lete', text: 'Вот видишь. Всё стало лучше.' },
    { t: 'call', name: 'core.montage', args: { kind: 'editor' } },
    { t: 'call', name: 'core.lastScene', args: { kind: 'editor' } },
    { t: 'call', name: 'core.finish', args: { ending: 'editor' } },
  ],
};
