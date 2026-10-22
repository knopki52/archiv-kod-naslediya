import { InterrogationClient } from '../ai/InterrogationClient';
import { CLUES } from '../content/clues';
import { INTERROGATIONS, type NpcId } from '../content/interrogation';
import type { NpcLine } from '../content/interrogation/types';
import { SPEAKERS } from '../content/speakers';
import type { ClueId, EpochNo } from '../content/types';
import type { Game } from '../core/Game';
import { InterrogationEngine, newProgress } from '../core/Interrogation';
import { clueEpoch } from '../core/State';
import { CHARACTERS, type CharId } from '../gfx/characters';
import { iconUrl } from '../gfx/icons';
import { portraitHuman } from '../gfx/td/portraits';
import { openModal } from './Modal';
import { el } from './Ui';

export const aiClient = new InterrogationClient();

type Mood = 'neutral' | 'nervous' | 'broken';
const MAX_LEN = 140;

const NPC_CHAR: Record<NpcId, CharId> = { ignat: 'ignat', prohorov: 'prohorov', inspector: 'inspector' };

function renderPortrait(canvas: HTMLCanvasElement, npc: NpcId, mood: Mood): void {
  const buf = portraitHuman(CHARACTERS[NPC_CHAR[npc]], mood === 'nervous' ? 'worried' : mood === 'broken' ? 'broken' : 'neutral', { tired: mood !== 'neutral' });
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, 64, 64);
  c.fillStyle = '#1b1530';
  c.fillRect(0, 0, 64, 64);
  c.drawImage(buf.toCanvas(), 8, 12);
}

