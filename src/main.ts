import Phaser from 'phaser';
import './ui/styles/base.css';
import './ui/styles/screens.css';
import './ui/styles/td.css';
import { installUiArt } from './ui/uiArt';
import { VIEW_H, VIEW_W } from './config';
import { LAB_SCRIPT } from './content/lab';
import { EPOCH1_SCRIPT } from './content/epoch1';
import { EPOCH2_SCRIPT } from './content/epoch2';
import { CORE_SCRIPT } from './content/core';
import { EPOCH3_SCRIPT } from './content/epoch3';
import { HUB_SCRIPT, PROLOGUE_SCRIPT } from './content/hall';
import { TEST_SCRIPT } from './content/test';
import { installDebug } from './core/Debug';
import { Game } from './core/Game';
import { BootScene } from './world/BootScene';
import { GalleryScene } from './world/GalleryScene';
import { ArchiveHall } from './world/locations/ArchiveHall';
import { BAIK_SCENES } from './world/locations/BaikScenes';
import { CoreScene } from './world/locations/CoreScene';
import { LEN_SCENES } from './world/locations/LenScenes';
import { NOV_SCENES } from './world/locations/NovScenes';
import { TestScene } from './world/TestScene';
import { TitleScene } from './world/TitleScene';

function boot(): void {
  installUiArt();
  try {
    for (const f of ["700 12px Caveat", "400 12px Caveat", "400 12px \"PT Sans\"", "700 12px \"PT Sans\"", "12px \"Press Start 2P\""]) void document.fonts.load(f, "Аа");
  } catch {
      void 0;
  }
  const game = new Game();
  game.registerScript('test', TEST_SCRIPT);
  game.registerScript('lab', LAB_SCRIPT);
  game.registerScript('prologue', PROLOGUE_SCRIPT);
  game.registerScript('hub', HUB_SCRIPT);
  game.registerScript('epoch1', EPOCH1_SCRIPT);
  game.registerScript('epoch2', EPOCH2_SCRIPT);
  game.registerScript('epoch3', EPOCH3_SCRIPT);
  game.registerScript('core', CORE_SCRIPT);
  const cp = (id: string, scene: string, extra: { ref?: string; params?: Record<string, unknown> } = {}) =>
    game.checkpoints.set(id, { scene, ...extra });
  cp('e1.start', 'nov_square', { ref: 'epoch1#start' });
  cp('e1.met', 'nov_square');
  cp('e1.chest', 'nov_house');
  cp('e1.bakery', 'nov_bakery');
  cp('e1.guest', 'nov_square');
  cp('e1.minigame', 'nov_square');
  cp('e1.workshop', 'nov_workshop');
  cp('e1.interrogation', 'nov_workshop', { ref: 'epoch1#toBoard' });
  cp('e1.board', 'nov_square', { params: { stage: 'finale' } });
  cp('e1.finale', 'nov_square', { params: { stage: 'finale' } });
  cp('e1.choice', 'nov_square', { ref: 'epoch1#afterChoiceResume', params: { stage: 'finale' } });
  cp('e1.end', 'archive_hall', { params: { hubReturn: 1 } });
  cp('e2.start', 'len_hall', { ref: 'epoch2#start' });
  cp('e2.met', 'len_hall');
  cp('e2.diary', 'len_hall');
  cp('e2.maria', 'len_hall');
  cp('e2.minigame', 'len_hall');
  cp('e2.yard', 'len_yard');
  cp('e2.interrogation', 'len_yard', { ref: 'epoch2#toBoard' });
  cp('e2.board', 'len_hall', { params: { stage: 'finale' } });
  cp('e2.finale', 'len_hall', { params: { stage: 'finale' } });
  cp('e2.choice', 'len_hall', { ref: 'epoch2#afterChoiceResume', params: { stage: 'finale' } });
  cp('e2.afterChoice', 'len_cellar');
  cp('e2.night', 'len_cellar');
  cp('e2.saved', 'archive_hall', { params: { hubReturn: 2 } });
  cp('e2.end', 'archive_hall', { params: { hubReturn: 2 } });
  cp('e3.start', 'bk_pad', { ref: 'epoch3#start' });
  cp('e3.met', 'bk_bunker');
  cp('e3.inspect', 'bk_bunker');
  cp('e3.pad', 'bk_pad');
  cp('e3.minigame', 'bk_comms');
  cp('e3.interrogation', 'bk_bunker', { ref: 'epoch3#toBoard' });
  cp('e3.board', 'bk_bunker', { params: { stage: 'finale' } });
  cp('e3.finale', 'bk_bunker', { params: { stage: 'finale' } });
  cp('e3.choice', 'bk_bunker', { ref: 'epoch3#afterChoiceResume', params: { stage: 'finale' } });
  cp('e3.afterChoice', 'bk_pad', { params: { stage: 'launch' } });
  cp('e3.end', 'archive_hall', { params: { hubReturn: 3 } });
  cp('core.start', 'core', { ref: 'core#enter' });
  cp('core.memories', 'core', { ref: 'core#letaLines' });
  cp('core.choice', 'core', { ref: 'core#finalChoice' });
  cp('core.decided', 'core', { ref: 'core#route' });
  cp('core.end', 'archive_hall');
  game.checkpoints.set('pro.start', { scene: 'archive_hall' });
  for (const id of ['pro.book', 'pro.loupe', 'pro.end', 'hub.afterE1', 'hub.afterE2', 'hub.afterE3']) {
    game.checkpoints.set(id, { scene: 'archive_hall' });
  }
  game.checkpoints.set('test.start', { scene: 'test', ref: 'test#start' });
  game.checkpoints.set('test.book', { scene: 'test' });

  game.phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: '#0d0b1e',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, ArchiveHall, ...NOV_SCENES, ...LEN_SCENES, ...BAIK_SCENES, CoreScene, TestScene, GalleryScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set('game', game);
        const q = new URLSearchParams(location.search);
        g.registry.set('startScene', q.get('gallery') === '1' ? 'gallery' : (q.get('scene') ?? 'title'));
      },
    },
  });

  const overlay = document.getElementById('rotate-overlay') as HTMLElement;
  const checkOrientation = () => {
    const portrait = window.innerHeight > window.innerWidth * 1.05;
    overlay.hidden = !portrait;
    game.bus.emit('orientation:blocked', { blocked: portrait });
    if (portrait) game.phaser.loop.sleep();
    else game.phaser.loop.wake();
  };
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();

  installDebug(game);

  const unlock = () => game.bus.emit('audio:unlock');
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

boot();
