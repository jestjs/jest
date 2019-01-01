/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import cli from 'jest-cli';

const obj = {
  ...jest,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  fdescribe: describe.only,
  it: test,
  test,
  xdescribe: describe.skip,
};

export default (process.env.JEST_WORKER_ID !== undefined ? obj : cli);
