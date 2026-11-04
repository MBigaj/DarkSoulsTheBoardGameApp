import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';
import { resolveDataDir, resolveFixturesDir, TEST_FIXTURES_DIR } from './scripts/data-paths.ts';
import { preloadFonts } from './scripts/preload-fonts.ts';

export default defineConfig(({ mode }) => {
  // Tests always use the committed fixtures, so results never depend on the local store.
  const dataDir = mode === 'test' ? TEST_FIXTURES_DIR : resolveDataDir();
  const fixturesDir = mode === 'test' ? TEST_FIXTURES_DIR : resolveFixturesDir();

  return {
    plugins: [
      react(),
      // Display (headings, nav, buttons) and body faces; the rest load on demand.
      preloadFonts(['cormorant-garamond-latin-600-italic', 'eb-garamond-latin-400-normal']),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Read by mockApi through import.meta.glob (see src/shared/api/mock/sources).
        '@data': dataDir,
        '@fixtures': fixturesDir,
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      // The data store and fixtures live outside web/.
      fs: { allow: [searchForWorkspaceRoot(process.cwd()), dataDir, fixturesDir] },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: true,
    },
  };
});
