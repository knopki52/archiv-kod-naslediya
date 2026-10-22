import type { ClueId } from '../content/types';

export interface BusEvents {
  'scene:enter': { key: string };
  'scene:exit': { key: string };
  'dialog:start': { id: string };
  'dialog:end': { id: string };
  'clue:gained': { clue: ClueId };
  'clue:presented': { clue: ClueId; npc: string };
  'contradiction:solved': { npc: string; id: string };
  'board:solved': { epoch: 1 | 2 | 3 };
  'choice:made': { epoch: 1 | 2 | 3; value: 'truth' | 'agree' };
  'card:gained': { id: 1 | 2 | 3 };
  'hint:shown': { level: 1 | 2 | 3; text: string };
  'ending:reached': { ending: 'keeper' | 'merge' | 'editor' };
  'save:written': { checkpoint: string };
  'audio:unlock': undefined;
  'state:changed': undefined;
  'orientation:blocked': { blocked: boolean };
  'objective:changed': { text: string | null };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<never>>>();

  on<K extends keyof BusEvents>(event: K, fn: Handler<BusEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(event, fn);
  }

  off<K extends keyof BusEvents>(event: K, fn: Handler<BusEvents[K]>): void {
    this.handlers.get(event)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof BusEvents>(event: K, payload?: BusEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) (fn as Handler<BusEvents[K] | undefined>)(payload);
  }
}
