/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const rimraf = require('rimraf');
const path = require('path');
const {extractSummary} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../snapshot-mock-fs');
const snapshotDir = path.resolve(DIR, '__tests__/__snapshots__');
const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');

beforeEach(() => rimraf.sync(snapshotDir));
afterAll(() => rimraf.sync(snapshotDir));

test('store snapshot even if fs is mocked', () => {
  const {json, status, stderr} = runJest.json(DIR, ['--ci=false']);

  expect(status).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);

  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(extractSummary(stderr).summary).toMatchSnapshot();

  // $FlowFixMe dynamic require
  const content = require(snapshotFile);
  expect(content['snapshot 1']).toBe(`
Object {
  "foo": "bar",
}
`);
});
