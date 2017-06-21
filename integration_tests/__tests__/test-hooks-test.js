/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {extractSummary, cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../test-hooks');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

// Blocked by https://github.com/facebook/jest/issues/3785
test.skip('fails because of the error in afterAll hook', () => {
  writeFiles(DIR, {
    '__tests__/hooks-test.js': `
      // keep the counter to make sure we execute the hook only once.
      let count = 0;
      beforeAll(() => { throw new Error('afterAll error ' + count++); });

      test('one', () => {});
      test('two', () => {});
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(status).toBe(1);
});
