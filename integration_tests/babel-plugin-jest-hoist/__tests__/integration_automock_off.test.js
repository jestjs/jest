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

import a from '../__test_modules__/a';
import b from '../__test_modules__/b';

// These will all be hoisted above imports
jest.disableAutomock();
jest.mock('../__test_modules__/b');

describe('babel-plugin-jest-hoist', () => {
  it('hoists disableAutomock call before imports', () => {
    expect(a._isMockFunction).toBe(undefined);
  });

  it('hoists mock call before imports', () => {
    expect(b._isMockFunction).toBe(true);
  });
});
