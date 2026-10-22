import { LOUPE, type LoupeHotspot, type LoupeObject } from '../content/loupe';
import type { Game } from '../core/Game';
import { drawLoupeArt, LOUPE_H, LOUPE_W } from '../gfx/loupeArt';
import { openModal } from './Modal';
import { el } from './Ui';

const BASE_SCALE = 2;
const LENS_R = 54;
const ZOOM = 2.2;
const DWELL_MS = 800;

export async function runLoupe(game: Game, objectId: string): Promise<void> {
  const obj = LOUPE[objectId];
  if (!obj) throw new Error(`[Loupe] нет объекта «${objectId}»`);
  if (obj.mode === 'questions') return runQuestions(game, obj);
  return runHotspots(game, obj);
}

function buildFrame(game: Game, obj: LoupeObject) {
  const modal = openModal<void>(game, 'loupe');
  const title = el('div', 'loupe-title', modal.root, obj.title);
  title.setAttribute('role', 'heading');
  const stageBox = el('div', 'loupe-stage panel', modal.root);
  const cw = LOUPE_W * BASE_SCALE;
  const ch = LOUPE_H * BASE_SCALE;
  const canvas = el('canvas', 'loupe-canvas', stageBox);
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const base = document.createElement('canvas');
  base.width = cw;
  base.height = ch;
  drawLoupeArt(obj.art, base.getContext('2d')!, BASE_SCALE, false);
  const hi = document.createElement('canvas');
  hi.width = cw * 2;
  hi.height = ch * 2;
  drawLoupeArt(obj.art, hi.getContext('2d')!, BASE_SCALE * 2, true);
  const stamp = el('div', 'loupe-stamp', stageBox, obj.verdict);
  stamp.hidden = true;
  const plaque = el('div', 'loupe-plaque panel', modal.root);
  plaque.hidden = true;
  return { modal, canvas, ctx, base, hi, stamp, plaque, stageBox, cw, ch };
}

async function showStamp(game: Game, stamp: HTMLElement): Promise<void> {
  stamp.hidden = false;
  stamp.classList.add('slam');
  await game.wait(1200);
}

async function runQuestions(game: Game, obj: LoupeObject): Promise<void> {
  const f = buildFrame(game, obj);
  const { modal, ctx, base } = f;
  ctx.drawImage(base, 0, 0);
  const qs = obj.questions ?? [];
  const answers = el('div', 'loupe-answers panel', modal.root);
  const row = el('div', 'loupe-questions', modal.root);
  let done = 0;
  const buttons = qs.map((q) => {
    const b = el('button', 'btn', row, q.q);
    b.type = 'button';
    b.addEventListener('click', async () => {
      if (b.disabled) return;
      b.disabled = true;
      b.classList.add('locked');
      el('div', 'loupe-answer', answers, `${q.q} — ${q.a}`);
      game.audioHook?.('loupe_scan');
      done++;
      if (done === qs.length) {
        row.hidden = true;
        await game.wait(500);
        await showStamp(game, f.stamp);
        if (obj.verdictByte) await game.say({ who: 'byte', text: obj.verdictByte });
        game.dialog.hide();
        modal.close();
      }
    });
    return b;
  });
  buttons[0]?.focus();
  await modal.promise;
}

