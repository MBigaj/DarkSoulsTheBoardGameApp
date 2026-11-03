import { describe, expect, it } from 'vitest';
import fontsCss from './fonts.css?raw';

// fonts.css paths are hand-written; Vite only warns on an unresolved url(), so check them here.
describe('fonts.css', () => {
  const shipped = new Set(
    Object.keys(import.meta.glob('/node_modules/@fontsource/*/files/*.woff2')).map((path) =>
      path.replace('/node_modules/', ''),
    ),
  );
  const sources = [...fontsCss.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1] ?? '');

  it.each(sources)('points at a shipped Fontsource file: %s', (src) => {
    expect(shipped.has(src)).toBe(true);
  });
});
