import { describe, expect, it } from 'vitest';
import { splitText } from '../../src/ui/DialogBox';

describe('splitText', () => {
  it('короткий текст не делится', () => {
    expect(splitText('Привет.')).toEqual(['Привет.']);
  });

  it('длинный делится по предложениям и не теряет текст', () => {
    const text = 'Первое предложение довольно длинное и содержит много слов. '.repeat(5).trim();
    const parts = splitText(text, 130);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(text.replace(/\s+/g, ' '));
  });
});
