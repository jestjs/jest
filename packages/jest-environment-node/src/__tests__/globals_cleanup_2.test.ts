/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AsyncLocalStorage, createHook} from 'async_hooks';
import {clsx} from 'clsx';
import {onNodeVersions} from '@jest/test-utils';

describe('Globals Cleanup 2', () => {
  test('dispatch event', () => {
    new EventTarget().dispatchEvent(new Event('foo'));
  });

  test('set modules on global', () => {
    (globalThis as any).async_hooks = require('async_hooks');
    (globalThis as any).AsyncLocalStorage =
      require('async_hooks').AsyncLocalStorage;
    (globalThis as any).createHook = require('async_hooks').createHook;
    (globalThis as any).clsx = require('clsx');
    expect(AsyncLocalStorage).toBeDefined();
    expect(clsx).toBeDefined();
    expect(createHook).toBeDefined();
    expect(createHook({})).toBeDefined();
    expect(clsx()).toBeDefined();
  });

  onNodeVersions('>=19.8.0', () => {
    test('use static function from core module set on global', () => {
      expect(AsyncLocalStorage.snapshot).toBeDefined();
      expect(AsyncLocalStorage.snapshot()).toBeDefined();
    });
  });
});
