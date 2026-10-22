import { expect, type Page } from '@playwright/test';

export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.stack ?? String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

export async function fastText(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('archive.settings.v1', JSON.stringify({ textSpeed: 'instant', music: 0, sfx: 0 }));
  });
}

export async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__game));
}

export const scene = (page: Page) => page.evaluate(() => window.__game!.scene());

export async function waitScene(page: Page, key: string, timeout = 15000): Promise<void> {
  await page.waitForFunction((k) => window.__game!.scene() === k, key, { timeout });
}

export const state = (page: Page) => page.evaluate(() => window.__game!.getState());

export async function advance(page: Page, idleChecks = 6): Promise<void> {
  let idle = 0;
  for (let i = 0; i < 80 && idle < idleChecks; i++) {
    const st = await page.evaluate(() => ({
      d: window.__game!.isDialogOpen(),
      c: window.__game!.isChoiceOpen(),
      m: document.querySelectorAll('.modal').length,
    }));
    if (st.c || st.m > 0) return;
    if (st.d) {
      idle = 0;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(60);
    } else {
      idle++;
      await page.waitForTimeout(80);
    }
  }
}

export async function expectSay(page: Page, text: string, name?: string): Promise<void> {
  await page.waitForFunction(() => window.__game!.isDialogOpen(), null, { timeout: 15000 });
  await expect(page.locator('.dialog-text')).toContainText(text, { timeout: 8000 });
  if (name) await expect(page.locator('.dialog-name')).toHaveText(name);
}

export async function pickChoice(page: Page, text: string): Promise<void> {
  await page.waitForFunction(() => window.__game!.isChoiceOpen(), null, { timeout: 15000 });
  await page.waitForTimeout(420);
  await page.locator('.choice-btn', { hasText: text }).click();
}

export async function walkTo(page: Page, targetX: number, _scale = 2, targetY?: number): Promise<void> {
  await page.waitForFunction(
    ({ x, y }) => {
      const g = window.__game! as unknown as { isDialogOpen(): boolean; stepToward(x: number, y?: number): boolean };
      if (g.isDialogOpen() || document.querySelector('.modal')) return false;
      return g.stepToward(x, y);
    },
    { x: targetX, y: targetY },
    { polling: 'raf', timeout: 30000 },
  );
}

export async function interact(page: Page, promptText: string): Promise<void> {
  const diag = async () =>
    console.log(
      `interact «${promptText}» не найден: ` +
        JSON.stringify(await page.evaluate(() => ({
          pos: window.__game!.playerPos(),
          prompt: document.querySelector('.world-prompt')?.textContent,
          hidden: (document.querySelector('.world-prompt') as HTMLElement | null)?.hidden,
          dlg: window.__game!.isDialogOpen(),
          modals: document.querySelectorAll('.modal').length,
          scene: window.__game!.scene(),
          log: (window as unknown as { __log: string[] }).__log,
        }))),
    );
  const promptShown = (t: string) => {
    const el = document.querySelector<HTMLElement>('.world-prompt');
    return el !== null && !el.hidden && (el.textContent ?? '').includes(t);
  };
  const near = await page.waitForFunction(promptShown, promptText, { timeout: 600 }).then(() => true, () => false);
  if (!near) {
    await page.waitForFunction(() => !window.__game!.isDialogOpen() && !document.querySelector('.modal'), null, { timeout: 8000 }).catch(() => undefined);
    await page.evaluate((t) => (window.__game! as unknown as { approach(t: string): boolean }).approach(t), promptText);
  }
  await page.waitForFunction(promptShown, promptText, { timeout: 8000 }).catch(async (e) => {
    await diag();
    throw e;
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyE');
}

export async function hoverHotspot(page: Page, x: number, y: number): Promise<void> {
  const box = (await page.locator('.loupe-canvas').boundingBox())!;
  await page.mouse.move(box.x + (x / 320) * box.width, box.y + (y / 180) * box.height);
}

export async function walkUntilDialog(page: Page, key: 'KeyD' | 'KeyA' = 'KeyD', _scale = 2): Promise<void> {
  await page.waitForFunction(
    (dir) => {
      const g = window.__game! as unknown as { isDialogOpen(): boolean; stepToward(x: number): boolean };
      if (g.isDialogOpen()) return true;
      if (!document.querySelector('.modal')) g.stepToward(dir > 0 ? 1e5 : -1e5);
      return false;
    },
    key === 'KeyD' ? 1 : -1,
    { polling: 'raf', timeout: 30000 },
  );
}

export async function dismiss(page: Page, max = 8): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (!(await page.evaluate(() => window.__game!.isDialogOpen()))) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
}

export async function next(page: Page): Promise<void> {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
}
