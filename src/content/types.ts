export type EpochNo = 1 | 2 | 3;
export type ClueId =
  | 'ep1.U1' | 'ep1.U2' | 'ep1.U3' | 'ep1.U4' | 'ep1.U5' | 'ep1.U6' | 'ep1.F1'
  | 'ep2.U1' | 'ep2.U2' | 'ep2.U3' | 'ep2.U4' | 'ep2.U5'
  | 'ep3.U1' | 'ep3.U2' | 'ep3.U3' | 'ep3.U4' | 'ep3.U5';

export type SpeakerId =
  | 'byte' | 'player' | 'mnema' | 'dubler' | 'guest' | 'inspector' | 'correspondent'
  | 'onfim' | 'nastasya' | 'ignat' | 'zina' | 'maria' | 'prohorov'
  | 'timofey' | 'galya' | 'ivan' | 'lete' | 'botanist' | 'antonina'
  | 'voice1' | 'voice2' | 'narrator' | 'ui';

export type ByteForm = 'drone' | 'raven' | 'collar' | 'kestrel';
export type Artifact = 'grain' | 'voices' | 'fire';
export type Mood = 'normal' | 'whisper' | 'quiet' | 'glitch';
export type ChoiceValue = 'truth' | 'agree';

export type FlagValue = boolean | number | string;

export type Cond =
  | { flag: string; eq?: FlagValue }
  | { clue: ClueId }
  | { integrity: { gte?: number; lte?: number; eq?: number } }
  | { cards: { has: 1 | 2 | 3 } }
  | { epochDone: 0 | 1 | 2 }
  | { artifact: Artifact }
  | { and: Cond[] }
  | { or: Cond[] }
  | { not: Cond };

export interface Effects {
  integrityAdd?: number;
  flags?: Record<string, FlagValue>;
  artifact?: Artifact | null;
  byteSilent?: boolean;
  choice?: { epoch: EpochNo; value: ChoiceValue };
  addCard?: 1 | 2 | 3;
}

export interface SayStep {
  t: 'say';
  id?: string;
  who: SpeakerId;
  text: string;
  aside?: string;
  mood?: Mood;
  wait?: boolean;
  new?: boolean;
}

export type SayInput = Omit<SayStep, 't'>;

export interface ChoiceOption {
  text: string;
  goto: string;
  effects?: Effects;
  showIf?: Cond;
  locked?: boolean;
}

export interface ChoiceStep {
  t: 'choice';
  id?: string;
  prompt?: string;
  options: ChoiceOption[];
}

export type Step =
  | SayStep
  | ChoiceStep
  | { t: 'label'; name: string }
  | { t: 'goto'; name: string }
  | { t: 'if'; cond: Cond; then: string; else?: string }
  | { t: 'set'; effects: Effects }
  | { t: 'giveClue'; clue: ClueId }
  | { t: 'objective'; text: string | null }
  | { t: 'checkpoint'; id: string }
  | { t: 'wait'; ms: number }
  | { t: 'awaitFlag'; cond: Cond }
  | { t: 'scene'; to: string; params?: Record<string, unknown> }
  | { t: 'sfx'; name: string }
  | { t: 'music'; track: string; fade?: number }
  | { t: 'fx'; name: 'crumble' | 'glitch' | 'flash' | 'shake' | 'fade' | 'desaturate' | 'tint'; target?: string; ms?: number }
  | { t: 'moveTo'; who: string; x: number; y?: number; speed?: number; wait?: boolean }
  | { t: 'face'; who: string; dir: 'l' | 'r' }
  | { t: 'morphByte'; form: ByteForm }
  | { t: 'spawn'; npc: string; x?: number; y?: number }
  | { t: 'despawn'; npc: string }
  | { t: 'enableInteract'; id: string; on: boolean }
  | { t: 'loupe'; object: string }
  | { t: 'minigame'; id: 'birch' | 'pencil' | 'panel' }
  | { t: 'interrogate'; npc: 'ignat' | 'prohorov' | 'inspector' }
  | { t: 'board'; epoch: EpochNo }
  | { t: 'epochChoice'; epoch: EpochNo }
  | { t: 'card'; id: 1 | 2 | 3 }
  | { t: 'camera'; action: 'pan' | 'zoom' | 'follow' | 'shake'; x?: number; y?: number; ms?: number }
  | { t: 'ambience'; name: string }
  | { t: 'hintRule'; rule: string }
  | { t: 'call'; name: string; args?: Record<string, unknown> };

export type Script = Record<string, Step[]>;

export interface Interactable {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  prompt: string;
  icon?: 'eye' | 'talk' | 'hand' | 'door' | 'book';
  visibleIf?: Cond;
  enabledIf?: Cond;
  disabledHint?: string;
  onUse: string;
  once?: boolean;
}
