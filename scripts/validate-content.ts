import { CLUES } from '../src/content/clues';
import { TEST_SCRIPT } from '../src/content/test';
import { CARDS } from '../src/content/cards';
import { INTERROGATIONS } from '../src/content/interrogation';
import { HALL_INTERACTABLES, HUB_SCRIPT, PROLOGUE_SCRIPT } from '../src/content/hall';
import { HINT_RULES } from '../src/content/hints';
import { LAB_SCRIPT } from '../src/content/lab';
import { LOUPE } from '../src/content/loupe';
import type { Script, Step } from '../src/content/types';
import { BOARDS } from '../src/core/Board';
import { EPOCH1_SCRIPT, SQUARE_INTERACTABLES, HOUSE_INTERACTABLES, BAKERY_INTERACTABLES, WORKSHOP_INTERACTABLES } from '../src/content/epoch1';
import { readFileSync } from 'node:fs';
import { EPOCH2_SCRIPT, HALL_INTERACTABLES as H2, YARD_INTERACTABLES, CELLAR_INTERACTABLES } from '../src/content/epoch2';
import { CORE_SCRIPT } from '../src/content/core';
import { EPOCH3_SCRIPT, BUNKER_INTERACTABLES, PAD_INTERACTABLES, COMMS_INTERACTABLES } from '../src/content/epoch3';
import { extractLines, findMissing, haystack } from './script-coverage';

const errors: string[] = [];

function checkScript(id: string, script: Script): void {
  for (const [label, steps] of Object.entries(script)) {
    const inner = new Set(
      steps.filter((s): s is Extract<Step, { t: 'label' }> => s.t === 'label').map((s) => s.name),
    );
    const exists = (name: string) => name in script || inner.has(name);
    for (const s of steps) {
      if (s.t === 'goto' && !exists(s.name)) errors.push(`${id}#${label}: goto «${s.name}» не найден`);
      if (s.t === 'if' && (!exists(s.then) || (s.else && !exists(s.else)))) {
        errors.push(`${id}#${label}: if ведёт на несуществующую метку`);
      }
      if (s.t === 'choice') {
        for (const o of s.options) if (!exists(o.goto)) errors.push(`${id}#${label}: choice → «${o.goto}» не найден`);
      }
      if (s.t === 'giveClue' && !(s.clue in CLUES)) errors.push(`${id}#${label}: неизвестная улика ${s.clue}`);
    }
  }
}

checkScript('test', TEST_SCRIPT);
checkScript('lab', LAB_SCRIPT);
checkScript('prologue', PROLOGUE_SCRIPT);
checkScript('hub', HUB_SCRIPT);
checkScript('epoch1', EPOCH1_SCRIPT);
checkScript('epoch2', EPOCH2_SCRIPT);
checkScript('epoch3', EPOCH3_SCRIPT);
checkScript('core', CORE_SCRIPT);
for (const steps of Object.values(CORE_SCRIPT)) {
  for (const st of steps) if (st.t === 'hintRule' && !(st.rule in HINT_RULES)) errors.push(`ядро: hintRule «${st.rule}» не определено`);
}
for (const it of [...BUNKER_INTERACTABLES, ...PAD_INTERACTABLES, ...COMMS_INTERACTABLES]) {
  const [sid, label] = it.onUse.split('#');
  if (sid !== 'epoch3' || !EPOCH3_SCRIPT[label ?? '']) errors.push(`эпоха 3, интерактив ${it.id}: нет сценария ${it.onUse}`);
}
for (const steps of Object.values(EPOCH3_SCRIPT)) {
  for (const st of steps) if (st.t === 'hintRule' && !(st.rule in HINT_RULES)) errors.push(`эпоха 3: hintRule «${st.rule}» не определено`);
}
for (const it of [...H2, ...YARD_INTERACTABLES, ...CELLAR_INTERACTABLES]) {
  const [sid, label] = it.onUse.split('#');
  if (sid !== 'epoch2' || !EPOCH2_SCRIPT[label ?? '']) errors.push(`эпоха 2, интерактив ${it.id}: нет сценария ${it.onUse}`);
}
for (const steps of Object.values(EPOCH2_SCRIPT)) {
  for (const st of steps) if (st.t === 'hintRule' && !(st.rule in HINT_RULES)) errors.push(`эпоха 2: hintRule «${st.rule}» не определено`);
}

