import type { ClueId, SpeakerId } from '../types';

export type NpcId = 'ignat' | 'prohorov' | 'inspector';

export interface NpcLine {
  aside?: string;
  text: string;
  new?: boolean;
}

export interface Intent {
  id: string;
  keywords: string[];
  reply: NpcLine;
  repeat: NpcLine[];
  states?: string[];
  suppressStates?: { ifQuestionHas: string[]; states: string[] }[];
  anchor?: boolean;
  chip?: string;
  unlockedBy?: string;
  byteAfter?: string;
}

export interface Contradiction {
  id: string;
  requiresStated: string;
  clue: ClueId;
  playerLine: string;
  npcLines: NpcLine[];
}

export interface InterrogationDef {
  npc: NpcId;
  speaker: SpeakerId;
  title: string;
  maxQuestions: number;
  intents: Intent[];
  fallbackReplies: NpcLine[];
  contradictions: Contradiction[];
  breakAfter: number;
  breakLines: NpcLine[];
  givesClue: ClueId;
  wrongNpc: NpcLine;
  wrongByte: string;
  notYetByte: string;
  escalateByte: [string, string];
}
