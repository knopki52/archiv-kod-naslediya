import { cardArtUrl, choiceArtUrl } from './uiArt';
import { CARDS } from '../content/cards';
import { CLUES } from '../content/clues';
import type { ChoiceValue, EpochNo } from '../content/types';
import type { Game } from '../core/Game';
import { iconUrl } from '../gfx/icons';
import { openModal } from './Modal';
import { el } from './Ui';

const EPOCH_NAMES: Record<EpochNo, string> = { 1: 'Новгород', 2: 'Ленинград', 3: 'Байконур' };
const ARTIFACT_NAMES = { grain: 'Зерно', voices: 'Голоса', fire: 'Огонь' } as const;

export async function runEpochChoice(game: Game, epoch: EpochNo): Promise<ChoiceValue> {
  const modal = openModal<ChoiceValue>(game, `epoch-choice epoch-choice-ep${epoch}`);
  const root = modal.root;
  el('div', 'epoch-choice-title', root, 'Что оставить в памяти?');
  const row = el('div', 'epoch-choice-row', root);

  const mk = (value: ChoiceValue, label: string, caption: string) => {
    const b = el('button', `btn epoch-choice-btn ${value}`, row);
    b.type = 'button';
    b.disabled = true;
    el('div', `epoch-choice-art ${value}`, b).style.backgroundImage = `url(${choiceArtUrl(epoch as 1 | 2 | 3, value as 'truth' | 'agree')})`;
    el('div', 'epoch-choice-label', b, label);
    el('div', 'epoch-choice-caption', b, caption);
    b.addEventListener('click', () => {
      if (b.disabled) return;
      b.classList.add('chosen');
      row.classList.add('decided');
      window.setTimeout(() => modal.close(value), 500);
    });
    return b;
  };
  const truth = mk('truth', 'Вернуть правду', 'Настоящее — косое, шершавое, своё');
  const agree = mk('agree', 'Согласиться с Дублёром', 'Ровное и красивое — но чужое');
  window.setTimeout(() => {
    truth.disabled = false;
    agree.disabled = false;
    truth.focus();
  }, 600);

  const value = await modal.promise;
  game.store.apply({ choice: { epoch, value } });
  game.store.setFlag(`ep${epoch}.choice`, value);
  if (value === 'agree') game.store.apply({ byteSilent: true });
  game.bus.emit('choice:made', { epoch, value });
  return value;
}

export async function runTruthCard(game: Game, id: 1 | 2 | 3): Promise<void> {
  const def = CARDS[id];
  const modal = openModal<void>(game, `truth-card truth-card-${id}`, {
    onAction: (a) => a === 'interact' && ok.click(),
  });
  const card = el('div', 'truth-card-body panel', modal.root);
  el('div', 'truth-card-kicker', card, `Артефакт правды №${id}`);
  el('div', 'truth-card-title', card, def.title);
  el('div', 'truth-card-date', card, def.date);
  el('div', `truth-card-art art-${def.art}`, card).style.backgroundImage = `url(${cardArtUrl(def.art)})`;
  el('p', 'truth-card-text', card, def.text);
  const ok = el('button', 'btn', card, 'Забрать в витрину');
  ok.type = 'button';
  ok.addEventListener('click', () => modal.close());
  ok.focus();
  game.store.apply({ addCard: id });
  game.store.state.epochDone[id - 1] = true;
  game.bus.emit('card:gained', { id });
  game.audioHook?.('card');
  await modal.promise;
}

export async function runJournal(game: Game): Promise<void> {
  const state = game.store.state;
  const modal = openModal<void>(game, 'journal', { escapeValue: undefined, onAction: (a) => a === 'journal' && modal.close() });
  const panel = el('div', 'journal-body panel', modal.root);
  el('div', 'journal-title', panel, 'Журнал');
  for (const epoch of [1, 2, 3] as EpochNo[]) {
    const list = state.clues[epoch];
    if (list.length === 0) continue;
    const sec = el('div', 'journal-section', panel);
    el('div', 'journal-heading', sec, EPOCH_NAMES[epoch]);
    for (const id of list) {
      const c = CLUES[id];
      const item = el('div', `journal-clue ${c.kind}`, sec);
      const ic = el('img', 'clue-icon', item);
      ic.src = iconUrl(c.icon);
      ic.alt = '';
      el('div', 'journal-clue-title', item, c.title);
      el('div', 'journal-clue-text', item, c.text);
    }
  }
  if (state.cards.length) {
    const sec = el('div', 'journal-section', panel);
    el('div', 'journal-heading', sec, 'Артефакты правды');
    state.cards.forEach((id) => el('div', 'journal-clue true', sec, CARDS[id].title));
  }
  if (state.artifact) el('div', 'journal-artifact', panel, `Спасено в ночи: «${ARTIFACT_NAMES[state.artifact]}»`);
  if (state.clues[1].length + state.clues[2].length + state.clues[3].length === 0) {
    el('div', 'journal-empty', panel, 'Пока пусто. Улики появятся, когда ты найдёшь подмены.');
  }
  const close = el('button', 'btn', panel, 'Закрыть');
  close.type = 'button';
  close.addEventListener('click', () => modal.close());
  close.focus();
  await modal.promise;
}

export async function runCollection(game: Game): Promise<void> {
  const state = game.store.state;
  const modal = openModal<void>(game, 'collection', { escapeValue: undefined });
  el('div', 'journal-title', modal.root, 'Артефакты правды');
  const body = el('div', 'collection-body panel', modal.root);
  const row = el('div', 'collection-row', body);
  const detail = el('div', 'collection-detail', body);
  const show = (id: 1 | 2 | 3) => {
    detail.replaceChildren();
    const def = CARDS[id];
    el('div', 'truth-card-title', detail, def.title);
    el('div', 'truth-card-date', detail, def.date);
    el('p', 'truth-card-text', detail, def.text);
    if (id === 2 && state.artifact) {
      el('div', 'journal-artifact', detail, `Спасено в ночи: «${ARTIFACT_NAMES[state.artifact]}»`);
    }
  };
  ([1, 2, 3] as const).forEach((id) => {
    const owned = state.cards.includes(id);
    const b = el('button', `btn collection-slot${owned ? '' : ' locked'}`, row);
    b.type = 'button';
    b.disabled = !owned;
    el('div', `truth-card-art art-${CARDS[id].art}`, b).style.backgroundImage = owned ? `url(${cardArtUrl(CARDS[id].art)})` : '';
    el('div', 'collection-slot-title', b, owned ? CARDS[id].title : '???');
    b.addEventListener('click', () => show(id));
  });
  const first = state.cards[0];
  if (first) show(first);
  else el('div', 'journal-empty', detail, 'Пока пусто. Карточки правды появятся, когда ты спасёшь страницы истории.');
  const close = el('button', 'btn', body, 'Закрыть');
  close.type = 'button';
  close.addEventListener('click', () => modal.close());
  close.focus();
  await modal.promise;
}