async function runHotspots(game: Game, obj: LoupeObject): Promise<void> {
  const f = buildFrame(game, obj);
  const { modal, canvas, ctx, base, hi, stamp, plaque, cw, ch } = f;
  const spots = obj.hotspots ?? [];
  const found = new Set<string>();
  const required = spots.filter((s) => s.clue);
  const already = (s: LoupeHotspot) => (s.clue ? game.store.hasClue(s.clue) : false);
  spots.forEach((s) => already(s) && found.add(s.id));

  const lens = { x: cw / 2, y: ch / 2 };
  let hoverSpot: LoupeHotspot | null = null;
  let dwellStart = 0;
  let busy = false;
  let hintSpot: LoupeHotspot | null = null;
  let idleMs = 0;
  let raf: number;
  let last = performance.now();
  let finished = false;

  const hitTest = (): LoupeHotspot | null => {
    const lx = lens.x / BASE_SCALE;
    const ly = lens.y / BASE_SCALE;
    let best: LoupeHotspot | null = null;
    let bd = Infinity;
    for (const s of spots) {
      if (found.has(s.id)) continue;
      const d = Math.hypot(s.x - lx, s.y - ly);
      if (d <= s.r && d < bd) {
        best = s;
        bd = d;
      }
    }
    return best;
  };

  const render = (now: number) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(base, 0, 0);
    for (const s of spots) {
      if (!found.has(s.id)) continue;
      ctx.strokeStyle = '#7dffb0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x * BASE_SCALE, s.y * BASE_SCALE, s.r * BASE_SCALE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (hintSpot && !found.has(hintSpot.id)) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 180);
      ctx.strokeStyle = `rgba(255, 211, 107, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hintSpot.x * BASE_SCALE, hintSpot.y * BASE_SCALE, hintSpot.r * BASE_SCALE * (1 + pulse * 0.2), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, LENS_R, 0, Math.PI * 2);
    ctx.clip();
    const src = (2 * LENS_R * 2) / ZOOM;
    ctx.drawImage(hi, lens.x * 2 - src / 2, lens.y * 2 - src / 2, src, src, lens.x - LENS_R, lens.y - LENS_R, LENS_R * 2, LENS_R * 2);
    ctx.restore();
    const near = hitTest();
    ctx.strokeStyle = near ? '#ffd36b' : '#5fe3ff';
    ctx.lineWidth = near ? 4 : 3;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, LENS_R, 0, Math.PI * 2);
    ctx.stroke();
    if (near && dwellStart) {
      const p = Math.min(1, (performance.now() - dwellStart) / DWELL_MS);
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, LENS_R + 7, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }
  };

  const examine = async (s: LoupeHotspot) => {
    if (busy || found.has(s.id)) return;
    busy = true;
    found.add(s.id);
    hintSpot = null;
    plaque.hidden = false;
    plaque.textContent = s.label;
    game.audioHook?.('clue');
    if (s.clue) game.grantClue(s.clue);
    await game.say({ who: s.who ?? 'byte', text: s.byteLine });
    game.dialog.hide();
    plaque.hidden = true;
    busy = false;
    idleMs = 0;
    if (required.every((r) => found.has(r.id))) {
      finished = true;
      await showStamp(game, stamp);
      modal.close();
    }
  };

  const loop = (now: number) => {
    if (modal.closed) return;
    const dt = now - last;
    last = now;
    const near = busy || finished ? null : hitTest();
    if (near !== hoverSpot) {
      hoverSpot = near;
      dwellStart = near ? now : 0;
      if (near) game.audioHook?.('loupe_ping');
    } else if (near && dwellStart && now - dwellStart >= DWELL_MS) {
      dwellStart = 0;
      void examine(near);
    }
    if (!busy && !finished) {
      idleMs += dt * game.timeScale;
      if (idleMs > 20000 && !hintSpot) hintSpot = spots.find((s) => !found.has(s.id) && s.clue) ?? null;
    }
    render(now);
    raf = requestAnimationFrame(loop);
  };

  const toLens = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    lens.x = Math.max(0, Math.min(cw, ((e.clientX - r.left) / r.width) * cw));
    lens.y = Math.max(0, Math.min(ch, ((e.clientY - r.top) / r.height) * ch));
    idleMs = 0;
  };
  canvas.addEventListener('pointermove', toLens);
  canvas.addEventListener('pointerdown', (e) => {
    toLens(e);
    const s = hitTest();
    if (s) void examine(s);
  });
  canvas.style.touchAction = 'none';

  const kb = (e: KeyboardEvent) => {
    const step = 8;
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') lens.x = Math.max(0, lens.x - step);
    else if (k === 'ArrowRight' || k === 'KeyD') lens.x = Math.min(cw, lens.x + step);
    else if (k === 'ArrowUp' || k === 'KeyW') lens.y = Math.max(0, lens.y - step);
    else if (k === 'ArrowDown' || k === 'KeyS') lens.y = Math.min(ch, lens.y + step);
    else return false;
    idleMs = 0;
    return true;
  };
  const release = game.input.push({
    blocksMove: true,
    key: kb,
    action: (a) => {
      if (a === 'interact') {
        const s = hitTest();
        if (s) void examine(s);
      }
      return true;
    },
  });
  const hintBtn = el('button', 'btn loupe-hint', modal.root, 'Подсказка');
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    hintSpot = spots.find((s) => !found.has(s.id) && s.clue) ?? null;
  });

  if (required.every((r) => found.has(r.id))) {
    finished = true;
    void showStamp(game, stamp).then(() => modal.close());
  }

  raf = requestAnimationFrame(loop);
  await modal.promise;
  cancelAnimationFrame(raf);
  release();
}
