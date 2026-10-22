import Phaser from 'phaser';
import { CLUES } from '../content/clues';
import type { ChoiceOption, ChoiceStep, ClueId, SayInput, Script, Step } from '../content/types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { DialogBox } from '../ui/DialogBox';
import { Hud, TouchControls } from '../ui/Hud';
import { Ui } from '../ui/Ui';
import { AudioEngine } from '../audio/AudioEngine';
import { HINT_RULES } from '../content/hints';
import { openPause } from '../ui/Menus';
import { runBoard } from '../ui/Board';
import { runInterrogation } from '../ui/Interrogation';
import { runLoupe } from '../ui/Loupe';
import { runBirchBark } from '../ui/minigames/BirchBark';
import { runControlPanel } from '../ui/minigames/ControlPanel';
import { runPencilReveal } from '../ui/minigames/PencilReveal';
import { runEpochChoice, runJournal, runTruthCard } from '../ui/Screens';
import { Director, type DirectorHost } from './Director';
import { HintManager } from './Hints';
import { EventBus } from './EventBus';
import { Input } from './Input';
import { SaveManager } from './Save';
import { Settings } from './Settings';
import { Store } from './Store';

export interface WorldHost {
  perform(step: Step): Promise<boolean>;
  highlight?(targetId: string, fly: boolean): void;
  call?(name: string, args?: Record<string, unknown>): Promise<void>;
  setTalking?(who: string, on: boolean): void;
  playerPos?(): { x: number; y: number };
  setPlayerPos?(x: number, y?: number): void;
}

export class Game implements DirectorHost {
  readonly bus = new EventBus();
  readonly store = new Store(this.bus);
  readonly save = new SaveManager(this.bus);
  readonly settings = new Settings();
  readonly input = new Input();
  readonly ui = new Ui();
  readonly dialog = new DialogBox(this.ui, this.input, this.settings);
  readonly choiceMenu = new ChoiceMenu(this.ui, this.input);
  readonly hud = new Hud(this.ui, this.bus, this.settings);
  readonly touch = new TouchControls(this.ui, this.input);
  readonly director = new Director(this, this.store, this.bus);
  readonly hints = new HintManager(this);
  readonly hintRules = HINT_RULES;
  readonly audio = new AudioEngine(this.settings, this.bus);

  phaser!: Phaser.Game;
  world: (Phaser.Scene & WorldHost) | null = null;
  timeScale = 1;
  audioHook: ((name: string) => void) | null = (name) => this.audio.sfx.play(name);
  readonly checkpoints = new Map<string, { scene: string; ref?: string; params?: Record<string, unknown> }>();

  private freeRelease: (() => void) | null = null;
  private lockRelease: (() => void) | null = null;
  private playClock = performance.now();

