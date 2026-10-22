import { expect, test } from '@playwright/test';

for (const page of [1, 2, 3, 4, 5]) {
  test(`галерея, страница ${page}: без ошибок`, async ({ page: pw }) => {
    const errors: string[] = [];
    pw.on('pageerror', (e) => errors.push(String(e)));
    pw.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await pw.goto(`/?debug=1&gallery=1&page=${page}`);
    await pw.waitForFunction(() => Boolean(window.__game));
    await pw.waitForTimeout(1500);
    const lit = await pw.evaluate(() => {
      const c = document.querySelector('#game canvas') as HTMLCanvasElement;
      return Boolean(c && c.width > 0);
    });
    expect(lit).toBe(true);
    if (page === 3) {
      await pw.keyboard.press('Space');
      await pw.waitForTimeout(600);
    }
    await pw.screenshot({ path: `test-results/gallery-${page}.png` });
    expect(errors).toEqual([]);
  });
}
