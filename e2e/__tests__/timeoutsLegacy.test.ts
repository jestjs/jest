/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJestCircus} from '@jest/test-utils';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

/**
 * NOTE: This test should be removed once jest-circus is rolled out as a breaking change.
 */

const DIR = path.resolve(__dirname, '../timeouts-legacy');

skipSuiteOnJestCircus();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('exceeds the timeout set using jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20;

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatch(
    /(jest\.setTimeout|jasmine\.DEFAULT_TIMEOUT_INTERVAL|Exceeded timeout)/,
  );
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(1);
});

test('does not exceed the timeout using jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 20);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('can read and write jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      const timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 154;
      const newTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

      test('banana', () => {
        expect(timeout).toBe(5000);
        expect(newTimeout).toBe(154);
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {summary} = extractSummary(stderr);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
