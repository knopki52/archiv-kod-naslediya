import { AUTHORS, GAME_TITLE } from '../config';
import { availableFinals } from '../core/State';
import type { Game } from '../core/Game';
import type { EndingId } from '../core/Save';
import { artUrl } from './uiArt';
import { finalArt, slideBirchPx, slideMetronomePx, slideVostokPx } from '../gfx/td/art_slides';
const slideBirch = () => slideBirchPx(false).toCanvas();
const slideMetronome = () => slideMetronomePx().toCanvas();
const slideVostok = () => slideVostokPx(true).toCanvas();
import { openEndings } from './Menus';
import { openModal } from './Modal';
import { el } from './Ui';

export class FrameOverlay {
  private root: HTMLElement;
  private img: HTMLImageElement;
  private cap: HTMLElement;

  constructor(private game: Game, mode: 'full' | 'inset' = 'full') {
    this.root = el('div', `frame-overlay ${mode}`, game.ui.layers.hud);
    this.img = el('img', 'frame-img', this.root);
    this.img.alt = '';
    this.cap = el('div', 'frame-caption', this.root);
    this.root.classList.add('hidden');
  }

  show(url: string, caption = '', cls = ''): void {
    this.img.src = url;
    this.cap.textContent = caption;
    this.cap.hidden = !caption;
    this.root.className = this.root.className.replace(/\bfx-\S+/g, '').trim();
    if (cls) this.root.classList.add(cls);
    this.root.classList.remove('hidden');
    if (!this.game.settings.data.reducedEffects) {
      this.root.classList.remove('flicker');
      void this.root.offsetWidth;
      this.root.classList.add('flicker');
    }
  }

  hide(): void {
    this.root.classList.add('hidden');
  }

  add<T extends HTMLElement>(node: T): T {
    this.root.appendChild(node);
    return node;
  }

  destroy(): void {
    this.root.remove();
  }
}

export type FinalPick = 'merge' | 'keeper' | 'editor';

export async function runCoreChoice(game: Game): Promise<FinalPick> {
  const avail = availableFinals(game.store.state.integrity);
  const modal = openModal<FinalPick>(game, 'core-choice');
  el('div', 'epoch-choice-title', modal.root, 'Что станет с Архивом?');
  const row = el('div', 'core-choice-row', modal.root);
  const defs: { id: FinalPick; label: string; caption: string; ok: boolean; cls: string }[] = [
    { id: 'merge', label: 'Слиться', caption: 'Помнить и прощать — вместе', ok: avail.merge, cls: 'warm' },
    { id: 'keeper', label: 'Стереть Лету', caption: 'Хранить всё, как было', ok: avail.erase, cls: 'cold' },
    { id: 'editor', label: 'Согласиться с Летой', caption: 'Пусть будет без боли', ok: avail.agree, cls: 'gold' },
  ];
  const buttons: HTMLButtonElement[] = [];
  for (const d of defs) {
    const b = el('button', `btn core-choice-btn ${d.cls}${d.ok ? '' : ' locked'}`, row);
    b.type = 'button';
    b.dataset.final = d.id;
    el('div', 'core-choice-art', b).style.backgroundImage = `url(${artUrl('final' + d.id, () => finalArt(d.id))})`;
    el('div', 'core-choice-label', b, d.ok ? d.label : `🔒 ${d.label}`);
    if (d.ok) el('div', 'core-choice-caption', b, d.caption);
    b.disabled = true;
    b.addEventListener('click', () => {
      if (b.disabled || !d.ok) return;
      row.classList.add('decided');
      b.classList.add('chosen');
      window.setTimeout(() => modal.close(d.id), 500);
    });
    buttons.push(b);
  }
  window.setTimeout(() => {
    buttons.forEach((b, i) => {
      if (defs[i]!.ok) b.disabled = false;
    });
    buttons.find((b) => !b.disabled)?.focus();
  }, 600);
  return modal.promise;
}

