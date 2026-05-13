/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jestGlobalsPlugin} from '../vite/plugins/jestGlobalsPlugin';

describe('jestGlobalsPlugin', () => {
  test('plugin metadata', () => {
    const plugin = jestGlobalsPlugin(4455);

    expect(plugin.name).toBe('jest-browser:globals');
    expect(plugin.enforce).toBe('pre');
  });

  test('resolveId returns virtual module id for @jest/globals', () => {
    const plugin = jestGlobalsPlugin(4455);

    expect(plugin.resolveId?.('@jest/globals')).toBe('\0@jest/globals');
    expect(plugin.resolveId?.('other-module')).toBeNull();
  });

  test('load returns re-export from globals-entry.ts', () => {
    const plugin = jestGlobalsPlugin(4455);
    const source = plugin.load?.('\0@jest/globals');

    expect(typeof source).toBe('string');
    expect(source as string).toContain('globals-entry.ts');
    expect(source as string).toContain('export');
    expect(source as string).toContain('describe');
    expect(source as string).toContain('expect');
  });
});
