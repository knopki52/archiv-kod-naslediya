import type { Intent } from '../content/interrogation/types';

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function keywordMatches(norm: string, tokens: string[], keyword: string): boolean {
  const k = normalize(keyword);
  if (!k) return false;
  if (k.includes(' ')) return norm.includes(k);
  return k.length <= 2 ? tokens.includes(k) : tokens.some((t) => t.startsWith(k));
}

export function countMatches(question: string, keywords: string[]): number {
  const norm = normalize(question);
  const tokens = norm.split(' ');
  return keywords.reduce((n, k) => n + (keywordMatches(norm, tokens, k) ? 1 : 0), 0);
}

export function classify(
  question: string,
  intents: Intent[],
  available: (i: Intent) => boolean = () => true,
): Intent | null {
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of intents) {
    if (!available(intent)) continue;
    const score = countMatches(question, intent.keywords);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
}