const SLIDES: { make: () => string; text: string }[] = [
  { make: () => slideBirch().toDataURL(), text: 'Берестяная грамота — письмо, нацарапанное на коре. Новгородцы писали их и в быту, и по делу.' },
  { make: () => slideMetronome().toDataURL(), text: 'В блокадном Ленинграде по радио стучал метроном: быстрый ритм означал тревогу, медленный — отбой. Пока он стучал, город был на связи.' },
  { make: () => slideVostok().toDataURL(), text: '12 апреля 1961 года «Восток» стартовал с Байконура. Полёт длился 108 минут.' },
];

const SLIDE_MS = 6000;
const LAST_MS = 7500;
const SKIP_AFTER_MS = 3000;

export async function runPostCredits(game: Game, ending: EndingId): Promise<'menu' | 'again'> {
  const modal = openModal<'menu' | 'again'>(game, 'postcredits');
  const stage = el('div', 'pc-stage', modal.root);
  const img = el('img', 'pc-img', stage);
  img.alt = '';
  const text = el('p', 'pc-text', stage);
  const skip = el('button', 'btn pc-skip', modal.root, 'Пропустить ⏭');
  skip.type = 'button';
  skip.hidden = true;
  let skipped = false;
  let skipNow!: () => void;
  const skipSignal = new Promise<void>((r) => (skipNow = r));
  skip.addEventListener('click', () => {
    skipped = true;
    skipNow();
  });
  const showSkip = window.setTimeout(() => (skip.hidden = false), SKIP_AFTER_MS / game.timeScale);

  const wait = (ms: number) => Promise.race([game.wait(ms), skipSignal]);
  const slideUrls = SLIDES.map((s) => s.make());
  for (let i = 0; i < SLIDES.length && !skipped; i++) {
    stage.classList.remove('in');
    img.src = slideUrls[i]!;
    text.textContent = SLIDES[i]!.text;
    void stage.offsetWidth;
    stage.classList.add('in');
    await wait(SLIDE_MS);
  }
  if (!skipped) {
    stage.classList.remove('in');
    img.hidden = true;
    text.textContent = '';
    const sign = el('p', 'pc-sign', stage, 'Правду не всегда удобно помнить. Но без неё помнить нечего.');
    void sign.offsetWidth;
    stage.classList.add('in');
    await wait(LAST_MS);
  }
  window.clearTimeout(showSkip);
  skip.remove();
  stage.remove();

  const credits = el('div', 'pc-credits', modal.root);
  el('div', 'pc-title', credits, GAME_TITLE);
  const authors = AUTHORS.filter((a) => !/^TODO/i.test(a));
  const sec = (h: string, lines: string[]) => {
    el('div', 'pc-h', credits, h);
    lines.forEach((l) => el('p', 'pc-line', credits, l));
  };
  sec('Авторы', authors.length ? authors : ['Команда проекта']);
  sec('Факты', [
    'Новгородские берестяные грамоты (XIII век), блокада Ленинграда (1941), полёт «Востока» (12 апреля 1961) — по открытым историческим источникам.',
  ]);
  sec('Технологии и лицензии', [
    'Phaser, Vite — лицензия MIT. Шрифты PT Sans, Press Start 2P, Caveat — SIL Open Font License.',
    'Вся графика и весь звук созданы кодом специально для этой игры.',
  ]);
  sec('Благодарности', ['Тем, кто хранит память — честно и без причёсывания.']);
  const row = el('div', 'pc-row', credits);
  const mk = (label: string, value: 'menu' | 'again' | 'endings') => {
    const b = el('button', 'btn', row, label);
    b.type = 'button';
    b.dataset.after = value;
    b.addEventListener('click', () => {
      if (value === 'endings') void openEndings(game);
      else modal.close(value);
    });
    return b;
  };
  const first = mk('В меню', 'menu');
  mk('Играть снова', 'again');
  mk('Открытые концовки', 'endings');
  el('p', 'pc-ending', credits, `Открыто концовок: ${game.save.endingsSeen().length} из 3 (эта — «${ENDING_NAMES[ending]}»)`);
  first.focus();
  return modal.promise;
}

const ENDING_NAMES: Record<EndingId, string> = { keeper: 'Хранитель', merge: 'Слияние', editor: 'Редактор' };
