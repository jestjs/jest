/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AsyncLocalStorage, createHook} from 'async_hooks';
import {clsx} from 'clsx';

describe('NodeEnvironment 2', () => {
  test('dispatch event', () => {
    new EventTarget().dispatchEvent(new Event('foo'));
  });

  test('set modules on global', () => {
    (globalThis as any).AsyncLocalStorage = require('async_hooks');
    (globalThis as any).createHook = require('async_hooks').createHook;
    (globalThis as any).clsx = require('clsx');
    expect(AsyncLocalStorage).toBeDefined();
    expect(createHook).toBeDefined();
    expect(clsx).toBeDefined();
  });
});
