import type { ClueId, Effects, FlagValue } from '../content/types';
import type { EventBus } from './EventBus';
import { applyEffects, clueEpoch, newState, type GameState } from './State';

export class Store {
  state: GameState = newState();

  constructor(private bus: EventBus) {}

  reset(): void {
    this.state = newState();
    this.bus.emit('state:changed');
  }

  replace(next: GameState): void {
    this.state = next;
    this.bus.emit('state:changed');
  }

  apply(fx: Effects): void {
    applyEffects(this.state, fx);
    this.bus.emit('state:changed');
  }

  setFlag(key: string, value: FlagValue = true): void {
    this.state.flags[key] = value;
    this.bus.emit('state:changed');
  }

  flag(key: string): FlagValue | undefined {
    return this.state.flags[key];
  }

  giveClue(clue: ClueId): boolean {
    const list = this.state.clues[clueEpoch(clue)];
    if (list.includes(clue)) return false;
    list.push(clue);
    this.bus.emit('clue:gained', { clue });
    this.bus.emit('state:changed');
    return true;
  }

  hasClue(clue: ClueId): boolean {
    return this.state.clues[clueEpoch(clue)].includes(clue);
  }
}
