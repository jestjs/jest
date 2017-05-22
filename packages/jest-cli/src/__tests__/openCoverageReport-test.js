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

const fs = require('fs');
const opn = require('opn');
// Mocking necessary functions to make tessting this module isolated
jest.mock('fs', () => ({existsSync: jest.fn()}));
jest.mock('opn', () => jest.fn(() => Promise.resolve({})));
jest.mock('chalk', () => ({red: jest.fn()}));

const openCoverageReport = require('../openCoverageReport');

describe('openCoverageReport', () => {
  afterAll(() => {
    jest.mock('fs', () => require.requireActual('fs'));
  });
  it("should not open coverage report when coverage directory doesn't exist", () => {
    openCoverageReport('coverage');
    expect(fs.existsSync).toBeCalled();
  });
  it('Opens browser when coverage directory exists', async () => {
    fs.existsSync.mockReset();
    fs.existsSync = jest.fn(() => true);
    await openCoverageReport('coverage');
    expect(opn).toBeCalled();
  });
});