  constructor() {
    this.dialog.timeScale = () => this.timeScale;
    this.dialog.onLine = (who, on) => {
      this.world?.setTalking?.(who, on);
      this.audio.duck(on);
    };
    this.bus.on('state:changed', () => this.hud.setLoupe(Boolean(this.store.state.flags['hasLoupe'])));
    this.hud.showMenuButton(false, () => void this.openPause());
    this.dialog.onBlip = (who, ch) => {
      if (this.settings.data.voices === 'off') return;
      this.audio.voice.babble(who, ch);
    };
    this.dialog.onSpeak = (who, text, mood) => {
      this.audio.voice.line(who, text, mood);
    };
    this.dialog.onSilence = () => this.audio.voice.stop();
    this.ui.root.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.btn, .card, .birch-piece')) this.audio.sfx.play('click');
    });
    window.setInterval(() => {
      const now = performance.now();
      this.store.state.stats.playMs += now - this.playClock;
      this.playClock = now;
    }, 5000);
    window.setInterval(() => this.hints.tick(1 * this.timeScale), 1000);
    const act = () => this.hints.activity();
    window.addEventListener('pointerdown', act);
    window.addEventListener('keydown', act);
    this.bus.on('clue:gained', act);
    this.bus.on('scene:enter', () => this.hints.reset());
  }

  registerScript(id: string, script: Script): void {
    this.director.register(id, script);
  }

  async say(step: SayInput): Promise<void> {
    await this.dialog.show(step);
  }

  choice(step: ChoiceStep, visible: ChoiceOption[]): Promise<ChoiceOption> {
    this.dialog.hide();
    return this.choiceMenu.choose(step, visible);
  }

  async perform(step: Step): Promise<void> {
    switch (step.t) {
      case 'giveClue': {
        const def = CLUES[step.clue];
        this.hud.toast(`Новая улика: ${def.title}`, 'clue', 3200);
        return;
      }
      case 'scene':
        this.goto(step.to, step.params);
        return;
      case 'call':
        await this.world?.call?.(step.name, step.args);
        return;
      case 'sfx':
        this.audio.sfx.play(step.name);
        return;
      case 'music':
        this.audio.music.play(step.track, step.fade ?? 1.5);
        return;
      case 'ambience':
        if (step.name === 'metronome_on') this.audio.metronome.start(60);
        else if (step.name === 'metronome_off') this.audio.metronome.stop();
        else if (step.name === 'metronome_freeze') this.audio.metronome.freeze(1);
        else this.audio.ambience.set(step.name === 'none' ? null : step.name);
        return;
      case 'hintRule':
        this.hints.setRule(HINT_RULES[step.rule] && step.rule !== 'none' ? HINT_RULES[step.rule]! : null);
        return;
      case 'loupe':
        await runLoupe(this, step.object);
        return;
      case 'minigame': {
        const run = { birch: runBirchBark, pencil: runPencilReveal, panel: runControlPanel }[step.id];
        const res = await run(this);
        this.store.setFlag(`minigame.${step.id}`, res.skipped ? 'skipped' : 'done');
        return;
      }
      case 'interrogate': {
        const res = await runInterrogation(this, step.npc);
        this.store.setFlag(`interrogation.${step.npc}`, res.broken);
        return;
      }
      case 'board':
        await runBoard(this, step.epoch);
        this.store.setFlag(`ep${step.epoch}.boardDone`, true);
        return;
      case 'epochChoice':
        await runEpochChoice(this, step.epoch);
        return;
      case 'card':
        await runTruthCard(this, step.id);
        return;
      default: {
        const handled = (await this.world?.perform(step)) ?? false;
        if (!handled) console.warn(`[Game] шаг «${step.t}» не обработан`);
      }
    }
  }

  grantClue(clue: ClueId): void {
    if (this.store.giveClue(clue)) this.hud.toast(`Новая улика: ${CLUES[clue].title}`, 'clue', 3200);
  }

  screenGlitch(ms = 220): void {
    if (this.settings.data.reducedEffects) return;
    this.ui.stage.classList.add('glitch');
    window.setTimeout(() => this.ui.stage.classList.remove('glitch'), ms);
  }

  openJournal(): Promise<void> {
    return runJournal(this);
  }

  get busy(): boolean {
    return this.dialog.isOpen || this.choiceMenu.isOpen || this.ui.modals > 0 || (this.director.isRunning && this.lockRelease !== null);
  }

  checkpoint(id: string): void {
    this.store.state.location = this.phaser?.scene.getScenes(true)[0]?.scene.key ?? this.store.state.location;
    this.save.write(this.store.state, id);
  }

  wait(ms: number): Promise<void> {
    return new Promise((r) => window.setTimeout(r, ms / this.timeScale));
  }

  free(on: boolean): void {
    if (on) {
      this.lockRelease?.();
      this.lockRelease = null;
    } else if (!this.lockRelease && this.director.isRunning) {
      this.lockRelease = this.input.push({ blocksMove: true, action: () => true });
    }
  }

  async runScript(ref: string): Promise<void> {
    const id = ++this.runId;
    this.freeRelease?.();
    this.lockRelease?.();
    this.lockRelease = this.input.push({ blocksMove: true, action: () => true });
    try {
      await this.director.run(ref);
    } finally {
      if (this.runId === id) {
        this.lockRelease?.();
        this.lockRelease = null;
        this.dialog.hide();
      }
    }
  }

  private runId = 0;

  stopScripts(): void {
    this.runId++;
    this.director.stop();
    this.lockRelease?.();
    this.lockRelease = null;
    this.dialog.hide();
  }

  goto(scene: string, params?: Record<string, unknown>): void {
    this.stopScripts();
    this.phaser.scene.getScenes(true).forEach((s) => this.phaser.scene.stop(s.scene.key));
    this.phaser.scene.start(scene, params);
  }

  newGame(): void {
    this.save.clear();
    this.store.reset();
  }

  startNewGame(): void {
    this.newGame();
    this.audio.music.stop(1);
    this.goto('archive_hall');
  }

  async openPause(): Promise<void> {
    if (this.pauseOpen) return;
    this.pauseOpen = true;
    try {
      const res = await openPause(this);
      if (res === 'menu') {
        this.hud.showMenuButton(false);
        this.goto('title');
      }
    } finally {
      this.pauseOpen = false;
    }
  }

  private pauseOpen = false;

  continueGame(): boolean {
    const saved = this.save.load();
    if (!saved) return false;
    this.store.replace(saved);
    const cp = this.checkpoints.get(saved.checkpoint);
    this.goto(cp?.scene ?? saved.location, { ...cp?.params, resumeRef: cp?.ref });
    return true;
  }
}
