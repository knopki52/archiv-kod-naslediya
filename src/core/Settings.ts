import { SETTINGS_KEY, type TextSpeed } from '../config';
import { readJSON, writeJSON } from './Storage';

export interface SettingsData {
  music: number;
  sfx: number;
  textSpeed: TextSpeed;
  showObjective: boolean;
  reducedEffects: boolean;
  largeText: boolean;
  voices: 'speech' | 'babble' | 'off';
}

const DEFAULTS: SettingsData = {
  music: 0.6,
  sfx: 0.8,
  textSpeed: 'normal',
  showObjective: true,
  reducedEffects: false,
  largeText: false,
  voices: 'babble',
};

export class Settings {
  data: SettingsData;
  private listeners = new Set<() => void>();

  constructor() {
    const stored = readJSON<Partial<SettingsData>>(SETTINGS_KEY) ?? {};
    const reduce =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.data = { ...DEFAULTS, reducedEffects: reduce, ...stored };
    this.applyDom();
  }

  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    writeJSON(SETTINGS_KEY, this.data);
    this.applyDom();
    this.listeners.forEach((fn) => fn());
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private applyDom(): void {
    const root = document.documentElement;
    root.dataset.largeText = String(this.data.largeText);
    root.dataset.reduced = String(this.data.reducedEffects);
  }
}
