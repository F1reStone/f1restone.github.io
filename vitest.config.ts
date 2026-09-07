import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      // `astro:env/server` only exists during an Astro build; stub it so
      // modules that import `site.config.ts` (e.g. `lib/blog`) load in tests.
      'astro:env/server': resolve(import.meta.dirname, './src/test/stubs/astro-env-server.ts'),
    },
  },
});
