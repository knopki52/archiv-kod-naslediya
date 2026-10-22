import { expect, test } from '@playwright/test';

test('звук: контекст запускается по жесту, SFX/музыка/эмбиент/метроном звучат без клиппинга и ошибок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1&gallery=1&page=5');
  await page.waitForFunction(() => Boolean(window.__game));
  expect(await page.evaluate(() => window.__game!.audioState())).toBe('none');
  await page.getByRole('button', { name: 'click', exact: true }).click();
  await page.waitForFunction(() => window.__game!.audioState() === 'running', null, { timeout: 5000 });

  await page.evaluate(() => {
    const g = window.__game!;
    g.playMusic('archive');
    g.playAmbience('servers');
  });
  const t0 = await page.evaluate(() => window.__game!.audioTime());
  await page.waitForTimeout(1500);
  const t1 = await page.evaluate(() => window.__game!.audioTime());
  const clockRuns = t1 > t0 + 0.5;
  let level = await page.evaluate(() => window.__game!.audioLevel());
  if (clockRuns) expect(level.rms).toBeGreaterThan(0.0005);

  const names = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.gallery-btn')].map((b) => b.textContent ?? '');
    return buttons;
  });
  expect(names.length).toBeGreaterThan(40);
  let maxPeak = 0;
  for (const n of ['click', 'clue', 'contradiction', 'glitch', 'crumble', 'portal', 'card', 'stamp', 'rocket']) {
    await page.evaluate((name) => window.__game!.playSfx(name), n);
    await page.waitForTimeout(120);
    level = await page.evaluate(() => window.__game!.audioLevel());
    maxPeak = Math.max(maxPeak, level.peak);
  }
  expect(maxPeak).toBeLessThanOrEqual(1);

  for (const id of ['nov', 'len', 'baik', 'core', 'end_keeper', 'end_merge', 'end_editor']) {
    await page.evaluate((t) => window.__game!.playMusic(t), id);
    await page.waitForTimeout(250);
  }
  for (const a of ['wind_snow', 'stove', 'steppe', 'bunker', 'core']) {
    await page.evaluate((t) => window.__game!.playAmbience(t), a);
    await page.waitForTimeout(150);
  }
  await page.getByRole('button', { name: 'старт' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'замереть' }).click();
  await page.getByRole('button', { name: 'стоп' }).last().click();
  expect(errors).toEqual([]);
});
