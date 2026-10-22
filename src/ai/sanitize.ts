export const MAX_REPLY = 220;

const BANNED = [
  'интернет', 'телефон', 'компьютер', 'окей', ' ии ', 'нейросет', 'gpt', 'claude', 'языков', 'промпт',
  'prompt', 'искусственн', 'модель', 'смартфон', 'email', 'http', 'www',
];

export function sanitizeReply(raw: unknown, allowFutureHints = false): string | null {
  if (typeof raw !== 'string') return null;
  let t = raw
    .replace(/[\r\n]+/g, ' ')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/^["«„]+|["»“]+$/g, '').trim();
  if (t.length < 2) return null;

  const lower = ` ${t.toLowerCase()} `;
  for (const w of BANNED) {
    if (lower.includes(w)) return null;
  }
  if (!allowFutureHints && /будущ/.test(lower)) return null;

  const letters = t.replace(/[^a-zа-яё]/gi, '');
  const latin = t.replace(/[^a-z]/gi, '');
  if (letters.length === 0 || latin.length / letters.length > 0.15) return null;
  if (/\p{Extended_Pictographic}/u.test(t)) return null;

  if (t.length > MAX_REPLY) {
    const cut = t.slice(0, MAX_REPLY);
    const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf('…'));
    if (end < 20) return null;
    t = cut.slice(0, end + 1);
  }
  return t;
}

export function extractReply(text: string): string | null {
  const m = /\{[\s\S]*\}/.exec(text);
  if (m) {
    try {
      const obj = JSON.parse(m[0]) as { reply?: unknown };
      if (typeof obj.reply === 'string') return obj.reply;
    } catch {
      void 0;
    }
  }
  const first = text.trim().split('\n')[0] ?? '';
  return first.length <= MAX_REPLY ? first : null;
}
