import type { Plugin } from 'vite';

/**
 * Adds <link rel="preload"> for the given font files to index.html at build time.
 * Matches emitted assets by name prefix, so it survives content hashes.
 * Dev serves fonts unhashed and unpreloaded, which is fine.
 */
export function preloadFonts(prefixes: readonly string[]): Plugin {
  return {
    name: 'bonfire:preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const assets = Object.keys(ctx.bundle ?? {});
        return prefixes.map((prefix) => {
          const file = assets.find(
            (name) => name.includes(`/${prefix}-`) && name.endsWith('.woff2'),
          );
          if (!file) throw new Error(`preload-fonts: no emitted font matches "${prefix}"`);
          return {
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head-prepend',
          };
        });
      },
    },
  };
}
