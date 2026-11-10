import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';
import { resolveDataDir, resolveFixturesDir, TEST_FIXTURES_DIR } from './scripts/data-paths.ts';
import { preloadFonts } from './scripts/preload-fonts.ts';
import { serveImages } from './scripts/serve-images.ts';

export default defineConfig(({ mode }) => {
  // Tests always use the committed fixtures, so results never depend on the local store.
  const dataDir = mode === 'test' ? TEST_FIXTURES_DIR : resolveDataDir();
  const fixturesDir = mode === 'test' ? TEST_FIXTURES_DIR : resolveFixturesDir();

  return {
    plugins: [
      react(),
      // Faces seen on first paint (titles, nav, headings and tabs, body, ledes, mono labels),
      // so the page's text appears at once; the rest load on demand.
      preloadFonts([
        'cormorant-garamond-latin-600-italic',
        'cormorant-garamond-latin-600-normal',
        'cormorant-garamond-latin-700-normal',
        'eb-garamond-latin-400-normal',
        'eb-garamond-latin-400-italic',
        'ibm-plex-mono-latin-400-normal',
      ]),
      serveImages(join(dataDir, 'images')),
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
