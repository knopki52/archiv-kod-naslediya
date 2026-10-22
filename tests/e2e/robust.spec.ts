import { expect, test } from '@playwright/test';
import { fastText, open, watchErrors } from './helpers';

test('localStorage запрещён: игра запускается и Ядро проходится без ошибок', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    const boom = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    Storage.prototype.getItem = boom;
    Storage.prototype.setItem = boom;
    Storage.prototype.removeItem = boom;
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await expect(page.getByRole('button', { name: /Играть|Новая игра/ })).toBeVisible();
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    s.flags['pro.done'] = true;
    s.integrity = 1;
    s.cards = [1, 2, 3];
    g.setTimeScale(3);
    g.jumpTo('core');
  });
  const t0 = Date.now();
  let chose = false;
  while (Date.now() - t0 < 90_000 && !(await page.locator('.postcredits').count())) {
    if (!chose && (await page.locator('.core-choice').count())) {
      await page.waitForTimeout(700);
      await page.locator('[data-final=editor]').click();
      chose = true;
    } else if (!(await page.locator('.core-choice').count()) && (await page.evaluate(() => window.__game!.isChoiceOpen()))) {
      await page.waitForTimeout(450);
      await page.locator('.choice-btn').last().click();
    } else if (await page.evaluate(() => window.__game!.isDialogOpen())) await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.postcredits')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('спам Enter/кликов, смена размера окна и потеря фокуса не ломают Ядро', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=core');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    Object.assign(s.flags, { 'pro.done': true, 'ep1.choice': 'truth', 'ep2.choice': 'truth', 'ep3.choice': 'agree' });
    s.integrity = 2;
    s.cards = [1, 2, 3];
    g.setTimeScale(3);
    g.jumpTo('core');
  });
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Enter');
    await page.mouse.click(640, 640);
    if (i === 10) await page.setViewportSize({ width: 844, height: 390 });
    if (i === 20) await page.setViewportSize({ width: 1280, height: 720 });
    if (i === 25) await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(60);
  }
  const alive = await page.evaluate(
    () => window.__game!.isDialogOpen() || window.__game!.isChoiceOpen() || document.querySelectorAll('.modal').length > 0 || window.__game!.scene() === 'core',
  );
  expect(alive).toBe(true);
  expect(errors).toEqual([]);
});
