/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

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

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  const regexToMatch =
    process.env.JEST_JASMINE === '1'
      ? /(Async callback was not invoked within the 20 ms timeout specified by jest\.setTimeout\.)/
      : /(Exceeded timeout of 20 ms for a test\.)/;

  expect(rest).toMatch(/(jest\.setTimeout\(20\))/);
  expect(rest).toMatch(regexToMatch);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(1);
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

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('exceeds the command line testTimeout', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '--testTimeout=200',
  ]);
  const {rest, summary} = extractSummary(stderr);
  const regexToMatch =
    process.env.JEST_JASMINE === '1'
      ? /(Async callback was not invoked within the 200 ms timeout specified by jest\.setTimeout\.)/
      : /(Exceeded timeout of 200 ms for a test\.)/;
  expect(rest).toMatch(regexToMatch);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(1);
});

test('does not exceed the command line testTimeout', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 200);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '--testTimeout=1000',
  ]);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('exceeds the timeout parameter', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
      }, 200);
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  const regexToMatch =
    process.env.JEST_JASMINE === '1'
      ? /(Async callback was not invoked within the 200 ms timeout specified by jest\.setTimeout\.)/
      : /(Exceeded timeout of 200 ms for a test\.)/;
  expect(rest).toMatch(regexToMatch);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(1);
});

test('does not exceed the timeout parameter', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 200);
        });
      }, 1000);
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('exceeds the timeout specifying that `done` has not been called', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jest.setTimeout(20);

      test('banana', (done) => {
        expect(1 + 1).toBe(2);
      });
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  const regexToMatch =
    process.env.JEST_JASMINE === '1'
      ? /(Async callback was not invoked within the 20 ms timeout specified by jest\.setTimeout\.)/
      : /(Exceeded timeout of 20 ms for a test while waiting for `done\(\)` to be called\.)/;
  expect(rest).toMatch(/(jest\.setTimeout\(20\))/);
  expect(rest).toMatch(regexToMatch);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(1);
});

test('respects project testTimeout in project config', () => {
  writeFiles(DIR, {
    'jest.config.js': `
      module.exports = {
        projects: [
          {
            displayName: 'slow-project',
            rootDir: '<rootDir>/slow',
            testTimeout: 2000,
          },
        ],
      };
    `,
    'package.json': '{}',
    'slow/__tests__/slow.test.js': `
      test('waits 300 ms', () => new Promise(resolve => setTimeout(resolve, 300)));
    `,
  });

  const {exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  expect(exitCode).toBe(0);
});

test('exceeds project testTimeout in project config', () => {
  writeFiles(DIR, {
    'fast/__tests__/fast.test.js': `
      test('waits 500 ms', () => new Promise(resolve => setTimeout(resolve, 500)));
    `,
    'jest.config.js': `
      module.exports = {
        projects: [
          {
            displayName: 'fast-project',
            rootDir: '<rootDir>/fast',
            testTimeout: 200,
          },
        ],
      };
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest} = extractSummary(stderr);
  const regexToMatch =
    process.env.JEST_JASMINE === '1'
      ? /(Async callback was not invoked within the 200 ms timeout specified by jest\.setTimeout\.)/
      : /(Exceeded timeout of 200 ms for a test\.)/;
  expect(rest).toMatch(regexToMatch);
  expect(exitCode).toBe(1);
});
