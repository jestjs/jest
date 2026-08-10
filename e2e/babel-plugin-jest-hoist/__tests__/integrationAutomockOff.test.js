/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import a from '../__test_modules__/a';
import b from '../__test_modules__/b';

// These will all be hoisted above imports
jest.disableAutomock();
jest.mock('../__test_modules__/b');

describe('babel-plugin-jest-hoist', () => {
  it('hoists disableAutomock call before imports', () => {
    expect(a._isMockFunction).toBeUndefined();
  });

  it('hoists mock call before imports', () => {
    expect(b._isMockFunction).toBe(true);
  });
});
