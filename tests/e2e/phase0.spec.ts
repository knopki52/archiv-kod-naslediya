import { expect, test } from '@playwright/test';

test('фаза 0: диалог, ходьба, интерактив, выбор, улика, чекпоинт', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/?debug=1&scene=test');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.evaluate(() => window.__game!.setTimeScale(4));

  await page.waitForFunction(() => window.__game!.isDialogOpen());
  await expect(page.locator('.dialog-name')).toHaveText('Байт');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__game!.getState().checkpoint === 'test.start');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !window.__game!.isDialogOpen());

  await page.evaluate(() => window.__game!.setTimeScale(1));
  await page.evaluate(() => (window.__game! as unknown as { approach(t: string): boolean }).approach('Осмотреть'));
  await page.waitForFunction(() => document.querySelector<HTMLElement>('.world-prompt')?.hidden === false, null, {
    polling: 'raf',
    timeout: 10000,
  });
  await expect(page.locator('.world-prompt')).toContainText('Осмотреть');
  await page.keyboard.press('KeyE');

  await page.waitForFunction(() => window.__game!.isDialogOpen());
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__game!.isChoiceOpen());
  await expect(page.locator('.choice-btn')).toHaveCount(2);
  await page.waitForTimeout(450);
  await page.keyboard.press('Digit2');

  await page.waitForFunction(() => window.__game!.getState().flags['test.tone'] === 'strict');
  for (let i = 0; i < 6; i++) {
    if (await page.evaluate(() => window.__game!.getState().checkpoint === 'test.book')) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
  }
  const state = await page.evaluate(() => window.__game!.getState());
  expect(state.clues[1]).toContain('ep1.U1');
  expect(state.checkpoint).toBe('test.book');
  expect(await page.evaluate(() => Boolean(localStorage.getItem('archive.save.v1')))).toBe(true);
  expect(errors).toEqual([]);
});
