import { expect, test } from '@playwright/test';
import { open, watchErrors } from './helpers';

test('режим «меньше эффектов»: Ядро и концовка «Слияние» проходятся без ошибок', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await page.addInitScript(() =>
    localStorage.setItem('archive.settings.v1', JSON.stringify({ textSpeed: 'instant', reducedEffects: true, music: 0, sfx: 0 })),
  );
  await open(page, '/?debug=1&scene=core');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    Object.assign(s.flags, { 'pro.done': true, 'ep1.choice': 'truth', 'ep2.choice': 'truth', 'ep3.choice': 'truth' });
    s.integrity = 3;
    s.cards = [1, 2, 3];
    g.setTimeScale(3);
    g.jumpTo('core');
  });
  let picked = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 120_000 && !(await page.locator('.postcredits').count())) {
    if (picked === 0 && (await page.locator('.core-choice').count())) {
      await page.waitForTimeout(700);
      await page.locator('[data-final=merge]').click();
      picked++;
    } else if (!(await page.locator('.core-choice').count()) && (await page.evaluate(() => window.__game!.isChoiceOpen()))) {
      await page.waitForTimeout(450);
      await page.locator('.choice-btn').first().click();
    } else if (await page.evaluate(() => window.__game!.isDialogOpen())) await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  expect(picked).toBe(1);
  await expect(page.locator('.postcredits')).toHaveCount(1);
  expect(errors).toEqual([]);
});
