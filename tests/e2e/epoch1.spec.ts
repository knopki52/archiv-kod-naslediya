import { expect, test, type Page } from '@playwright/test';
import {
  advance, dismiss, expectSay, fastText, hoverHotspot, interact, next, open, pickChoice, scene, state, waitScene, walkTo, walkUntilDialog, watchErrors,
} from './helpers';

async function dragBirch(page: Page): Promise<void> {
  const pieces = page.locator('.birch-piece');
  await expect(pieces).toHaveCount(6);
  const slots = page.locator('.birch-slot');
  for (let n = 0; n < 6; n++) {
    const piece = pieces.nth(n);
    const col = Number(await piece.getAttribute('data-col'));
    const row = Number(await piece.getAttribute('data-row'));
    const pb = (await piece.boundingBox())!;
    const sb = (await slots.nth(row * 3 + col).boundingBox())!;
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 6 });
    await page.mouse.up();
  }
}

test('эпоха 1 «Новгород»: полное прохождение (верить Гостю, вернуть правду)', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=nov_square');
  await page.evaluate(() => window.__game!.setTimeScale(3));

  await expectSay(page, 'Тихо. Здесь я птица, а не дрон.', 'Байт');
  await page.screenshot({ path: 'test-results/e1-01-arrive.png' });
  await advance(page);
  await expect(page.locator('.dialog-name')).toHaveText('Онфим');
  await pickChoice(page, 'Покажи, что осталось');
  await advance(page);
  await expect(page.locator('.objective')).toContainText('Иди за Онфимом');
  expect((await state(page)).flags['ep1.tone']).toBe('soft');
  await page.screenshot({ path: 'test-results/e1-02-square.png' });

  await walkUntilDialog(page);
  await expectSay(page, 'Видишь того, у колодца?', 'Байт');
  await page.screenshot({ path: 'test-results/e1-03-guest.png' });
  await advance(page);

  await walkTo(page, SQUARE.house);
  await interact(page, 'дом Онфима');
  await waitScene(page, 'nov_house');
  await walkTo(page, 312);
  await interact(page, 'сундук');
  await page.waitForSelector('.loupe-canvas');
  await hoverHotspot(page, 105, 78);
  await expectSay(page, 'Чернила на бересте');
  await dismiss(page);
  await hoverHotspot(page, 215, 112);
  await expectSay(page, 'пожалуйста');
  await dismiss(page);
  await expectSay(page, 'Я так писать не умею');
  await advance(page);
  await expect(page.locator('.objective')).toContainText('Настасью');
  expect((await state(page)).clues[1]).toEqual(expect.arrayContaining(['ep1.U1', 'ep1.U2']));
  await page.screenshot({ path: 'test-results/e1-04-house.png' });

  await walkTo(page, 40);
  await interact(page, 'Выйти');
  await waitScene(page, 'nov_square');
  await walkTo(page, SQUARE.bakery);
  await interact(page, 'пекарню');
  await waitScene(page, 'nov_bakery');
  await expectSay(page, 'Ты та, что ходит с Онфимом?', 'Настасья');
  await advance(page);
  await expect(page.locator('.objective')).toContainText('дрова');
  await walkTo(page, 98);
  await interact(page, 'Взять дрова');
  await expect(page.locator('.objective')).toContainText('к печи');
  await page.screenshot({ path: 'test-results/e1-05-bakery-logs.png' });
  await walkTo(page, 416);
  await interact(page, 'печь');
  await expectSay(page, 'Ладно, слушай', 'Настасья');
  await advance(page);
  expect((await state(page)).clues[1]).toEqual(expect.arrayContaining(['ep1.U3', 'ep1.U4']));

  await walkTo(page, 40);
  await interact(page, 'Выйти');
  await waitScene(page, 'nov_square');
  await expectSay(page, 'Добрый день, странница', 'Гость');
  await page.screenshot({ path: 'test-results/e1-06-guest-advice.png' });
  await advance(page);
  await pickChoice(page, 'Спасибо, я проверю');
  await advance(page);
  await expect(page.locator('.objective')).toContainText('лавку');
  await walkTo(page, SQUARE.stall);
  await interact(page, 'Проверить лавку');
  await expectSay(page, 'Лавка пуста', 'Байт');
  await advance(page);
  const afterStall = await state(page);
  expect(afterStall.clues[1]).toContain('ep1.F1');
  expect(afterStall.flags['e1.guestDone']).toBe(true);
  await expect(page.locator('.objective')).toContainText('Онфиму');

  await walkTo(page, SQUARE.house + 40);
  await interact(page, 'Онфимом');
  await expectSay(page, 'Я вспомнил!', 'Онфим');
  await advance(page);
  await page.waitForSelector('.minigame-birch');
  await dragBirch(page);
  await expectSay(page, 'Мой всадник!', 'Онфим');
  await next(page);
  await expectSay(page, 'Мастерская открылась', 'Байт');
  await advance(page);
  const afterBirch = await state(page);
  expect(afterBirch.clues[1]).toContain('ep1.U5');
  expect(afterBirch.flags['e1.workshopOpen']).toBe(true);
  await page.screenshot({ path: 'test-results/e1-07-workshop-open.png' });

  await walkTo(page, SQUARE.workshop);
  await interact(page, 'мастерскую');
  await waitScene(page, 'nov_workshop');
  await expectSay(page, 'Грамоты, береста', 'Игнат');
  await advance(page);
  await walkTo(page, 330);
  await interact(page, 'Допросить Игната');
  await page.waitForSelector('.interro');
  await page.screenshot({ path: 'test-results/e1-08-interrogation.png' });
  await page.locator('.chip', { hasText: 'Где ты был вчера вечером?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('В церкви');
  await page.locator('.chip', { hasText: 'Кто мог зайти в мастерскую?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Чернилами по бересте');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Свет в мастерской' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Огонь затеплить');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Написано чернилами' }).click();
  await page.waitForSelector('.interro', { state: 'detached', timeout: 10000 });
  expect((await state(page)).clues[1]).toContain('ep1.U6');

  await page.waitForSelector('.board');
  await expect(page.locator('.clue-card')).toHaveCount(7);
  const pick = (t: string) => page.locator('.clue-card', { hasText: t }).click();
  await pick('Торговец подозрителен');
  await pick('Гость без следов');
  await pick('Свет в мастерской');
  await page.getByRole('button', { name: 'Обвинить' }).click();
  await expectSay(page, 'Нет, это пустой слух');
  await dismiss(page);
  await pick('Торговец подозрителен');
  await pick('Игнат правил текст за серебро');
  await page.screenshot({ path: 'test-results/e1-09-board.png' });
  await page.getByRole('button', { name: 'Обвинить' }).click();

  await waitScene(page, 'nov_square');
  await expectSay(page, 'Вы очень внимательны', 'Гость');
  await next(page);
  await expectSay(page, 'Здравствуй. Мы ведь знакомы.', 'Дублёр');
  await page.screenshot({ path: 'test-results/e1-10-dubler.png' });
  await advance(page, 20);
  await page.waitForSelector('.epoch-choice');
  await page.screenshot({ path: 'test-results/e1-11-choice.png' });

  await expect(page.locator('.epoch-choice-btn.truth')).toBeEnabled({ timeout: 3000 });
  await page.locator('.epoch-choice-btn.truth').click();
  await expectSay(page, 'Это мой всадник! Косой, но мой!', 'Онфим');
  await advance(page);
  await page.waitForSelector('.truth-card');
  await expect(page.locator('.truth-card-title')).toHaveText('Берестяные грамоты');
  await page.locator('.truth-card .btn').click();
  await waitScene(page, 'archive_hall');
  await expectSay(page, 'Одна страница спасена', 'Байт');
  await advance(page);

  const end = await state(page);
  expect(end.integrity).toBe(1);
  expect(end.choices[0]).toBe('truth');
  expect(end.cards).toEqual([1]);
  expect(end.epochDone).toEqual([true, false, false]);
  expect(await scene(page)).toBe('archive_hall');
  expect(errors).toEqual([]);
});

test('эпоха 1: ветка «усомниться» и «согласиться с Дублёром»', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=nov_square');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    const s = g.getState();
    Object.assign(s.flags, { 'pro.done': true, 'e1.started': true, 'e1.onfimMet': true, 'e1.chestDone': true, 'e1.bakeryAsked': true, 'e1.bakeryDone': true, 'ep1.tone': 'strict' });
    g.giveClues(1);
    s.clues[1] = s.clues[1].filter((c) => c !== 'ep1.U5' && c !== 'ep1.U6');
    g.setTimeScale(3);
    g.jumpTo('nov_square');
  });
  await waitScene(page, 'nov_square');

  await expectSay(page, 'Добрый день, странница', 'Гость');
  await advance(page);
  await pickChoice(page, 'Почему вы так быстро подсказываете?');
  await expectSay(page, 'Я лишь хочу помочь', 'Гость');
  await advance(page);
  const s1 = await state(page);
  expect(s1.flags['e1.guestDone']).toBe(true);
  expect(s1.flags['ep1.believedGuest']).toBeFalsy();
  expect(s1.clues[1]).not.toContain('ep1.F1');
  await expect(page.locator('.objective')).toContainText('Онфиму');

  await page.evaluate(() => {
    const g = window.__game!;
    g.giveClues(1);
    g.setTimeScale(3);
    g.jumpTo('nov_square', { stage: 'finale' });
  });
  await expectSay(page, 'Вы очень внимательны', 'Гость');
  await advance(page, 20);
  await advance(page, 20);
  await page.waitForSelector('.epoch-choice');
  await expect(page.locator('.epoch-choice-btn.agree')).toBeEnabled({ timeout: 3000 });
  await page.locator('.epoch-choice-btn.agree').click();
  await expectSay(page, 'Это не я писал.', 'Онфим');
  await advance(page);
  const mid = await state(page);
  expect(mid.byteSilent).toBe(true);
  expect(mid.integrity).toBe(0);
  await page.screenshot({ path: 'test-results/e1-12-agree.png' });
  await page.waitForSelector('.truth-card');
  await page.locator('.truth-card .btn').click();
  await waitScene(page, 'archive_hall');
  await expectSay(page, 'Идём дальше.', 'Байт');
  await advance(page);
  const end = await state(page);
  expect(end.byteSilent).toBe(false);
  expect(end.choices[0]).toBe('agree');
  expect(end.cards).toEqual([1]);
  expect(errors).toEqual([]);
});

test('эпоха 1: «Продолжить» с чекпоинтов восстанавливает локацию и цель', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=nov_square');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    Object.assign(g.getState().flags, { 'pro.done': true, 'e1.started': true, 'e1.onfimMet': true, 'e1.chestDone': true, 'e1.bakeryAsked': true, 'trigger.e1.bakeryEnter': true });
    g.checkpoint('e1.chest');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'nov_house');
  await expect(page.locator('.objective')).toContainText('Возьми дрова', { timeout: 5000 });

  await page.evaluate(() => {
    const g = window.__game!;
    g.giveClues(1);
    g.checkpoint('e1.interrogation');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'nov_workshop');
  await page.waitForSelector('.board', { timeout: 8000 });
  expect(errors).toEqual([]);
});

const SQUARE = { house: 220, bakery: 650, workshop: 840, stall: 330 };
