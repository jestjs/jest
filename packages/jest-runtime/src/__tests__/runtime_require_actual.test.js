/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;

describe('Runtime requireActual', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('requires node module when manual mock exists', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireActual(
      runtime.__mockRootPath,
      'mocked-node-module',
    );
    expect(exports.isManualMockModule).toBe(false);
  });

  test('requireActual with moduleNameMapper', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper: {
        '^testMapped/(.*)': '<rootDir>/mapped_dir/$1',
      },
    });
    const exports = runtime.requireActual(
      runtime.__mockRootPath,
      'testMapped/moduleInMapped',
    );
    expect(exports).toBe('in_mapped');
  });
});
