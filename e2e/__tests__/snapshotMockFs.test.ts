/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary} from '../Utils';
import {json as runJestJson} from '../runJest';

const DIR = path.resolve(__dirname, '../snapshot-mock-fs');
const snapshotDir = path.resolve(DIR, '__tests__/__snapshots__');
const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');

beforeEach(() => cleanup(snapshotDir));
afterAll(() => cleanup(snapshotDir));

test('store snapshot even if fs is mocked', () => {
  const {json, exitCode, stderr} = runJestJson(DIR, ['--ci=false']);

  expect(exitCode).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);

  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(extractSummary(stderr).summary).toMatchSnapshot();

  const content = require(snapshotFile);
  expect(content['snapshot 1']).toBe(`
{
  "foo": "bar",
}
`);
});
