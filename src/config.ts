export const VIEW_W = 640;
export const VIEW_H = 360;

export const AUTHORS: string[] = ['Спиридонов', 'Сенков'];
export const GAME_TITLE = 'АРХИВ. Код наследия';

export const AI_ENDPOINT: string = (import.meta.env.VITE_AI_ENDPOINT as string | undefined) ?? '';
export const AI_TIMEOUT_MS = 5000;

export const TEXT_SPEEDS = { slow: 25, normal: 45, fast: 90, instant: 0 } as const;
export type TextSpeed = keyof typeof TEXT_SPEEDS;

export const SAVE_KEY = 'archive.save.v1';
export const SETTINGS_KEY = 'archive.settings.v1';
export const ENDINGS_KEY = 'archive.endings.v1';
export const SEEN_KEY = 'archive.seen.v1';

export const IS_DEBUG: boolean = (() => {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
})();
