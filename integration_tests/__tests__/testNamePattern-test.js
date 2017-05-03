/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const {extractSummary} = require('../utils');
const runJest = require('../runJest');

test('testNamePattern', () => {
  const {stderr, status} = runJest.json('testNamePattern', [
    '--testNamePattern',
    'should match',
  ]);
  const {summary} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(summary).toMatchSnapshot();
});
