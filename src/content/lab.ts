import type { Interactable, Script } from './types';

export const LAB_SCRIPT: Script = {
  start: [
    { t: 'checkpoint', id: 'lab.start' },
    { t: 'say', who: 'byte', text: 'Лабораторный прогон: Лупа.' },
    { t: 'loupe', object: 'prologue_leaf' },
    { t: 'loupe', object: 'ep1_chest' },
    { t: 'checkpoint', id: 'lab.loupe' },
    { t: 'giveClue', clue: 'ep1.U3' },
    { t: 'giveClue', clue: 'ep1.U4' },
    { t: 'giveClue', clue: 'ep1.U5' },
    { t: 'minigame', id: 'birch' },
    { t: 'interrogate', npc: 'ignat' },
    { t: 'checkpoint', id: 'lab.interrogation' },
    { t: 'board', epoch: 1 },
    { t: 'epochChoice', epoch: 1 },
    { t: 'if', cond: { flag: 'ep1.choice', eq: 'truth' }, then: 'truth', else: 'agree' },
  ],
  truth: [
    { t: 'say', who: 'onfim', text: 'Это мой всадник! Косой, но мой!' },
    { t: 'goto', name: 'card' },
  ],
  agree: [
    { t: 'say', who: 'onfim', text: 'Это не я писал.', mood: 'quiet' },
    { t: 'say', who: 'byte', text: 'Я не должен это слышать.' },
    { t: 'goto', name: 'card' },
  ],
  card: [{ t: 'card', id: 1 }, { t: 'checkpoint', id: 'lab.end' }],
  minigames: [
    { t: 'minigame', id: 'pencil' },
    { t: 'minigame', id: 'panel' },
  ],
  board2: [{ t: 'board', epoch: 2 }],
  interro: [{ t: 'interrogate', npc: 'prohorov' }],
};

export const LAB_INTERACTABLES: Interactable[] = [
  { id: 'lab', x: 430, y: 215, w: 30, h: 30, prompt: 'Лаборатория', icon: 'book', onUse: 'lab#start', once: true },
];
