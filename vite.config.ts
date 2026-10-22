import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Сборка рассчитана на запуск двойным кликом (file://): один HTML со вшитыми JS/CSS/шрифтами.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: 'es2020',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173, host: true, fs: { allow: ['/home/claude/proj'] } },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
} as never);
