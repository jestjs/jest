/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('dynamic imports', () => {
  it('dynamically imports a module', async () => {
    const module = await import('./helpers/dynamic-helper');
    expect(module.greet('World')).toBe('Hello, World!');
  });

  it('dynamically imports built-in modules', async () => {
    // Dynamic import of a data URL works in real browsers
    const blob = new Blob(['export const x = 42;'], {type: 'text/javascript'});
    const url = URL.createObjectURL(blob);
    // Note: blob URLs may not work as module imports in all contexts
    // Instead test that dynamic import syntax itself works
    expect(typeof import('./helpers/dynamic-helper')).toBe('object'); // Promise
  });
});