export async function runInterrogation(game: Game, npc: NpcId): Promise<{ broken: boolean }> {
  const def = INTERROGATIONS[npc];
  const state = game.store.state;
  const progress = (state.interrogation[npc] ??= newProgress());
  const engine = new InterrogationEngine(def, progress, (c) => game.store.hasClue(c));
  const speaker = SPEAKERS[def.speaker];
  const epoch: EpochNo = clueEpoch(def.givesClue);
  const history: { role: 'player' | 'npc'; text: string }[] = [];

  const modal = openModal<{ broken: boolean }>(game, 'interro');
  const root = modal.root;
  const left = el('div', 'interro-left panel', root);
  const portrait = el('canvas', 'interro-portrait', left);
  portrait.width = 64;
  portrait.height = 64;
  el('div', 'interro-name', left, def.title);
  const counter = el('div', 'interro-counter', left);
  const right = el('div', 'interro-right panel', root);
  const chat = el('div', 'interro-chat', right);
  chat.setAttribute('aria-live', 'polite');
  const chipsBox = el('div', 'interro-chips', right);
  const inputRow = el('div', 'interro-input', right);
  const input = el('input', 'interro-text', inputRow);
  input.type = 'text';
  input.maxLength = MAX_LEN;
  input.placeholder = 'Задай свой вопрос…';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Вопрос подозреваемому');
  const send = el('button', 'btn', inputRow, 'Спросить');
  send.type = 'button';
  const actions = el('div', 'interro-actions', right);
  const presentBtn = el('button', 'btn', actions, 'Предъявить улику');
  presentBtn.type = 'button';
  const hintBtn = el('button', 'btn', actions, 'Подсказка Байта');
  hintBtn.type = 'button';
  const picker = el('div', 'interro-picker panel', root);
  picker.hidden = true;

  let mood: Mood = 'neutral';
  let busy = false;
  const setMood = (m: Mood) => {
    mood = m;
    renderPortrait(portrait, npc, mood);
  };
  setMood('neutral');

  const scroll = () => (chat.scrollTop = chat.scrollHeight);

  const typeInto = (node: HTMLElement, text: string): Promise<void> =>
    new Promise((resolve) => {
      const speed = game.settings.data.textSpeed;
      if (speed === 'instant' || game.timeScale > 1) {
        node.textContent = text;
        resolve();
        return;
      }
      let i = 0;
      const timer = window.setInterval(() => {
        i += 2;
        node.textContent = text.slice(0, i);
        scroll();
        if (i >= text.length) done();
      }, 22);
      const done = () => {
        window.clearInterval(timer);
        node.textContent = text;
        root.removeEventListener('pointerdown', done);
        resolve();
      };
      root.addEventListener('pointerdown', done, { once: true });
    });

  const bubble = async (who: 'player' | 'npc', line: NpcLine | string): Promise<void> => {
    const l = typeof line === 'string' ? { text: line } : line;
    const b = el('div', `bubble bubble-${who}`, chat);
    el('div', 'bubble-who', b, who === 'npc' ? speaker.name : 'Ты');
    if (l.aside) el('div', 'bubble-aside', b, `(${l.aside})`);
    const t = el('div', 'bubble-text', b);
    scroll();
    await typeInto(t, l.text);
    history.push({ role: who, text: l.text });
    scroll();
  };

  const byteSay = async (text: string) => {
    if (game.store.state.byteSilent) {
      game.hud.pulseObjective();
      return;
    }
    await game.say({ who: 'byte', text });
    game.dialog.hide();
  };

  const refresh = () => {
    counter.textContent = `Вопросы: ${Math.min(progress.questionsUsed, def.maxQuestions)}/${def.maxQuestions}`;
    chipsBox.replaceChildren();
    for (const { intent, asked, disabled } of engine.chips()) {
      const b = el('button', 'btn chip', chipsBox, intent.chip);
      b.type = 'button';
      b.disabled = disabled || busy;
      if (asked) b.classList.add('asked');
      b.addEventListener('click', () => void ask(intent.chip ?? '', intent.id));
    }
    const free = engine.freeTextAllowed;
    input.disabled = !free || busy;
    send.disabled = !free || busy;
    if (!free) input.placeholder = 'Вопросы закончились — предъяви улику';
    presentBtn.disabled = busy;
    hintBtn.disabled = busy;
  };

  const pressure = (): 0 | 1 | 2 => (progress.wrongPresents >= 2 ? 2 : 1);

  const ask = async (question: string, intentId?: string) => {
    const q = question.trim();
    if (!q || busy) return;
    busy = true;
    refresh();
    await bubble('player', q);
    const res = engine.ask(q, intentId);
    if (res.kind === 'blocked') {
      game.hud.toast('Вопросы закончились — предъяви улику');
      busy = false;
      refresh();
      return;
    }
    let line: NpcLine = res.line;
    if (res.aiAllowed && aiClient.enabled) {
      const thinking = el('div', 'bubble bubble-npc thinking', chat);
      el('div', 'bubble-text', thinking, '…');
      scroll();
      const ai = await aiClient.ask({
        npc,
        question: q,
        history,
        stated: progress.stated,
        pressure: pressure(),
      });
      thinking.remove();
      if (ai) line = { text: ai };
    }
    await bubble('npc', line);
    if (res.byteAfter) await byteSay(res.byteAfter);
    busy = false;
    refresh();
    input.focus();
  };

  const present = async (clue: ClueId) => {
    picker.hidden = true;
    busy = true;
    refresh();
    game.bus.emit('clue:presented', { clue, npc });
    const res = engine.present(clue);
    const def2 = CLUES[clue];
    if (res.kind === 'solved') {
      setMood('nervous');
      await bubble('player', res.playerLine ?? def2.title);
      for (const l of res.npcLines ?? []) await bubble('npc', l);
      game.bus.emit('contradiction:solved', { npc, id: res.contradictionId ?? '' });
      game.audioHook?.('contradiction');
      if (res.broken) {
        setMood('broken');
        for (const l of def.breakLines) await bubble('npc', l);
        game.grantClue(def.givesClue);
        await game.wait(900);
        modal.close({ broken: true });
        return;
      }
    } else {
      await bubble('player', `Предъявляю: «${def2.title}».`);
      await bubble('npc', res.npcLine ?? def.wrongNpc);
      if (res.byteLine) await byteSay(res.byteLine);
    }
    busy = false;
    refresh();
  };

  presentBtn.addEventListener('click', () => {
    picker.replaceChildren();
    el('div', 'picker-title', picker, 'Какую улику предъявить?');
    const grid = el('div', 'picker-grid', picker);
    const owned = state.clues[epoch];
    if (owned.length === 0) el('div', 'picker-empty', picker, 'У тебя пока нет улик.');
    owned.forEach((id) => {
      const b = el('button', 'btn picker-card', grid);
      b.type = 'button';
      const ic = el('img', 'clue-icon', b);
      ic.src = iconUrl(CLUES[id].icon);
      ic.alt = '';
      el('div', 'picker-card-title', b, CLUES[id].title);
      b.addEventListener('click', () => void present(id));
    });
    const cancel = el('button', 'btn', picker, 'Отмена');
    cancel.type = 'button';
    cancel.addEventListener('click', () => (picker.hidden = true));
    picker.hidden = false;
    (grid.firstElementChild as HTMLElement | null)?.focus();
  });

  hintBtn.addEventListener('click', async () => {
    game.store.state.stats.hintsUsed++;
    busy = true;
    refresh();
    const missing = engine.missingStatements();
    if (missing.length > 0 && engine.questionsLeft > 0) {
      await byteSay('Пусть сам что-нибудь скажет. Задай ему готовые вопросы — потом сравним его слова с уликами.');
    } else {
      await byteSay('Сравни его слова с уликами. Что из найденного с ними не сходится?');
    }
    busy = false;
    refresh();
  });

  const submitTyped = () => {
    const v = input.value;
    input.value = '';
    void ask(v);
  };
  send.addEventListener('click', submitTyped);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitTyped();
    }
  });

  refresh();
  (chipsBox.firstElementChild as HTMLElement | null)?.focus();
  return modal.promise;
}
