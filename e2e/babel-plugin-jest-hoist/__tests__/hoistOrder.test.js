/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import a from '../__test_modules__/a';

// These will all be hoisted above imports
jest.enableAutomock();
jest.disableAutomock();

describe('babel-plugin-jest-hoist', () => {
  it('preserves hoist order of disableAutomock & enableAutomock', () => {
    expect(a._isMockFunction).toBe(undefined);
  });
});
