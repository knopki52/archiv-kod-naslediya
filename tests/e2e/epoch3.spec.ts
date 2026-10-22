import { expect, test, type Page } from '@playwright/test';
import {
  advance, dismiss, expectSay, fastText, hoverHotspot, interact, next, open, pickChoice, state, waitScene, walkTo,
  walkUntilDialog, watchErrors,
} from './helpers';

async function wireOrder(page: Page): Promise<void> {
  await page.waitForSelector('.cp-panel');
  const order = ['Питание', 'Передатчик', 'Антенна', 'Приёмник', 'Запись'];
  for (let i = 0; i < order.length - 1; i++) {
    await page.getByLabel(`Выход блока «${order[i]}»`).click();
    await page.getByLabel(`Вход блока «${order[i + 1]}»`).click();
  }
  await page.getByRole('button', { name: 'Подать ток' }).click();
  await page.waitForSelector('.minigame-panel', { state: 'detached', timeout: 8000 });
}

async function interrogate(page: Page): Promise<void> {
  await page.waitForSelector('.interro');
  await page.locator('.chip', { hasText: 'Когда вы приехали на площадку?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('С вечера');
  await page.locator('.chip', { hasText: 'Где вы были ночью?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('На площадке');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Пропуск из завтра' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Опечатка');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Чистые ботинки' }).click();
  await page.waitForSelector('.interro', { state: 'detached', timeout: 10000 });
}

async function board(page: Page): Promise<void> {
  await page.waitForSelector('.board-ep3');
  const pick = (t: string) => page.locator('.clue-card', { hasText: t }).click();
  await pick('Люк закрывали заново');
  await pick('Сбой связи устранён');
  await pick('Пропуск из завтра');
  await page.getByRole('button', { name: 'Обвинить' }).click();
  await expectSay(page, 'Люк и связь важны', 'Байт');
  await dismiss(page);
  await pick('Люк закрывали заново');
  await pick('Сбой связи устранён');
  await pick('Чистые ботинки');
  await pick('Инспектор из завтрашнего дня');
  await page.getByRole('button', { name: 'Обвинить' }).click();
}

async function finaleAndLaunch(page: Page, branch: 'truth' | 'agree'): Promise<void> {
  await waitScene(page, 'bk_bunker');
  await expectSay(page, 'Зачем людям знать', 'Дублёр');
  await page.screenshot({ path: `test-results/e3-dubler-${branch}.png` });
  await advance(page, 20);
  await page.waitForSelector('.epoch-choice');
  await expect(page.locator(`.epoch-choice-btn.${branch}`)).toBeEnabled({ timeout: 3000 });
  await page.locator(`.epoch-choice-btn.${branch}`).click();
  if (branch === 'truth') await expectSay(page, 'Пиши всё. Как было.', 'Тимофей');
  else await expectSay(page, 'Тимофей молча закрывает журнал');
  await page.screenshot({ path: `test-results/e3-after-${branch}.png` });
  await next(page);
  await waitScene(page, 'bk_pad');
  await page.waitForSelector('.radio-text', { timeout: 40000 });
  await page.screenshot({ path: `test-results/e3-launch-${branch}.png` });
  await page.waitForSelector('.truth-card', { timeout: 40000 });
  await expect(page.locator('.truth-card-title')).toHaveText('Первый полёт человека в космос');
  await page.locator('.truth-card .btn').click();
  await waitScene(page, 'archive_hall');
}

test('эпоха 3 «Байконур»: полное прохождение (вернуть правду)', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=bk_bunker');
  await page.evaluate(() => window.__game!.setTimeScale(3));

  await waitScene(page, 'bk_pad');
  await expectSay(page, 'Не смотри вдоль горизонта', 'Байт');
  await page.screenshot({ path: 'test-results/e3-01-arrive.png' });
  await advance(page);
  await expect(page.locator('.objective')).toContainText('Войди в бункер');

  await walkTo(page, 44);
  await interact(page, 'Войти в бункер');
  await waitScene(page, 'bk_bunker');
  await walkUntilDialog(page, 'KeyD');
  await expectSay(page, 'Новенькая из комиссии', 'Тимофей');
  for (let i = 0; i < 60 && !(await page.locator('.objective').textContent())?.includes('Осмотри'); i++) {
    if (await page.evaluate(() => window.__game!.isDialogOpen())) await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  await expect(page.locator('.objective')).toContainText('Осмотри Инспектора', { timeout: 15000 });

  await walkTo(page, 250);
  await interact(page, 'Осмотреть Инспектора');
  await pickChoice(page, 'Пропуск');
  await page.waitForSelector('.loupe-canvas');
  await hoverHotspot(page, 205, 120);
  await expectSay(page, 'Пропуск из завтра', 'Байт');
  await dismiss(page);
  await page.waitForSelector('.loupe', { state: 'detached', timeout: 8000 });
  await interact(page, 'Осмотреть Инспектора');
  await pickChoice(page, 'Ботинки');
  await page.waitForSelector('.loupe-canvas');
  await hoverHotspot(page, 160, 120);
  await expectSay(page, 'сапоги в степной пыли', 'Байт');
  await dismiss(page);
  await expectSay(page, 'Он ни разу не выходил', 'Галя');
  await dismiss(page);
  await page.waitForSelector('.loupe', { state: 'detached', timeout: 8000 });
  expect((await state(page)).clues[3]).toEqual(expect.arrayContaining(['ep3.U1', 'ep3.U2']));

  await interact(page, 'Поговорить с Инспектором');
  await expect(page.locator('.toast-info')).toContainText('Мало улик');

  await walkTo(page, 452);
  await interact(page, 'Выйти на площадку');
  await waitScene(page, 'bk_pad');
  await walkUntilDialog(page, 'KeyD');
  await expectSay(page, 'Горит «Люк закрыт»', 'Иван Саввич');
  await advance(page, 20);
  expect((await state(page)).clues[3]).toContain('ep3.U3');

  await walkTo(page, 44);
  await interact(page, 'Войти в бункер');
  await waitScene(page, 'bk_bunker');
  await walkTo(page, 60);
  await interact(page, 'Пойти в пункт связи');
  await waitScene(page, 'bk_comms');
  await walkTo(page, 150);
  await interact(page, 'Поговорить с Галей');
  await expectSay(page, 'Пульт пересобери', 'Галя');
  await advance(page);
  await wireOrder(page);
  await expectSay(page, 'Слышно! Спасибо', 'Галя');
  await advance(page, 12);
  const s1 = await state(page);
  expect(s1.clues[3]).toEqual(expect.arrayContaining(['ep3.U1', 'ep3.U2', 'ep3.U3', 'ep3.U4']));
  await expect(page.locator('.objective')).toContainText('Допроси Инспектора');

  await walkTo(page, 450);
  await interact(page, 'Вернуться в бункер');
  await waitScene(page, 'bk_bunker');
  await walkTo(page, 250);
  await interact(page, 'Поговорить с Инспектором');
  await expectSay(page, 'Он сказал, страх сорвёт старт', 'Тимофей');
  await advance(page);
  await interrogate(page);
  expect((await state(page)).clues[3]).toContain('ep3.U5');

  await board(page);
  await finaleAndLaunch(page, 'truth');
  await expectSay(page, 'Три карточки собраны', 'Байт');
  const end = await state(page);
  expect(end.choices[2]).toBe('truth');
  expect(end.cards).toEqual([3]);
  expect(end.epochDone).toEqual([false, false, true]);
  expect(errors).toEqual([]);
});

test('эпоха 3: «согласиться» — старт в серой тишине', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=bk_bunker');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    Object.assign(g.getState().flags, {
      'pro.done': true, 'e3.started': true, 'e3.met': true, 'e3.inspectDone': true, 'e3.padDone': true,
      'e3.minigameDone': true, 'e3.allClues': true,
    });
    g.giveClues(3);
    g.setTimeScale(3);
    g.jumpTo('bk_bunker', { stage: 'finale' });
  });
  await finaleAndLaunch(page, 'agree');
  const end = await state(page);
  expect(end.choices[2]).toBe('agree');
  expect(end.cards).toContain(3);
  expect(errors).toEqual([]);
});

test('эпоха 3: «Продолжить» с чекпоинтов', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=bk_bunker');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    Object.assign(g.getState().flags, { 'pro.done': true, 'e3.started': true, 'e3.met': true, 'e3.inspectDone': true });
    g.checkpoint('e3.inspect');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'bk_bunker');
  await expect(page.locator('.objective')).toContainText('Ивана Саввича', { timeout: 5000 });

  await page.evaluate(() => {
    const g = window.__game!;
    g.giveClues(3);
    g.checkpoint('e3.interrogation');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.waitForSelector('.board-ep3', { timeout: 10000 });
  expect(errors).toEqual([]);
});
