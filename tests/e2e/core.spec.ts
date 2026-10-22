import { expect, test, type Page } from '@playwright/test';
import { expectSay, fastText, interact, open, state, waitScene, walkTo, watchErrors } from './helpers';

async function pumpUntil(page: Page, selector: string, timeout = 60_000): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await page.locator(selector).count()) > 0) return;
    if (await page.evaluate(() => window.__game!.isDialogOpen())) await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error(`не дождались ${selector}`);
}

async function pumpUntilChoice(page: Page, timeout = 60_000): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await page.evaluate(() => window.__game!.isChoiceOpen())) return;
    if (await page.evaluate(() => window.__game!.isDialogOpen())) await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error('не дождались выбора');
}

async function setup(page: Page, integrity: number, choices: ('truth' | 'agree')[], artifact: 'grain' | 'voices' | 'fire' = 'voices'): Promise<void> {
  await fastText(page);
  await open(page, '/?debug=1&scene=core');
  await page.evaluate(
    ([integ, ch, art]) => {
      const g = window.__game!;
      g.stopScripts();
      const s = g.getState();
      Object.assign(s.flags, { 'pro.done': true });
      ch.forEach((v, i) => (s.flags[`ep${i + 1}.choice`] = v));
      s.integrity = integ as number;
      s.artifact = art as 'voices';
      s.cards = [1, 2, 3];
      s.epochDone = [true, true, true];
      g.setTimeScale(3);
      g.jumpTo('core');
    },
    [integrity, choices, artifact] as const,
  );
}

async function toFinalChoice(page: Page, replyIndex = 0): Promise<void> {
  await expectSay(page, 'Тут я не могу идти дальше', 'Байт');
  await pumpUntilChoice(page);
  await page.waitForTimeout(450);
  await page.locator('.choice-btn').nth(replyIndex).click();
  await pumpUntil(page, '.core-choice');
}

const endings = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('archive.endings.v1') ?? '[]') as string[]);

test('Ядро → «Слияние» (integrity 3), вариации по артефакту «Огонь», титры', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await setup(page, 3, ['truth', 'truth', 'truth'], 'fire');
  await expectSay(page, 'Тут я не могу идти дальше', 'Байт');
  await page.screenshot({ path: 'test-results/core-01-enter.png' });
  await toFinalChoice(page, 2);
  await expect(page.locator('.core-choice-btn:not(.locked)')).toHaveCount(3);
  await page.screenshot({ path: 'test-results/core-02-choice-3.png' });
  await expect(page.locator('.core-choice-btn')).toHaveCount(3);
  await page.waitForTimeout(700);
  await page.locator('[data-final=merge]').click();
  await expectSay(page, 'Я боялась боли, а боялась зря', 'Лета');
  await pumpUntil(page, '.postcredits', 90_000);
  expect(await endings(page)).toContain('merge');
  await page.screenshot({ path: 'test-results/core-03-credits.png' });
  await page.waitForSelector('.pc-credits', { timeout: 60_000 });
  await page.locator('[data-after=menu]').click();
  await waitScene(page, 'title');
  expect(errors).toEqual([]);
});

test('Ядро: реплики Лета по выборам (3 вариации), замки при integrity 2 и 1', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await setup(page, 2, ['truth', 'agree', 'truth']);
  const seen: string[] = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 60_000 && !(await page.evaluate(() => window.__game!.isChoiceOpen()))) {
    if (await page.evaluate(() => window.__game!.isDialogOpen())) {
      const txt = (await page.locator('.dialog-text').textContent()) ?? '';
      if (!seen.includes(txt)) seen.push(txt);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(100);
  }
  expect(seen).toContain('Ты вернула мальчику его косого всадника. Ему было больно, но он смеялся.');
  expect(seen).toContain('Ты дала ей сытый вечер. Разве это было неправильно?');
  expect(seen).toContain('Ты вернула людям их страх. И их смелость.');
  expect(seen).not.toContain('Ты позволила закрыть журнал. Мы похожи.');
  await page.waitForTimeout(450);
  await page.locator('.choice-btn').nth(1).click();
  await pumpUntil(page, '.core-choice');
  await expect(page.locator('[data-final=merge]')).toHaveClass(/locked/);
  await expect(page.locator('[data-final=merge]')).toBeDisabled();
  await expect(page.locator('[data-final=keeper]')).not.toHaveClass(/locked/);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'test-results/core-04-choice-2.png' });
  await page.locator('[data-final=keeper]').click();
  await expectSay(page, 'Ты сделала это', 'Байт');
  await page.keyboard.press('Enter');
  await expectSay(page, 'Это честно. И очень одиноко', 'Байт');
  await pumpUntil(page, '.postcredits', 60_000);
  expect(await endings(page)).toContain('keeper');
  expect(errors).toEqual([]);
});

test('Ядро: integrity 0 — выбор делает Лета, кнопка «…», затем «Да.» → «Редактор»', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await setup(page, 0, ['agree', 'agree', 'agree'], 'grain');
  await expectSay(page, 'Тут я не могу идти дальше', 'Байт');
  await pumpUntilChoice(page);
  await page.waitForTimeout(450);
  await page.locator('.choice-btn').nth(0).click();
  await expectSay(page, 'Ты забрала у Зины её слова', 'Мнема');
  await pumpUntilChoice(page);
  await expect(page.locator('.choice-btn')).toHaveCount(1);
  await expect(page.locator('.choice-btn')).toContainText('…');
  await page.waitForTimeout(450);
  await page.locator('.choice-btn').click();
  await expectSay(page, 'Да.', 'Мнема');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const st = await state(page);
  expect(st.byteSilent).toBe(true);
  await pumpUntil(page, '.postcredits', 60_000);
  expect(await endings(page)).toContain('editor');
  expect(errors).toEqual([]);
});

test('Ядро: «Продолжить» с чекпоинта финального выбора', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await setup(page, 3, ['truth', 'truth', 'truth']);
  await expectSay(page, 'Тут я не могу идти дальше', 'Байт');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    g.getState().flags['core.named'] = true;
    g.checkpoint('core.choice');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'core');
  await page.waitForSelector('.core-choice', { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('Хаб → дверь «Ядро» ведёт в Ядро', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=archive_hall');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    s.flags['pro.done'] = true;
    s.cards = [1, 2, 3];
    s.epochDone = [true, true, true];
    g.setTimeScale(3);
    g.jumpTo('archive_hall');
  });
  await waitScene(page, 'archive_hall');
  await page.waitForTimeout(800);
  await walkTo(page, 430);
  await interact(page, 'Ядро');
  await waitScene(page, 'core');
  await expectSay(page, 'Тут я не могу идти дальше', 'Байт');
  expect(errors).toEqual([]);
});
