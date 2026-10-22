import { artUrl } from './uiArt';
import { finalArt } from '../gfx/td/art_slides';
import { AUTHORS, GAME_TITLE, SEEN_KEY, TEXT_SPEEDS, type TextSpeed } from '../config';
import type { Game } from '../core/Game';
import type { EndingId } from '../core/Save';
import { removeKey } from '../core/Storage';
import { openModal } from './Modal';
import { el } from './Ui';

export async function confirmDialog(game: Game, text: string, yes = 'Да', no = 'Отмена'): Promise<boolean> {
  const modal = openModal<boolean>(game, 'confirm', { escapeValue: false });
  const box = el('div', 'confirm-box panel', modal.root);
  el('p', 'confirm-text', box, text);
  const row = el('div', 'confirm-row', box);
  const n = el('button', 'btn', row, no);
  n.type = 'button';
  const y = el('button', 'btn', row, yes);
  y.type = 'button';
  n.addEventListener('click', () => modal.close(false));
  y.addEventListener('click', () => modal.close(true));
  n.focus();
  return modal.promise;
}

const SPEED_LABELS: Record<TextSpeed, string> = { slow: 'Медленно', normal: 'Обычно', fast: 'Быстро', instant: 'Мгновенно' };

export async function openSettings(game: Game): Promise<void> {
  const s = game.settings;
  const modal = openModal<void>(game, 'settings', { escapeValue: undefined });
  el('div', 'journal-title', modal.root, 'Настройки');
  const box = el('div', 'settings-box panel', modal.root);

  const slider = (label: string, key: 'music' | 'sfx') => {
    const row = el('label', 'settings-row', box);
    el('span', '', row, label);
    const input = el('input', 'settings-range', row);
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = String(Math.round(s.data[key] * 100));
    input.addEventListener('input', () => s.set(key, Number(input.value) / 100));
    input.addEventListener('change', () => game.audio.sfx.play('click'));
  };
  slider('Музыка', 'music');
  slider('Эффекты', 'sfx');

  const speedRow = el('div', 'settings-row', box);
  el('span', '', speedRow, 'Скорость текста');
  const group = el('div', 'settings-group', speedRow);
  (Object.keys(TEXT_SPEEDS) as TextSpeed[]).forEach((k) => {
    const b = el('button', 'btn', group, SPEED_LABELS[k]);
    b.type = 'button';
    const paint = () => b.classList.toggle('active', s.data.textSpeed === k);
    paint();
    b.addEventListener('click', () => {
      s.set('textSpeed', k);
      group.querySelectorAll('.btn').forEach((x) => x.classList.remove('active'));
      paint();
    });
  });

  const voiceRow = el('div', 'settings-row', box);
  el('span', '', voiceRow, 'Голоса');
  const vg = el('div', 'settings-group', voiceRow);
  const VOICE_LABELS = { speech: 'Речь', babble: 'Звуки', off: 'Выкл' } as const;
  (Object.keys(VOICE_LABELS) as (keyof typeof VOICE_LABELS)[]).forEach((k) => {
    const b = el('button', 'btn', vg, VOICE_LABELS[k]);
    b.type = 'button';
    b.title = k === 'speech' ? (game.audio.voice.hasSpeech ? 'Синтез речи системы' : 'В системе нет русского голоса — будут «звуки»') : '';
    const paint = () => b.classList.toggle('active', s.data.voices === k);
    paint();
    b.addEventListener('click', () => {
      s.set('voices', k);
      vg.querySelectorAll('.btn').forEach((x) => x.classList.remove('active'));
      paint();
      game.audio.voice.stop();
      if (k === 'speech') game.audio.voice.line('byte', 'Так я звучу.', 'normal');
    });
  });

  const toggle = (label: string, key: 'showObjective' | 'reducedEffects' | 'largeText', hint?: string) => {
    const row = el('label', 'settings-row', box);
    el('span', '', row, label);
    if (hint) el('small', 'settings-hint', row, hint);
    const c = el('input', 'settings-check', row);
    c.type = 'checkbox';
    c.checked = s.data[key];
    c.addEventListener('change', () => s.set(key, c.checked));
  };
  toggle('Показывать цель', 'showObjective');
  toggle('Меньше эффектов', 'reducedEffects', 'без вспышек, тряски и глитча');
  toggle('Крупный текст', 'largeText');

  const reset = el('button', 'btn settings-reset', box, 'Стереть все данные');
  reset.type = 'button';
  reset.addEventListener('click', async () => {
    if (!(await confirmDialog(game, 'Стереть сохранение, настройки и открытые концовки?', 'Стереть'))) return;
    game.save.clear();
    game.save.clearEndings();
    removeKey(SEEN_KEY);
    game.hud.toast('Данные стёрты');
  });
  const close = el('button', 'btn', box, 'Закрыть');
  close.type = 'button';
  close.addEventListener('click', () => modal.close());
  close.focus();
  await modal.promise;
}

