import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const norm = (s: string): string =>
  s
    .replace(/&quot;/g, '"')
    .replace(/[«»"“”„]/g, '')
    .replace(/\.\.\./g, '…')
    .replace(/[‑–—]/g, '-')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|css)$/.test(f)) out.push(p);
  }
  return out;
}

export function haystack(root = 'src'): string {
  return walk(root)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
    .split('\n')
    .join('\n')
    .replace(/'\s*\+\s*\n\s*'/g, '');
}

export interface ScriptLine {
  line: number;
  speaker: string;
  text: string;
  raw: string;
}

export function extractLines(markdown: string, sectionStart: RegExp, sectionEnd: RegExp): ScriptLine[] {
  const lines = markdown.split('\n');
  const out: ScriptLine[] = [];
  let inside = false;
  lines.forEach((raw, i) => {
    if (/^## /.test(raw)) inside = sectionStart.test(raw) ? true : inside && !sectionEnd.test(raw);
    if (!inside) return;
    const t = raw.trim();
    let m = /^([А-ЯЁ][А-Яа-яЁё .]{0,28}?)(?: \(([^)]*)\))?: «(.+)»\.?$/.exec(t);
    if (m) {
      out.push({ line: i + 1, speaker: m[1]!, text: m[3]!, raw: t });
      return;
    }
    m = /^Ты: (\[U\d\].+)$/.exec(t);
    if (m) {
      out.push({ line: i + 1, speaker: 'Ты', text: m[1]!, raw: t });
      return;
    }
    m = /^«([^»]+)»(?: \([^)]*\))?[.:]?$/.exec(t);
    if (m) out.push({ line: i + 1, speaker: '(выбор)', text: m[1]!, raw: t });
  });
  return out;
}

export function findMissing(lines: ScriptLine[], hay: string, ignore: string[] = []): ScriptLine[] {
  const h = norm(hay);
  const skip = new Set(ignore.map(norm));
  return lines.filter((l) => {
    const n = norm(l.text);
    return !skip.has(n) && !h.includes(n);
  });
}
