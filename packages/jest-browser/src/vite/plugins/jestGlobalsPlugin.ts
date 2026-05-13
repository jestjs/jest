/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, resolve} from 'node:path';
import type {Plugin} from 'vite';

const VIRTUAL_MODULE_ID = '@jest/globals';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_MODULE_ID}`;
const BROWSER_VIRTUAL_MODULE_ID = '@jest/browser';
const RESOLVED_BROWSER_VIRTUAL_ID = `\0${BROWSER_VIRTUAL_MODULE_ID}`;
const CONFIG_VIRTUAL_ID = '\0@jest/browser-config';

// Resolve absolute path to client entry files
const PKG_ROOT = dirname(require.resolve('@jest/browser/package.json'));
const CLIENT_DIR = resolve(PKG_ROOT, 'src/client/tester');

/**
 * Vite plugin that provides `@jest/globals` and `@jest/browser` as virtual modules.
 * Instead of inlining 1000+ lines of code, it sets config globals and re-exports
 * from actual TypeScript source files that Vite transforms.
 */
export interface JestGlobalsPluginOptions {
  browserName: string;
  platform: string;
  trackUnhandledErrors?: boolean;
  wsPort: number;
}

export function jestGlobalsPlugin(options: JestGlobalsPluginOptions): Plugin {
  const {browserName, platform, trackUnhandledErrors, wsPort} = options;
  const globalsEntryPath = resolve(CLIENT_DIR, 'globals-entry.ts');
  const browserEntryPath = resolve(CLIENT_DIR, 'browser-entry.ts');

  return {
    enforce: 'pre',

    load(id: string) {
      if (id === CONFIG_VIRTUAL_ID) {
        // This module evaluates first (as dep of globals-entry), setting config
        return `
globalThis.__JEST_BROWSER_CONFIG__ = {
  browserName: ${JSON.stringify(browserName)},
  platform: ${JSON.stringify(platform)},
  trackUnhandledErrors: ${trackUnhandledErrors === false ? 'false' : 'true'},
  wsPort: ${wsPort},
};
export default globalThis.__JEST_BROWSER_CONFIG__;
`;
      }

      if (id === RESOLVED_VIRTUAL_ID) {
        return `export {
  describe, it, test, expect, jest,
  beforeAll, afterAll, beforeEach, afterEach,
  __browserInternals,
} from ${JSON.stringify(globalsEntryPath)};
`;
      }

      if (id === RESOLVED_BROWSER_VIRTUAL_ID) {
        return `export { page, userEvent, commands, server } from ${JSON.stringify(browserEntryPath)};`;
      }

      return null;
    },

    name: 'jest-browser:globals',

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_ID;
      }

      if (id === BROWSER_VIRTUAL_MODULE_ID) {
        return RESOLVED_BROWSER_VIRTUAL_ID;
      }

      if (id === '@jest/browser-config') {
        return CONFIG_VIRTUAL_ID;
      }

      return null;
    },
  };
}
