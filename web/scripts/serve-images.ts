import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { Connect, Plugin } from 'vite';

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * Serves the store's images/ folder at /images in `vite dev` and `vite preview`, as nginx does
 * in the prod image. Card `art` keys resolve against it (VITE_IMAGE_BASE_URL).
 */
export function serveImages(imagesDir: string): Plugin {
  const root = resolve(imagesDir);
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const path = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
    const file = resolve(root, `.${path}`);
    const type = TYPES[extname(file).toLowerCase()];
    if (!type || !file.startsWith(root + sep)) {
      next();
      return;
    }
    stat(file).then(
      (info) => {
        if (!info.isFile()) {
          next();
          return;
        }
        res.setHeader('Content-Type', type);
        res.setHeader('Content-Length', info.size);
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
      },
      () => {
        res.statusCode = 404;
        res.end();
      },
    );
  };
  return {
    name: 'bonfire:serve-images',
    configureServer(server) {
      server.middlewares.use('/images', middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/images', middleware);
    },
  };
}
