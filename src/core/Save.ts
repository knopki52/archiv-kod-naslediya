import { ENDINGS_KEY, SAVE_KEY } from '../config';
import type { EventBus } from './EventBus';
import { newState, type GameState } from './State';
import { readJSON, removeKey, writeJSON } from './Storage';

interface SaveFile {
  version: 1;
  savedAt: number;
  state: GameState;
}

export type EndingId = 'keeper' | 'merge' | 'editor';

export class SaveManager {
  constructor(private bus: EventBus) {}

  hasSave(): boolean {
    return this.load() !== null;
  }

  load(): GameState | null {
    const file = readJSON<SaveFile>(SAVE_KEY);
    if (!file || file.version !== 1 || !file.state) return null;
    return { ...newState(), ...file.state };
  }

  write(state: GameState, checkpoint: string): void {
    state.checkpoint = checkpoint;
    const ok = writeJSON(SAVE_KEY, { version: 1, savedAt: Date.now(), state } satisfies SaveFile);
    if (ok) this.bus.emit('save:written', { checkpoint });
  }

  clear(): void {
    removeKey(SAVE_KEY);
  }

  clearEndings(): void {
    removeKey(ENDINGS_KEY);
  }

  endingsSeen(): EndingId[] {
    return readJSON<EndingId[]>(ENDINGS_KEY) ?? [];
  }

  markEnding(id: EndingId): void {
    const seen = this.endingsSeen();
    if (!seen.includes(id)) writeJSON(ENDINGS_KEY, [...seen, id]);
  }
}
