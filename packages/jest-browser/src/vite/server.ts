/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import * as fs from 'graceful-fs';
import type {Plugin, ViteDevServer} from 'vite';
import {loadVite} from './loadVite';
import {jestGlobalsPlugin} from './plugins/jestGlobalsPlugin';

export interface ViteServerOptions {
  api?: {host?: string; port?: number} | number;
  browserName: string;
  platform: string;
  rootDir: string;
  testerHtmlPath?: string;
  trackUnhandledErrors?: boolean;
  wsPort: number;
  viteConfig?: Record<string, unknown>;
}

function jestEntryPlugin(options: {
  rootDir: string;
  testerHtmlPath?: string;
}): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void (async () => {
          if (req.url === '/__jest_browser__') {
            let html: string;
            if (
              options.testerHtmlPath != null &&
              options.testerHtmlPath !== ''
            ) {
              const htmlPath = resolve(options.rootDir, options.testerHtmlPath);
              if (!fs.existsSync(htmlPath)) {
                throw new Error(`testerHtmlPath not found: ${htmlPath}`);
              }
              const customHtml = fs.readFileSync(htmlPath, 'utf8');
              // Inject test module import before closing </body>
              const scriptTag =
                '\n<script type="module">\nimport \'@jest/globals\';\n</script>\n';
              if (customHtml.includes('</body>')) {
                html = customHtml.replace('</body>', `${scriptTag}</body>`);
              } else {
                html = customHtml + scriptTag;
              }
            } else {
              html = `<!DOCTYPE html>
<html>
<head><title>Jest Browser Mode</title></head>
<body>
<script type="module">
import '@jest/globals';
</script>
</body>
</html>`;
            }
            const transformed = await server.transformIndexHtml(
              '/__jest_browser__',
              html,
            );
            res.setHeader('Content-Type', 'text/html');
            res.end(transformed);
            return;
          }
          next();
        })().catch(next);
      });
    },
    name: 'jest-browser:entry',
  };
}

export async function createViteServer(
  options: ViteServerOptions,
): Promise<ViteDevServer> {
  const {createServer} = await loadVite();

  const port =
    typeof options.api === 'number'
      ? options.api
      : typeof options.api === 'object'
        ? options.api.port
        : 0;

  const server = await createServer({
    configFile: false,
    optimizeDeps: {
      entries: [],
      include: ['birpc', '@jest/expect-utils'],
    },
    plugins: [
      jestEntryPlugin({
        rootDir: options.rootDir,
        testerHtmlPath: options.testerHtmlPath,
      }),
      jestGlobalsPlugin({
        browserName: options.browserName,
        platform: options.platform,
        trackUnhandledErrors: options.trackUnhandledErrors,
        wsPort: options.wsPort,
      }),
    ],
    root: options.rootDir,
    server: {
      hmr: false,
      host: typeof options.api === 'object' ? options.api.host : undefined,
      port,
      strictPort: options.api != null,
    },
    ...options.viteConfig,
  });

  await server.listen();

  return server;
}
