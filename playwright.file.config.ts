import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/file',
  timeout: 60_000,
  use: {
    // PW_CHROMIUM — путь к готовому Chromium (если браузер Playwright не скачан)
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
    headless: true, viewport: { width: 1280, height: 720 } },
});
