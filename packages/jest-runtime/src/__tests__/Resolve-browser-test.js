/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

let createRuntime;

describe('resolve', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('respects "browser" dependency when browser:true configured', () =>
    createRuntime(__filename, {
      browser: true,
    }).then(runtime => {
      const exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'jest-resolve-test',
      );
      expect(exports.isBrowser).toBe(true);
    }));

  it(`doesn't resolve "browser" dependency by default`, () => createRuntime(
    __filename,
    {},
    {
      browser: false,
    },
  ).then(runtime => {
    const exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'jest-resolve-test',
    );
    expect(exports.isBrowser).toBe(false);
  }));
});
