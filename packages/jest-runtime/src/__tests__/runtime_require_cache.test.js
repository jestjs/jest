/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;

describe('Runtime require.cache', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('require.cache returns loaded module list as native Nodejs require does', () =>
    createRuntime(__filename).then(runtime => {
      const regularModule = runtime.requireModule(
        runtime.__mockRootPath,
        'RegularModule',
      ).module;
      const id = regularModule.id;
      const cache = regularModule.require.cache;

      expect(cache[id]).toBe(regularModule);
      expect(id in cache).toBeTruthy();
      expect(Object.keys(cache).includes(id)).toBeTruthy();
      expect(Object.getOwnPropertyNames(cache).includes(id)).toBeTruthy();
    }));

  it('require.cache is tolerant readonly', () =>
    createRuntime(__filename).then(runtime => {
      const regularModule = runtime.requireModule(
        runtime.__mockRootPath,
        'RegularModule',
      ).module;

      delete regularModule.require.cache[regularModule.id];
      expect(regularModule.require.cache[regularModule.id]).toBe(regularModule);

      regularModule.require.cache[regularModule.id] = 'something';
      expect(regularModule.require.cache[regularModule.id]).toBe(regularModule);
    }));
});
