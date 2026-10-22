import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('dist/index.html')).href + '?debug=1';

test('dist/index.html запускается с file://: заставка → пролог, без внешних запросов и ошибок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const external: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });

  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__game));
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Играть' }).click();
  await page.waitForFunction(() => window.__game!.isDialogOpen(), null, { timeout: 20000 });
  await expect(page.locator('.dialog-name')).toHaveText('Байт');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
