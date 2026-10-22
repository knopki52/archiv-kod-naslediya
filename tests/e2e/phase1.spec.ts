import { expect, test, type Page } from '@playwright/test';

async function dismissDialogs(page: Page, max = 8): Promise<void> {
  for (let i = 0; i < max; i++) {
    const open = await page.evaluate(() => window.__game!.isDialogOpen());
    if (!open) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
}

async function waitDialog(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__game!.isDialogOpen(), null, { timeout: 15000 });
}

async function start(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1&scene=test');
  await page.waitForFunction(() => Boolean(window.__game));
  await page.evaluate(() => window.__game!.setTimeScale(4));
  await waitDialog(page);
  await dismissDialogs(page, 12);
  await page.waitForFunction(() => !window.__game!.isDialogOpen());
  return errors;
}

async function hoverHotspot(page: Page, x: number, y: number): Promise<void> {
  const box = (await page.locator('.loupe-canvas').boundingBox())!;
  await page.mouse.move(box.x + (x / 320) * box.width, box.y + (y / 180) * box.height);
}

test('фаза 1: цикл эпохи 1 «на серых боксах» — Лупа → улики → допрос → доска → выбор → карточка', async ({ page }) => {
  const errors = await start(page);
  void page.evaluate(() => window.__game!.runScript('lab#start'));

  await waitDialog(page);
  await dismissDialogs(page);
  await page.waitForSelector('.loupe');
  const qs = page.locator('.loupe-questions .btn');
  await expect(qs).toHaveCount(3);
  for (let i = 0; i < 3; i++) await qs.nth(i).click();
  await expect(page.locator('.loupe-stamp')).toBeVisible();
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Вот. Это подделка', { timeout: 5000 });
  await dismissDialogs(page);

  await page.waitForSelector('.loupe-canvas');
  await expect(page.locator('.loupe-title')).toHaveText('Грамота из сундука');
  await hoverHotspot(page, 105, 78);
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Чернила на бересте', { timeout: 5000 });
  await dismissDialogs(page);
  await hoverHotspot(page, 215, 112);
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('пожалуйста', { timeout: 5000 });
  await dismissDialogs(page);
  await page.waitForSelector('.loupe', { state: 'detached', timeout: 8000 });
  let st = await page.evaluate(() => window.__game!.getState());
  expect(st.clues[1]).toEqual(expect.arrayContaining(['ep1.U1', 'ep1.U2']));

  await page.waitForSelector('.minigame-birch');
  await page.evaluate(() => window.__game!.setTimeScale(80));
  await page.locator('.minigame-skip').click({ timeout: 8000 });
  await page.evaluate(() => window.__game!.setTimeScale(4));
  await page.waitForSelector('.interro');

  const chip = (t: string) => page.locator('.chip', { hasText: t });
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Свет в мастерской' }).click();
  await waitDialog(page);
  await dismissDialogs(page);
  expect((await page.evaluate(() => window.__game!.getState())).interrogation['ignat']!.wrongPresents).toBe(0);

  await chip('Где ты был вчера вечером?').click();
  await expect(page.locator('.bubble-npc').last()).toContainText('В церкви');
  await chip('Кто мог зайти в мастерскую?').click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Чернилами по бересте');

  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Настоящая грамота существует' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Это здесь при чём?');
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Не то. Подумай');
  await dismissDialogs(page);

  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Свет в мастерской' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Огонь затеплить');
  await page.getByRole('button', { name: 'Предъявить улику' }).click();
  await page.locator('.picker-card', { hasText: 'Написано чернилами' }).click();
  await expect(page.locator('.bubble-npc').last()).toContainText('Я лишь поправил', { timeout: 5000 });
  await page.waitForSelector('.interro', { state: 'detached', timeout: 8000 });
  st = await page.evaluate(() => window.__game!.getState());
  expect(st.clues[1]).toContain('ep1.U6');

  await page.waitForSelector('.board');
  const pick = (t: string) => page.locator('.clue-card', { hasText: t }).click();
  await pick('Написано чернилами');
  await pick('Слово из будущего');
  await pick('Гость без следов');
  await page.getByRole('button', { name: 'Обвинить' }).click();
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Почти');
  await dismissDialogs(page);
  for (const t of ['Написано чернилами', 'Слово из будущего', 'Гость без следов']) await pick(t);
  await pick('Гость без следов');
  await pick('Свет в мастерской');
  await pick('Игнат правил текст за серебро');
  await page.getByRole('button', { name: 'Обвинить' }).click();
  await page.waitForSelector('.board', { state: 'detached', timeout: 8000 });

  await page.waitForSelector('.epoch-choice');
  const truth = page.locator('.epoch-choice-btn.truth');
  await expect(truth).toBeEnabled({ timeout: 3000 });
  await truth.click();
  await waitDialog(page);
  await expect(page.locator('.dialog-text')).toContainText('Косой, но мой', { timeout: 5000 });
  await dismissDialogs(page);

  await page.waitForSelector('.truth-card');
  await expect(page.locator('.truth-card-title')).toHaveText('Берестяные грамоты');
  await page.locator('.truth-card .btn').click();
  await page.waitForFunction(() => window.__game!.getState().checkpoint === 'lab.end');

  st = await page.evaluate(() => window.__game!.getState());
  expect(st.integrity).toBe(1);
  expect(st.cards).toEqual([1]);
  expect(st.choices[0]).toBe('truth');
  expect(st.flags['ep1.choice']).toBe('truth');
  expect(errors).toEqual([]);
});

