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

const DIR = path.resolve(__dirname, '../timeouts');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('exceeds the timeout', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jest.setTimeout(20);

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatch(/(jasmine\.DEFAULT_TIMEOUT_INTERVAL|Exceeded timeout)/);
  expect(summary).toMatchSnapshot();
  expect(status).toBe(1);
});

test('does not exceed the timeout', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jest.setTimeout(100);

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 20);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(status).toBe(0);
});
