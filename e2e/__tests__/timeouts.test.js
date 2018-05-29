/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

'use strict';

const path = require('path');
const {extractSummary, cleanup, writeFiles} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../timeouts');

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
  expect(rest).toMatch(
    /(jest\.setTimeout|jasmine\.DEFAULT_TIMEOUT_INTERVAL|Exceeded timeout)/,
  );
  expect(summary).toMatchSnapshot();
  expect(status).toBe(1);
});

test('does not exceed the timeout', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jest.setTimeout(1000);

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
