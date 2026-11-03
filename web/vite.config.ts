import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { preloadFonts } from './scripts/preload-fonts';

export default defineConfig({
  plugins: [
    react(),
    // Display (headings, nav, buttons) and body faces; the rest load on demand.
    preloadFonts(['cormorant-garamond-latin-600-italic', 'eb-garamond-latin-400-normal']),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
});
