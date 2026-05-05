/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs = require('node:fs');
const {expectModuleMocked} = require('../testUtils');

jest.mock('node:fs');

it('correctly mocks the module', () => {
  expectModuleMocked(fs);
});
