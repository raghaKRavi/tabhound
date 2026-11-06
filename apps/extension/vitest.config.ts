import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Separate from wxt.config.ts: tests need no extension build, only TS + Preact + jsdom.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  // Vite 8 compiles TS/JSX with Oxc; render JSX with Preact's automatic runtime.
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.output/**', '.wxt/**'],
    css: false,
  },
});
