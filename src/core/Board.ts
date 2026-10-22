import type { ClueId, EpochNo } from '../content/types';

export interface BoardDef {
  epoch: EpochNo;
  correct: ClueId[];
  falseClue?: ClueId;
  falseMsg?: string;
  wrongMsg: string;
  hintMsg2: string;
}

export const BOARDS: Record<EpochNo, BoardDef> = {
  1: {
    epoch: 1,
    correct: ['ep1.U3', 'ep1.U4', 'ep1.U6'],
    falseClue: 'ep1.F1',
    falseMsg: 'Нет, это пустой слух. Нужны улики, которые подтверждают друг друга.',
    wrongMsg: 'Почти. Поищи три улики, которые вместе указывают на Гостя.',
    hintMsg2: 'Гость был у мастерской, там горел свет, а писарь признался. Три улики — про это.',
  },
  2: {
    epoch: 2,
    correct: ['ep2.U3', 'ep2.U4', 'ep2.U5'],
    wrongMsg: 'Не хватает главного. Найди улики про самого Корреспондента, про настоящие страницы и про ключ.',
    hintMsg2: 'Нужны: нет пара и ключ, подлинные страницы, и то, что ключ отдан.',
  },
  3: {
    epoch: 3,
    correct: ['ep3.U1', 'ep3.U2', 'ep3.U5'],
    wrongMsg: 'Люк и связь важны, но они про старт. Нам нужно доказать, что Инспектор здесь лишний.',
    hintMsg2: 'Пропуск из завтра, чистые ботинки и то, что он знает будущее.',
  },
};

export interface BoardResult {
  ok: boolean;
  message?: string;
}

export function evaluateBoard(epoch: EpochNo, selected: ClueId[], attempts = 1): BoardResult {
  const def = BOARDS[epoch];
  if (selected.length !== 3) return { ok: false, message: 'Выбери ровно три улики.' };
  const set = new Set(selected);
  if (def.correct.every((c) => set.has(c)) && set.size === 3) return { ok: true };
  if (def.falseClue && set.has(def.falseClue) && def.falseMsg) return { ok: false, message: def.falseMsg };
  if (attempts >= 2 && attempts % 2 === 0) return { ok: false, message: def.hintMsg2 };
  return { ok: false, message: def.wrongMsg };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