for (const it of [...SQUARE_INTERACTABLES, ...HOUSE_INTERACTABLES, ...BAKERY_INTERACTABLES, ...WORKSHOP_INTERACTABLES]) {
  const [sid, label] = it.onUse.split('#');
  if (sid !== 'epoch1' || !EPOCH1_SCRIPT[label ?? '']) errors.push(`эпоха 1, интерактив ${it.id}: нет сценария ${it.onUse}`);
}
for (const steps of Object.values(EPOCH1_SCRIPT)) {
  for (const st of steps) {
    if (st.t === 'hintRule' && !(st.rule in HINT_RULES)) errors.push(`эпоха 1: hintRule «${st.rule}» не определено`);
  }
}

{
  const md = readFileSync('docs/story/00-script.md', 'utf8');
  const ignoreAll = JSON.parse(readFileSync('scripts/script-coverage-ignore.json', 'utf8')) as Record<string, string[]>;
  const hay = haystack();
  const sections: [string, RegExp, RegExp][] = [
    ['epoch1', /^## 3\. /, /^## 4\. /],
    ['epoch2', /^## 4\. /, /^## 5\. /],
    ['epoch3', /^## 5\. /, /^## 6\. /],
    ['core', /^## 6\. /, /^## 7\. /],
    ['endings', /^## 7\. /, /^## 8\. /],
  ];
  for (const [name, start, end] of sections) {
    const lines = extractLines(md, start, end);
    const missing = findMissing(lines, hay, ignoreAll[name] ?? []);
    if (lines.length < (name === 'core' || name === 'endings' ? 8 : 40)) errors.push(`покрытие ${name}: извлечено лишь ${lines.length} реплик (парсер сломан?)`);
    for (const m of missing) errors.push(`покрытие ${name}: нет в игре строки сценария ${m.line}: ${m.speaker}: «${m.text}»`);
    console.log(`покрытие сценария, ${name}: ${lines.length - missing.length}/${lines.length}`);
  }
}


{
  const { readdirSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const f of readdirSync(dir)) {
      const p = path.join(dir, f);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.ts$/.test(f)) out.push(p);
    }
    return out;
  };
  const files = walk('src');
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const rel = f.replace(/\\/g, '/');
    if (rel.startsWith('src/content/')) {
      src.split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        const strs = line.match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) ?? [];
        for (const t of strs) {
          if (/[А-Яа-яЁё]/.test(t)) {
            if (t.includes('...')) errors.push(`${rel}:${i + 1}: «...» вместо «…»`);
            if (/\S {2,}\S/.test(t)) errors.push(`${rel}:${i + 1}: двойной пробел`);
            if ((t.match(/«/g) ?? []).length !== (t.match(/»/g) ?? []).length) errors.push(`${rel}:${i + 1}: непарные ёлочки`);
            if (/сверить/i.test(t)) errors.push(`${rel}:${i + 1}: пометка «сверить» в игровом тексте`);
          }
        }
      });
    }
    if (/who:\s*'(konstruktor|cosmonaut|gagarin)'/.test(src)) errors.push(`${rel}: реплика реального человека`);
    if (/https?:\/\/(?!www\.w3\.org)/.test(src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) {
      errors.push(`${rel}: внешний URL`);
    }
    if (/localStorage/.test(src) && !/core\/(Save|Settings|Storage)\.ts$/.test(rel)) errors.push(`${rel}: localStorage вне Save/Settings/Storage`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('validate:content — ок');
