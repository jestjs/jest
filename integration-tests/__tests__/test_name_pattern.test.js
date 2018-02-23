/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const {extractSummary} = require('../Utils');
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
