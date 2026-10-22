import { classify, countMatches } from '../ai/Fallback';
import type { Intent, InterrogationDef, NpcLine } from '../content/interrogation/types';
import type { ClueId } from '../content/types';
import { CLUES } from '../content/clues';
import type { InterrogationProgress } from './State';

export function newProgress(): InterrogationProgress {
  return { asked: [], stated: [], solved: [], questionsUsed: 0, wrongPresents: 0 };
}

export type AskKind = 'anchor_first' | 'first' | 'repeat' | 'free' | 'blocked';

export interface AskResult {
  kind: AskKind;
  intent: Intent | null;
  line: NpcLine;
  aiAllowed: boolean;
  newStates: string[];
  byteAfter?: string;
}

export type PresentKind = 'solved' | 'not_yet' | 'wrong' | 'already';

export interface PresentResult {
  kind: PresentKind;
  contradictionId?: string;
  playerLine?: string;
  npcLines?: NpcLine[];
  npcLine?: NpcLine;
  byteLine?: string;
  broken: boolean;
}

export class InterrogationEngine {
  constructor(
    readonly def: InterrogationDef,
    readonly progress: InterrogationProgress,
    private hasClue: (c: ClueId) => boolean,
  ) {}

  get broken(): boolean {
    return this.progress.solved.length >= this.def.breakAfter;
  }

  get questionsLeft(): number {
    return Math.max(0, this.def.maxQuestions - this.progress.questionsUsed);
  }

  isAvailable(intent: Intent): boolean {
    return !intent.unlockedBy || this.progress.solved.includes(intent.unlockedBy);
  }

  chips(): { intent: Intent; asked: boolean; disabled: boolean }[] {
    return this.def.intents
      .filter((i) => i.chip && this.isAvailable(i))
      .map((intent) => {
        const asked = this.progress.asked.includes(intent.id);
        const disabled = !asked && !intent.anchor && this.questionsLeft === 0;
        return { intent, asked, disabled };
      });
  }

  get freeTextAllowed(): boolean {
    return this.questionsLeft > 0;
  }

  classify(question: string): Intent | null {
    return classify(question, this.def.intents, (i) => this.isAvailable(i));
  }

  private fallbackLine(): NpcLine {
    const list = this.def.fallbackReplies;
    const n = this.progress.asked.filter((a) => a === '_free').length;
    return list[n % list.length]!;
  }

  ask(question: string, intentId?: string): AskResult {
    const intent = intentId ? (this.def.intents.find((i) => i.id === intentId) ?? null) : this.classify(question);
    const p = this.progress;

    if (!intent) {
      if (!this.freeTextAllowed) {
        return { kind: 'blocked', intent: null, line: this.fallbackLine(), aiAllowed: false, newStates: [] };
      }
      p.questionsUsed++;
      const line = this.fallbackLine();
      p.asked.push('_free');
      return { kind: 'free', intent: null, line, aiAllowed: true, newStates: [] };
    }

    const already = p.asked.includes(intent.id);
    if (already) {
      const n = p.asked.filter((a) => a === `${intent.id}:repeat`).length;
      p.asked.push(`${intent.id}:repeat`);
      return {
        kind: 'repeat',
        intent,
        line: intent.repeat[n % intent.repeat.length] ?? intent.reply,
        aiAllowed: true,
        newStates: [],
      };
    }

    if (!intent.anchor && !this.freeTextAllowed) {
      return { kind: 'blocked', intent, line: this.fallbackLine(), aiAllowed: false, newStates: [] };
    }

    p.asked.push(intent.id);
    p.questionsUsed++;
    const suppressed = new Set<string>();
    for (const rule of intent.suppressStates ?? []) {
      if (countMatches(question, rule.ifQuestionHas) > 0) rule.states.forEach((s) => suppressed.add(s));
    }
    const newStates = (intent.states ?? []).filter((s) => !suppressed.has(s) && !p.stated.includes(s));
    p.stated.push(...newStates);
    return {
      kind: intent.anchor ? 'anchor_first' : 'first',
      intent,
      line: intent.reply,
      aiAllowed: !intent.anchor,
      newStates,
      byteAfter: intent.byteAfter,
    };
  }

  present(clue: ClueId): PresentResult {
    const p = this.progress;
    const c = this.def.contradictions.find((x) => x.clue === clue);
    if (c && p.solved.includes(c.id)) {
      return { kind: 'already', broken: this.broken, byteLine: 'Это мы уже использовали. Ищи другое несоответствие.' };
    }
    if (c && p.stated.includes(c.requiresStated)) {
      p.solved.push(c.id);
      return {
        kind: 'solved',
        contradictionId: c.id,
        playerLine: c.playerLine,
        npcLines: c.npcLines,
        broken: this.broken,
      };
    }
    if (c) {
      return { kind: 'not_yet', npcLine: this.def.wrongNpc, byteLine: this.def.notYetByte, broken: false };
    }
    p.wrongPresents++;
    return {
      kind: 'wrong',
      npcLine: this.def.wrongNpc,
      byteLine: this.escalation() ?? this.def.wrongByte,
      broken: false,
    };
  }

  private escalation(): string | undefined {
    const n = this.progress.wrongPresents;
    if (n === 2) return this.def.escalateByte[0];
    if (n >= 4 && n % 2 === 0) {
      const next = this.def.contradictions.find((c) => !this.progress.solved.includes(c.id));
      if (next) return `${this.def.escalateByte[1]} Попробуй улику «${CLUES[next.clue].title}».`;
    }
    return undefined;
  }

  missingStatements(): string[] {
    return this.def.contradictions
      .filter((c) => !this.progress.solved.includes(c.id) && !this.progress.stated.includes(c.requiresStated))
      .map((c) => c.requiresStated);
  }

  presentable(clues: ClueId[]): ClueId[] {
    return clues;
  }

  hasRequiredClues(): boolean {
    return this.def.contradictions.every((c) => this.hasClue(c.clue));
  }
}