test('выбор «согласиться»: integrity не растёт, Байт молчит до возврата в Хаб', async ({ page }) => {
  const errors = await start(page);
  void page.evaluate(() => window.__game!.performStep({ t: 'epochChoice', epoch: 1 }));
  await page.waitForSelector('.epoch-choice');
  const agree = page.locator('.epoch-choice-btn.agree');
  await expect(agree).toBeEnabled({ timeout: 3000 });
  await agree.click();
  await page.waitForSelector('.epoch-choice', { state: 'detached' });
  const st = await page.evaluate(() => window.__game!.getState());
  expect(st.integrity).toBe(0);
  expect(st.choices[0]).toBe('agree');
  expect(st.byteSilent).toBe(true);
  void page.evaluate(() => window.__game!.runScript('lab#agree'));
  await waitDialog(page);
  await expect(page.locator('.dialog-name')).toHaveText('Онфим');
  await dismissDialogs(page);
  await page.waitForSelector('.truth-card');
  expect(await page.evaluate(() => window.__game!.isDialogOpen())).toBe(false);
  await page.locator('.truth-card .btn').click();
  await page.waitForFunction(() => window.__game!.getState().checkpoint === 'lab.end');
  expect(errors).toEqual([]);
});

test('мини-игра «Склей берёсту»: перетаскивание обрывков на места', async ({ page }) => {
  const errors = await start(page);
  void page.evaluate(() => window.__game!.performStep({ t: 'minigame', id: 'birch' }));
  await page.waitForSelector('.birch-area');
  const pieces = page.locator('.birch-piece');
  await expect(pieces).toHaveCount(6);
  const slots = page.locator('.birch-slot');
  for (let n = 0; n < 6; n++) {
    const piece = pieces.nth(n);
    const col = Number(await piece.getAttribute('data-col'));
    const row = Number(await piece.getAttribute('data-row'));
    const slot = slots.nth(row * 3 + col);
    const pb = (await piece.boundingBox())!;
    const sb = (await slot.boundingBox())!;
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 6 });
    await page.mouse.up();
  }
  await page.waitForSelector('.minigame-birch', { state: 'detached', timeout: 8000 });
  const flag = await page.evaluate(() => window.__game!.getState().flags['minigame.birch']);
  expect(flag).toBe('done');
  expect(errors).toEqual([]);
});

test('мини-игра «Пульт»: верная цепочка, неверная даёт подсказку Гали', async ({ page }) => {
  const errors = await start(page);
  void page.evaluate(() => window.__game!.performStep({ t: 'minigame', id: 'panel' }));
  await page.waitForSelector('.cp-panel');
  await page.getByRole('button', { name: 'Подать ток' }).click();
  await waitDialog(page);
  await expect(page.locator('.dialog-name')).toHaveText('Галя');
  await expect(page.locator('.dialog-text')).toContainText('Начни с питания');
  await page.waitForFunction(() => !window.__game!.isDialogOpen(), null, { timeout: 8000 });
  const order = ['Питание', 'Передатчик', 'Антенна', 'Приёмник', 'Запись'];
  for (let i = 0; i < order.length - 1; i++) {
    await page.getByLabel(`Выход блока «${order[i]}»`).click();
    await page.getByLabel(`Вход блока «${order[i + 1]}»`).click();
  }
  await page.getByRole('button', { name: 'Подать ток' }).click();
  await page.waitForSelector('.minigame-panel', { state: 'detached', timeout: 8000 });
  expect(await page.evaluate(() => window.__game!.getState().flags['minigame.panel'])).toBe('done');
  expect(errors).toEqual([]);
});

test('мини-игра «Проявить карандаш»: водим грифелем по листу', async ({ page }) => {
  const errors = await start(page);
  void page.evaluate(() => window.__game!.performStep({ t: 'minigame', id: 'pencil' }));
  await page.waitForSelector('.pencil-canvas');
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
  await page.waitForSelector('.minigame-pencil', { state: 'detached', timeout: 10000 });
  expect(await page.evaluate(() => window.__game!.getState().flags['minigame.pencil'])).toBe('done');
  expect(errors).toEqual([]);
});

test('подсказки Байта: простой в мире → реплика уровня 1', async ({ page }) => {
  const errors = await start(page);
  await page.evaluate(() => window.__game!.setTimeScale(11));
  await waitDialog(page);
  await expect(page.locator('.dialog-name')).toHaveText('Байт');
  await expect(page.locator('.dialog-text')).toContainText('мерцающей книге', { timeout: 6000 });
  expect(errors).toEqual([]);
});

test('журнал улик открывается по J и закрывается по Esc', async ({ page }) => {
  const errors = await start(page);
  await page.evaluate(() => window.__game!.giveClues(1));
  await page.keyboard.press('KeyJ');
  await page.waitForSelector('.journal');
  await expect(page.locator('.journal-clue').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForSelector('.journal', { state: 'detached' });
  expect(errors).toEqual([]);
});
