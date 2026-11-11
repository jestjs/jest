/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const path = require('path');

let createRuntime;

describe('Runtime requireModule', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  // Each runtime gets its own `cacheFS`, as each test file does, while
  // `ScriptTransformer` keeps transformed files per project across them.
  it('does not read a module again once another runtime transformed it', async () => {
    const firstRuntime = await createRuntime(__filename);
    const secondRuntime = await createRuntime(__filename);
    const regularModulePath = path.join(
      __dirname,
      'test_root',
      'RegularModule.js',
    );

    firstRuntime.requireModule(firstRuntime.__mockRootPath, 'RegularModule');
    expect(firstRuntime.__cacheFS.has(regularModulePath)).toBe(true);

    const exports = secondRuntime.requireModule(
      secondRuntime.__mockRootPath,
      'RegularModule',
    );

    expect(exports.isRealModule).toBe(true);
    expect(secondRuntime.__cacheFS.has(regularModulePath)).toBe(false);
  });
});
