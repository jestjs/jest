/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {
  cleanup,
  createEmptyPackage,
  extractSortedSummary,
  writeFiles,
} from '../Utils';
import {runContinuous} from '../runJest';

const tempDir = path.resolve(tmpdir(), 'complex-errors');

// this is a tiny bit flaky
jest.retryTimes(3);

beforeEach(() => {
  createEmptyPackage(tempDir);
});

afterEach(() => {
  cleanup(tempDir);
});

test('handles functions that close over outside variables', async () => {
  const testFileContent = `
    const someString = 'hello from the other side';

    test('dummy', () => {
      const error = new Error('boom');

      error.someProp = () => someString;

      throw error;
    });
  `;

  writeFiles(tempDir, {
    '__tests__/test-1.js': testFileContent,
    '__tests__/test-2.js': testFileContent,
  });

  const {end, waitUntil} = runContinuous(
    tempDir,
    ['--no-watchman', '--watch-all'],
    // timeout in case the `waitUntil` below doesn't fire
    {stripAnsi: true, timeout: 10000},
  );

  await waitUntil(({stderr}) => stderr.includes('Ran all test suites.'));

  const {stderr} = await end();

  const {rest} = extractSortedSummary(stderr);
  expect(rest).toMatchSnapshot();
});

test.skip('handles errors with BigInt', async () => {
  const testFileContent = `
    test('dummy', () => {
      expect(1n).toEqual(2n);
    });
  `;

  writeFiles(tempDir, {
    '__tests__/test-1.js': testFileContent,
    '__tests__/test-2.js': testFileContent,
  });

  const {end, waitUntil} = runContinuous(
    tempDir,
    ['--no-watchman', '--watch-all'],
    // timeout in case the `waitUntil` below doesn't fire
    {stripAnsi: true, timeout: 5000},
  );

  await waitUntil(({stderr}) => stderr.includes('Ran all test suites.'));

  const {stderr} = await end();

  const {rest} = extractSortedSummary(stderr);
  expect(rest).toMatchSnapshot();
});
