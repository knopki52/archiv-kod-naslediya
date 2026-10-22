import { beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: new MemoryStorage() });
});

async function modules() {
  const { EventBus } = await import('../../src/core/EventBus');
  const { SaveManager } = await import('../../src/core/Save');
  const { newState } = await import('../../src/core/State');
  return { EventBus, SaveManager, newState };
}

describe('SaveManager', () => {
  it('пишет и читает сохранение, эмитит save:written', async () => {
    const { EventBus, SaveManager, newState } = await modules();
    const bus = new EventBus();
    const seen: string[] = [];
    bus.on('save:written', (p) => seen.push(p.checkpoint));
    const save = new SaveManager(bus);
    expect(save.hasSave()).toBe(false);
    const s = newState();
    s.integrity = 2;
    save.write(s, 'e1.start');
    expect(seen).toEqual(['e1.start']);
    const loaded = save.load()!;
    expect(loaded.integrity).toBe(2);
    expect(loaded.checkpoint).toBe('e1.start');
    save.clear();
    expect(save.hasSave()).toBe(false);
  });

  it('если localStorage недоступен — не падает', async () => {
    vi.stubGlobal('window', {
      get localStorage(): never {
        throw new Error('denied');
      },
    });
    const { EventBus, SaveManager, newState } = await modules();
    const save = new SaveManager(new EventBus());
    expect(() => save.write(newState(), 'x')).not.toThrow();
    expect(save.load()).toBeNull();
  });

  it('галерея концовок накапливается без дублей', async () => {
    const { EventBus, SaveManager } = await modules();
    const save = new SaveManager(new EventBus());
    save.markEnding('keeper');
    save.markEnding('keeper');
    save.markEnding('merge');
    expect(save.endingsSeen()).toEqual(['keeper', 'merge']);
  });
});
