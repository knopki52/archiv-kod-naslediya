import type { ChoiceOption, ChoiceStep, SayInput, Script, Step } from '../content/types';
import type { EventBus } from './EventBus';
import { evalCond } from './State';
import type { Store } from './Store';

export interface DirectorHost {
  say(step: SayInput): Promise<void>;
  choice(step: ChoiceStep, visible: ChoiceOption[]): Promise<ChoiceOption>;
  perform(step: Step): Promise<void>;
  checkpoint(id: string): void;
  wait(ms: number): Promise<void>;
  free?(on: boolean): void;
}

export class Director {
  private scripts = new Map<string, Script>();
  private token = 0;
  private running = false;

  constructor(
    private host: DirectorHost,
    private store: Store,
    private bus: EventBus,
  ) {}

  register(id: string, script: Script): void {
    this.scripts.set(id, script);
  }

  has(ref: string): boolean {
    const { scriptId, label } = Director.parse(ref);
    return Boolean(this.scripts.get(scriptId)?.[label]);
  }

  get isRunning(): boolean {
    return this.running;
  }

  stop(): void {
    this.token++;
    this.running = false;
  }

  static parse(ref: string): { scriptId: string; label: string } {
    const [scriptId = '', label = 'start'] = ref.split('#');
    return { scriptId, label: label || 'start' };
  }

  async run(ref: string): Promise<void> {
    const { scriptId, label } = Director.parse(ref);
    const script = this.scripts.get(scriptId);
    if (!script) throw new Error(`[Director] нет скрипта «${scriptId}»`);
    const my = ++this.token;
    this.running = true;
    try {
      await this.exec(script, label, my);
    } finally {
      if (this.token === my) this.running = false;
    }
  }

  private async exec(script: Script, startLabel: string, my: number): Promise<void> {
    let { steps, index: i } = this.locate(script, startLabel, []);
    const alive = () => this.token === my;
    const jump = (label: string) => {
      ({ steps, index: i } = this.locate(script, label, steps));
    };

    while (i < steps.length) {
      if (!alive()) return;
      const step = steps[i++]!;
      switch (step.t) {
        case 'label':
          break;
        case 'goto':
          jump(step.name);
          break;
        case 'if': {
          const ok = evalCond(this.store.state, step.cond);
          if (ok) jump(step.then);
          else if (step.else) jump(step.else);
          break;
        }
        case 'set':
          this.store.apply(step.effects);
          break;
        case 'giveClue':
          this.store.giveClue(step.clue);
          await this.host.perform(step);
          break;
        case 'checkpoint':
          this.host.checkpoint(step.id);
          break;
        case 'wait':
          await this.host.wait(step.ms);
          break;
        case 'objective':
          this.bus.emit('objective:changed', { text: step.text });
          break;
        case 'awaitFlag':
          await this.awaitCond(step, my);
          break;
        case 'say': {
          if (step.who === 'byte' && this.store.state.byteSilent) break;
          await this.host.say(step);
          break;
        }
        case 'choice': {
          const visible = step.options.filter((o) => !o.showIf || o.locked || evalCond(this.store.state, o.showIf));
          const picked = await this.host.choice(step, visible);
          if (!alive()) return;
          if (picked.effects) this.store.apply(picked.effects);
          jump(picked.goto);
          break;
        }
        default:
          await this.host.perform(step);
      }
    }
  }

  private locate(script: Script, name: string, current: Step[]): { steps: Step[]; index: number } {
    const top = script[name];
    if (top) return { steps: top, index: 0 };
    const find = (steps: Step[]) => steps.findIndex((s) => s.t === 'label' && s.name === name);
    const here = find(current);
    if (here >= 0) return { steps: current, index: here + 1 };
    for (const steps of Object.values(script)) {
      const idx = find(steps);
      if (idx >= 0) return { steps, index: idx + 1 };
    }
    throw new Error(`[Director] нет метки «${name}»`);
  }

  private awaitCond(step: Extract<Step, { t: 'awaitFlag' }>, my: number): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.token !== my || evalCond(this.store.state, step.cond)) {
          off();
          this.host.free?.(false);
          resolve();
        }
      };
      this.host.free?.(true);
      const off = this.bus.on('state:changed', check);
      check();
    });
  }
}
