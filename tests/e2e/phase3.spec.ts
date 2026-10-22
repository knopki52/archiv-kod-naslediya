import { expect, test, type Page } from '@playwright/test';
import { fastText } from './helpers';

async function dismiss(page: Page, max = 10): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (!(await page.evaluate(() => window.__game!.isDialogOpen()))) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(70);
  }
}

async function waitDialog(page: Page, timeout = 15000): Promise<void> {
  await page.waitForFunction(() => window.__game!.isDialogOpen(), null, { timeout });
}

async function saySeq(page: Page, expectFirst: string, count: number): Promise<void> {
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText(expectFirst, { timeout: 8000 });
  for (let i = 0; i < count; i++) {
    await page.waitForFunction(() => window.__game!.isDialogOpen(), null, { timeout: 8000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
}

async function walkUntilPrompt(page: Page, _key: 'KeyD' | 'KeyA', text: string): Promise<void> {
  await page.waitForFunction(() => !window.__game!.isDialogOpen(), null, { timeout: 8000 });
  await page.evaluate((t) => (window.__game! as unknown as { approach(t: string): boolean }).approach(t), text);
  await page.waitForFunction(
    (t) => {
      const el = document.querySelector<HTMLElement>('.world-prompt');
      return el !== null && !el.hidden && (el.textContent ?? '').includes(t);
    },
    text,
    { polling: 'raf', timeout: 15000 },
  );
}

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.stack ?? String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('заставка → новая игра → пролог целиком → Хаб', async ({ page }) => {
  const errors = watchErrors(page);
  await fastText(page);
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.waitForFunction(() => window.__game!.audioState() === 'running', null, { timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Играть' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Об игре' })).toBeVisible();
  await page.screenshot({ path: 'test-results/phase3-title.png' });
  await page.evaluate(() => window.__game!.setTimeScale(3));
  await page.getByRole('button', { name: 'Играть' }).click();

  await saySeq(page, 'Эй! Ты функционируешь', 2);
  await expect(page.locator('.dialog-name')).toHaveText('Байт');
  await page.screenshot({ path: 'test-results/phase3-prologue-1.png' });
  await saySeq(page, 'Я Байт, дрон Архива', 1);
  await expect(page.locator('.objective')).toContainText('мерцающей книге');
  await page.screenshot({ path: 'test-results/phase3-prologue-walk.png' });

  await page.evaluate(() => window.__game!.setTimeScale(1));
  await walkUntilPrompt(page, 'KeyD', 'книгу');
  await page.evaluate(() => window.__game!.setTimeScale(3));
  await page.keyboard.press('KeyE');
  await saySeq(page, 'Видишь? Они рассыпаются', 2);
  await saySeq(page, 'Не пугайся', 2);
  await saySeq(page, 'Это Дублёр', 2);
  await expect(page.locator('.objective')).toContainText('листок');

  await page.evaluate(() => window.__game!.setTimeScale(1));
  await walkUntilPrompt(page, 'KeyA', 'листок');
  await page.evaluate(() => window.__game!.setTimeScale(3));
  await page.keyboard.press('KeyE');
  await saySeq(page, 'Держи Лупу правды', 1);
  await page.waitForSelector('.loupe');
  const qs = page.locator('.loupe-questions .btn');
  for (let i = 0; i < 3; i++) await qs.nth(i).click();
  await saySeq(page, 'Вот. Это подделка', 1);
  await saySeq(page, 'Идём. Первая подмена в Новгороде', 1);
  await page.waitForFunction(() => window.__game!.getState().flags['pro.done'] === true, null, { timeout: 15000 });
  await expect(page.locator('.objective')).toContainText('портал', { timeout: 5000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/phase3-hub.png' });
  const st = await page.evaluate(() => window.__game!.getState());
  expect(st.checkpoint).toBe('pro.end');
  expect(st.flags['hasLoupe']).toBe(true);
  expect(errors).toEqual([]);
});

test('Хаб: порядок порталов, заглушка эпохи, карточки, дверь «Ядро»', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug=1&scene=archive_hall');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    g.getState().flags['pro.done'] = true;
    g.getState().flags['pro.bookDone'] = true;
    g.getState().flags['pro.loupeDone'] = true;
    g.setTimeScale(3);
    g.jumpTo('archive_hall');
  });
  await page.waitForFunction(() => window.__game!.scene() === 'archive_hall');
  await page.waitForTimeout(800);
  const results = await page.evaluate(() => window.__game!.getState().epochDone);
  expect(results).toEqual([false, false, false]);

  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    s.choices[0] = 'truth';
    s.choices[1] = 'agree';
    s.integrity = 1;
    s.cards.push(1, 2);
    s.epochDone[0] = true;
    s.epochDone[1] = true;
    s.flags['ep1.choice'] = 'truth';
    s.flags['ep2.choice'] = 'agree';
    g.jumpTo('archive_hall', { hubReturn: 1 });
  });
  await page.waitForFunction(() => window.__game!.scene() === 'archive_hall');
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Одна страница спасена', { timeout: 5000 });
  await dismiss(page, 12);
  await page.evaluate(() => {
    const g = window.__game!;
    const s = g.getState();
    s.choices[2] = 'truth';
    s.integrity = 2;
    s.cards.push(3);
    s.epochDone[2] = true;
    s.flags['ep3.choice'] = 'truth';
    g.jumpTo('archive_hall', { hubReturn: 3 });
  });
  await page.waitForFunction(() => window.__game!.scene() === 'archive_hall');
  await waitDialog(page);
  await dismiss(page, 12);
  const st = await page.evaluate(() => window.__game!.getState());
  expect(st.epochDone).toEqual([true, true, true]);
  expect(st.cards).toEqual([1, 2, 3]);
  expect(st.integrity).toBe(2);
  expect(st.byteSilent).toBe(false);
  await page.screenshot({ path: 'test-results/phase3-hub-done.png' });
  expect(errors).toEqual([]);
});

test('меню паузы по Esc, настройки сохраняются, возврат в главное меню', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug=1&scene=archive_hall');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    g.getState().flags['pro.done'] = true;
    g.jumpTo('archive_hall');
  });
  await page.waitForFunction(() => window.__game!.scene() === 'archive_hall');
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pause');
  await page.getByRole('button', { name: 'Настройки' }).click();
  await page.waitForSelector('.settings');
  await page.getByLabel('Крупный текст').check();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.largeText)).toBe('true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('archive.settings.v1')!).largeText)).toBe(true);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.waitForSelector('.pause', { state: 'detached' });
  await page.locator('.hud-menu').click();
  await page.waitForSelector('.pause');
  await page.getByRole('button', { name: 'В главное меню' }).click();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.waitForFunction(() => window.__game!.scene() === 'title');
  await expect(page.getByRole('button', { name: 'Об игре' })).toBeVisible({ timeout: 5000 });
  expect(errors).toEqual([]);
});

test('«Продолжить» возвращает на чекпоинт пролога', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug=1&scene=archive_hall');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    g.getState().flags['pro.bookDone'] = true;
    g.getState().flags['hasLoupe'] = false;
  });
  await page.evaluate(() => window.__game!.checkpoint('pro.book'));
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.waitForFunction(() => window.__game!.scene() === 'archive_hall');
  await expect(page.locator('.objective')).toContainText('листок', { timeout: 8000 });
  expect(await page.evaluate(() => window.__game!.getState().flags['pro.bookDone'])).toBe(true);
  expect(errors).toEqual([]);
});
