import type {
  Artifact, ChoiceValue, ClueId, Cond, Effects, EpochNo, FlagValue,
} from '../content/types';

export interface InterrogationProgress {
  asked: string[];
  stated: string[];
  solved: string[];
  questionsUsed: number;
  wrongPresents: number;
}

export interface GameState {
  version: 1;
  integrity: number;
  choices: (ChoiceValue | null)[];
  cards: (1 | 2 | 3)[];
  artifact: Artifact | null;
  clues: Record<EpochNo, ClueId[]>;
  flags: Record<string, FlagValue>;
  byteSilent: boolean;
  epochDone: [boolean, boolean, boolean];
  location: string;
  checkpoint: string;
  interrogation: Record<string, InterrogationProgress>;
  stats: { playMs: number; hintsUsed: number; wrongBoardTries: number; skipped: number };
}

export function newState(): GameState {
  return {
    version: 1,
    integrity: 0,
    choices: [null, null, null],
    cards: [],
    artifact: null,
    clues: { 1: [], 2: [], 3: [] },
    flags: {},
    byteSilent: false,
    epochDone: [false, false, false],
    location: 'boot',
    checkpoint: 'start',
    interrogation: {},
    stats: { playMs: 0, hintsUsed: 0, wrongBoardTries: 0, skipped: 0 },
  };
}

export function clueEpoch(clue: ClueId): EpochNo {
  return Number(clue.charAt(2)) as EpochNo;
}

export function evalCond(state: GameState, cond: Cond): boolean {
  if ('flag' in cond) {
    const v = state.flags[cond.flag];
    return cond.eq === undefined ? Boolean(v) : v === cond.eq;
  }
  if ('clue' in cond) return state.clues[clueEpoch(cond.clue)].includes(cond.clue);
  if ('integrity' in cond) {
    const i = state.integrity;
    const c = cond.integrity;
    return (
      (c.gte === undefined || i >= c.gte) &&
      (c.lte === undefined || i <= c.lte) &&
      (c.eq === undefined || i === c.eq)
    );
  }
  if ('cards' in cond) return state.cards.includes(cond.cards.has);
  if ('epochDone' in cond) return state.epochDone[cond.epochDone];
  if ('artifact' in cond) return state.artifact === cond.artifact;
  if ('and' in cond) return cond.and.every((c) => evalCond(state, c));
  if ('or' in cond) return cond.or.some((c) => evalCond(state, c));
  return !evalCond(state, cond.not);
}

export function applyEffects(state: GameState, fx: Effects): void {
  if (fx.integrityAdd) state.integrity = Math.max(0, Math.min(3, state.integrity + fx.integrityAdd));
  if (fx.flags) Object.assign(state.flags, fx.flags);
  if (fx.artifact !== undefined) state.artifact = fx.artifact;
  if (fx.byteSilent !== undefined) state.byteSilent = fx.byteSilent;
  if (fx.choice) {
    state.choices[fx.choice.epoch - 1] = fx.choice.value;
    if (fx.choice.value === 'truth') state.integrity = Math.min(3, state.integrity + 1);
  }
  if (fx.addCard && !state.cards.includes(fx.addCard)) state.cards.push(fx.addCard);
}

export function availableFinals(integrity: number): { erase: boolean; merge: boolean; agree: true } {
  return { erase: integrity >= 1, merge: integrity === 3, agree: true };
}
