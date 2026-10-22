import type { Game } from './Game';

export interface HintRule {
  id: string;
  t?: [number, number, number];
  lines: [string, string, string];
  repeat?: number;
  target?: string;
}

export class HintManager {
  private rule: HintRule | null = null;
  private idle = 0;
  private level = 0;
  private sinceRepeat = 0;
  private errors = 0;

  constructor(private game: Game) {}

  setRule(rule: HintRule | null): void {
    this.rule = rule;
    this.reset();
  }

  get current(): HintRule | null {
    return this.rule;
  }

  activity(): void {
    this.idle = 0;
    this.level = 0;
    this.sinceRepeat = 0;
  }

  reset(): void {
    this.activity();
    this.errors = 0;
  }

  bumpError(): void {
    this.errors++;
    if (!this.rule) return;
    const t = this.rule.t ?? [25, 60, 120];
    if (this.errors >= 4) this.idle = Math.max(this.idle, t[2]);
    else if (this.errors >= 2) this.idle = Math.max(this.idle, t[1]);
  }

  tick(dt: number): void {
    const rule = this.rule;
    if (!rule || this.game.busy) {
      return;
    }
    this.idle += dt;
    const t = rule.t ?? [25, 60, 120];
    const want = this.idle >= t[2] ? 3 : this.idle >= t[1] ? 2 : this.idle >= t[0] ? 1 : 0;
    if (want > this.level) {
      this.level = want;
      this.sinceRepeat = 0;
      this.show(want as 1 | 2 | 3);
    } else if (rule.repeat && this.level >= 1) {
      this.sinceRepeat += dt;
      if (this.sinceRepeat >= rule.repeat) {
        this.sinceRepeat = 0;
        this.show(this.level as 1 | 2 | 3);
      }
    } else if (this.level === 3) {
      this.sinceRepeat += dt;
      if (this.sinceRepeat >= 45) {
        this.sinceRepeat = 0;
        this.show(1);
      }
    }
  }

  private show(level: 1 | 2 | 3): void {
    const rule = this.rule!;
    const g = this.game;
    g.store.state.stats.hintsUsed++;
    const text = rule.lines[level - 1]!;
    if (!g.store.state.byteSilent) void g.dialog.show({ who: 'byte', text, wait: false });
    if (level >= 2) {
      g.hud.pulseObjective();
      if (rule.target) g.world?.highlight?.(rule.target, level === 3);
    }
    g.bus.emit('hint:shown', { level, text });
  }
}
