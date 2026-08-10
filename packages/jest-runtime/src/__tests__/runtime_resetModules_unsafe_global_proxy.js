/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('resetModules', () => {
    it('does not throw when accessing _isMockFunction on an unsafe global', async () => {
      const runtime = await createRuntime(__filename);
      runtime._environment.global.UNSAFE_GLOBAL = new Proxy(
        {},
        {
          get(target, p, receiver) {
            if (p === '_isMockFunction') throw new Error('Unsafe global!');
          },
        },
      );
      expect(() => runtime.resetModules()).not.toThrow();
    });
  });
});