const ENDINGS: Record<EndingId, { title: string; text: string }> = {
  keeper: { title: 'Хранитель', text: 'Архив хранит всё, но в нём нет милосердия — только факты. Честно и очень одиноко.' },
  merge: { title: 'Слияние', text: 'Боль и память примирились. Помнить — и прощать.' },
  editor: { title: 'Редактор', text: 'Всё стало лучше. Только имя мальчика с грамотой уже не вспомнить.' },
};

export async function openEndings(game: Game): Promise<void> {
  const seen = game.save.endingsSeen();
  const modal = openModal<void>(game, 'endings', { escapeValue: undefined });
  el('div', 'journal-title', modal.root, 'Концовки');
  const box = el('div', 'endings-box panel', modal.root);
  const row = el('div', 'collection-row', box);
  (Object.keys(ENDINGS) as EndingId[]).forEach((id) => {
    const open = seen.includes(id);
    const card = el('div', `ending-card${open ? '' : ' locked'}`, row);
    el('div', 'core-choice-art ending-art', card).style.backgroundImage = `url(${artUrl('final' + id, () => finalArt(id as 'merge' | 'keeper' | 'editor'))})`;
    el('div', 'ending-title', card, open ? ENDINGS[id].title : '?');
    el('p', 'ending-text', card, open ? ENDINGS[id].text : 'Пока не открыта.');
  });
  el('p', 'ending-hint', box, `Открыто: ${seen.length} из 3`);
  const close = el('button', 'btn', box, 'Закрыть');
  close.type = 'button';
  close.addEventListener('click', () => modal.close());
  close.focus();
  await modal.promise;
}

export async function openAbout(game: Game): Promise<void> {
  const modal = openModal<void>(game, 'about', { escapeValue: undefined });
  el('div', 'journal-title', modal.root, 'Об игре');
  const box = el('div', 'about-box panel', modal.root);
  const sec = (h: string, lines: string[]) => {
    el('div', 'journal-heading', box, h);
    lines.forEach((l) => el('p', 'about-line', box, l));
  };
  sec(GAME_TITLE, [
    'Игра-расследование о том, что историю нельзя «причёсывать». Три страницы прошлого, одна подмена в каждой и твой выбор.',
  ]);
  sec('Управление', [
    'ПК: WASD или стрелки — ходьба, E или Enter — действие, J — журнал улик, Esc — меню.',
    'Телефон (горизонтально): джойстик слева, кнопка «E» справа, касание по объекту или диалогу.',
  ]);
  sec('Авторы', AUTHORS);
  sec('Технологии и лицензии', [
    'Phaser (MIT). Шрифты PT Sans, Press Start 2P, Caveat — SIL Open Font License.',
    'Вся графика и весь звук созданы кодом специально для этой игры. Внешних картинок и аудиофайлов нет.',
  ]);
  sec('Приватность', [
    'Игра не собирает персональные данные. Сохранения лежат только в твоём браузере.',
    'При наличии интернета вопросы в допросе отправляются на сервер нейросети только для получения ответа и нигде не сохраняются.',
  ]);
  const close = el('button', 'btn', box, 'Закрыть');
  close.type = 'button';
  close.addEventListener('click', () => modal.close());
  close.focus();
  await modal.promise;
}

export async function openPause(game: Game): Promise<'resume' | 'menu'> {
  const modal = openModal<'resume' | 'menu'>(game, 'pause', { escapeValue: 'resume' });
  const box = el('div', 'menu-box panel', modal.root);
  el('div', 'menu-title', box, 'Пауза');
  const mk = (label: string, fn: () => void | Promise<void>) => {
    const b = el('button', 'btn menu-btn', box, label);
    b.type = 'button';
    b.addEventListener('click', () => void fn());
    return b;
  };
  const first = mk('Продолжить', () => modal.close('resume'));
  mk('Журнал улик', () => game.openJournal());
  mk('Настройки', () => openSettings(game));
  mk('В главное меню', async () => {
    if (await confirmDialog(game, 'Выйти в меню? Прогресс сохранён на последнем чекпоинте.', 'Выйти')) modal.close('menu');
  });
  first.focus();
  return modal.promise;
}
