import { expect, test, type Page } from '@playwright/test';
import {
  advance, dismiss, expectSay, fastText, hoverHotspot, interact, next, open, pickChoice, scene, state, waitScene, walkTo,
  walkUntilDialog, watchErrors,
} from './helpers';

async function rubPencil(page: Page): Promise<void> {
  const box = (await page.locator('.pencil-canvas').boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y <= 1; y += 0.04) {
      await page.mouse.move(box.x + box.width * (pass % 2 ? 0.98 : 0.02), box.y + box.height * y, { steps: 2 });
      await page.mouse.move(box.x + box.width * (pass % 2 ? 0.02 : 0.98), box.y + box.height * (y + 0.02), { steps: 2 });
    }
  }
  await page.mouse.up();
}

test('эпоха 2 «Ленинград»: полное прохождение (вернуть правду, спасти голоса)', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=len_hall');
  await page.evaluate(() => window.__game!.setTimeScale(3));

  await expectSay(page, 'Здесь я не ворон, а воротник', 'Байт');
  await page.screenshot({ path: 'test-results/e2-01-arrive.png' });
  await advance(page);
  await expect(page.locator('.objective')).toContainText('Подойди к печке');

  await walkUntilDialog(page, 'KeyA');
  await expectSay(page, 'Вы не от управдома?', 'Мария Павловна');
  await page.screenshot({ path: 'test-results/e2-02-meet.png' });
  await advance(page);
  await expect(page.locator('.objective')).toContainText('дневник');

  await walkTo(page, 124);
  await interact(page, 'Осмотреть дневник');
  await page.waitForSelector('.loupe-canvas');
  await hoverHotspot(page, 130, 138);
  await expectSay(page, 'карандашом', 'Зина');
  await dismiss(page);
  await hoverHotspot(page, 90, 60);
  await expectSay(page, 'Пятьсот граммов?', 'Байт');
  await dismiss(page);
  await hoverHotspot(page, 200, 92);
  await expectSay(page, 'Тёплая вода из крана?', 'Мария Павловна');
  await dismiss(page);
  await page.waitForSelector('.loupe', { state: 'detached', timeout: 8000 });
  expect((await state(page)).clues[2]).toEqual(expect.arrayContaining(['ep2.U1', 'ep2.U2']));
  await expect(page.locator('.objective')).toContainText('Марией Павловной');

  await walkTo(page, 176);
  await interact(page, 'Марией Павловной');
  await pickChoice(page, 'Кто сюда заходил?');
  await expectSay(page, 'Приходил один, в длинном пальто', 'Мария Павловна');
  await advance(page);
  await page.waitForSelector('.minigame-pencil');
  await page.screenshot({ path: 'test-results/e2-03-pencil.png' });
  await rubPencil(page);
  await expectSay(page, 'Это я писала', 'Зина');
  await next(page);
  await expectSay(page, 'Ключ был только у управдома', 'Байт');
  await advance(page);
  const a1 = await state(page);
  expect(a1.clues[2]).toEqual(expect.arrayContaining(['ep2.U3', 'ep2.U4']));
  expect(a1.flags['e2.yardOpen']).toBe(true);
  await expect(page.locator('.objective')).toContainText('управдома');

  await walkTo(page, 452);
  await interact(page, 'Выйти во двор');
  await waitScene(page, 'len_yard');
  await expectSay(page, 'Библиотека!', 'Прохоров');
  await page.screenshot({ path: 'test-results/e2-04-yard.png' });
  await advance(page);
  await walkTo(page, 444);
  await interact(page, 'Допросить управдома');
  await page.waitForSelector('.interro');
  await page.locator('.chip', { hasText: 'Где вы были этой ночью?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('В убежище');
  await page.locator('.chip', { hasText: 'Что за хлеб вы ели?' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Свой. По карточке');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'У Корреспондента нет пара' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Проверить окна');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Хлеба не 500 граммов' }).click();
  await page.waitForSelector('.interro', { state: 'detached', timeout: 10000 });
  expect((await state(page)).clues[2]).toContain('ep2.U5');

  await page.waitForSelector('.board-ep2');
  await expect(page.locator('.clue-card')).toHaveCount(5);
  const pick = (t: string) => page.locator('.clue-card', { hasText: t }).click();
  await pick('Подлинные страницы');
  await pick('Прохоров отдал ключ');
  await pick('Хлеба не 500 граммов');
  await page.getByRole('button', { name: 'Обвинить' }).click();
  await expectSay(page, 'Не хватает главного');
  await dismiss(page);
  await pick('Хлеба не 500 граммов');
  await pick('У Корреспондента нет пара');
  await page.screenshot({ path: 'test-results/e2-05-board.png' });
  await page.getByRole('button', { name: 'Обвинить' }).click();

  await waitScene(page, 'len_hall');
  await expectSay(page, 'Добрый вечер. Я пришёл за дневником', 'Корреспондент');
  await page.screenshot({ path: 'test-results/e2-06-correspondent.png' });
  await next(page);
  await expectSay(page, 'Вы очень внимательны', 'Корреспондент');
  await next(page);
  await expectSay(page, 'Давай честно', 'Дублёр');
  await page.screenshot({ path: 'test-results/e2-07-dubler.png' });
  await advance(page, 20);
  await page.waitForSelector('.epoch-choice');
  await expect(page.locator('.epoch-choice-btn.truth')).toBeEnabled({ timeout: 3000 });
  await page.locator('.epoch-choice-btn.truth').click();
  await expectSay(page, 'Завтра будет завтра', 'Зина');
  await next(page);

  await waitScene(page, 'len_cellar');
  await expectSay(page, 'Ключ у меня. Прости, Мария Павловна', 'Прохоров');
  await page.screenshot({ path: 'test-results/e2-08-night.png' });
  await advance(page);
  await expect(page.locator('.objective')).toContainText('Реши, что спасти');
  await walkTo(page, 150);
  await interact(page, 'Семёна Аркадьевича');
  await expectSay(page, 'хлеб, который будет через пять лет', 'Семён Аркадьевич');
  await advance(page);
  await walkTo(page, 300);
  await interact(page, 'Погрузить на сани');
  await pickChoice(page, 'Дневники и письма горожан');
  await expectSay(page, 'Нельзя спасти всё', 'Байт');
  await advance(page, 25);
  await page.waitForSelector('.truth-card');
  await expect(page.locator('.truth-card-title')).toHaveText('Блокада Ленинграда');
  await page.locator('.truth-card .btn').click();
  await waitScene(page, 'archive_hall');
  await expectSay(page, 'Теперь Байконур', 'Байт');
  await advance(page);

  const end = await state(page);
  expect(end.artifact).toBe('voices');
  expect(end.choices[1]).toBe('truth');
  expect(end.integrity).toBe(1);
  expect(end.cards).toEqual([2]);
  expect(end.epochDone).toEqual([false, true, false]);
  expect(await scene(page)).toBe('archive_hall');
  expect(errors).toEqual([]);
});

test('эпоха 2: «согласиться» (метроном замирает), ночью спасаем дрова', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=len_hall');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    Object.assign(g.getState().flags, { 'pro.done': true, 'e2.started': true, 'e2.met': true, 'e2.diaryDone': true, 'e2.minigameDone': true, 'e2.yardOpen': true });
    g.giveClues(2);
    g.setTimeScale(3);
    g.jumpTo('len_hall', { stage: 'finale' });
  });
  await expectSay(page, 'Добрый вечер. Я пришёл за дневником', 'Корреспондент');
  await advance(page, 20);
  await advance(page, 20);
  await page.waitForSelector('.epoch-choice');
  await expect(page.locator('.epoch-choice-btn.agree')).toBeEnabled({ timeout: 3000 });
  await page.locator('.epoch-choice-btn.agree').click();
  await expectSay(page, 'Красиво. Но я такого не помню.', 'Зина');
  await page.screenshot({ path: 'test-results/e2-09-agree.png' });
  const mid = await state(page);
  expect(mid.byteSilent).toBe(true);
  await next(page);
  await waitScene(page, 'len_cellar');
  await expectSay(page, 'Ключ у меня', 'Прохоров');
  await advance(page);
  await walkTo(page, 300);
  await interact(page, 'Погрузить на сани');
  await pickChoice(page, 'Дрова');
  await advance(page, 25);
  await page.waitForSelector('.truth-card');
  await page.locator('.truth-card .btn').click();
  await waitScene(page, 'archive_hall');
  await expectSay(page, 'Теперь Байконур', 'Байт');
  await advance(page);
  const end = await state(page);
  expect(end.artifact).toBe('fire');
  expect(end.choices[1]).toBe('agree');
  expect(end.integrity).toBe(0);
  expect(end.byteSilent).toBe(false);
  expect(errors).toEqual([]);
});

test('эпоха 2: «Продолжить» с чекпоинтов', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await fastText(page);
  await open(page, '/?debug=1&scene=len_hall');
  await page.evaluate(() => {
    const g = window.__game!;
    g.stopScripts();
    Object.assign(g.getState().flags, { 'pro.done': true, 'e2.started': true, 'e2.met': true, 'e2.diaryDone': true });
    g.checkpoint('e2.diary');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'len_hall');
  await expect(page.locator('.objective')).toContainText('Марией Павловной', { timeout: 5000 });

  await page.evaluate(() => {
    const g = window.__game!;
    g.giveClues(2);
    g.checkpoint('e2.interrogation');
  });
  await open(page, '/?debug=1');
  await page.getByRole('button', { name: 'Нажми, чтобы начать' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await waitScene(page, 'len_yard');
  await page.waitForSelector('.board', { timeout: 8000 });
  expect(errors).toEqual([]);
});
