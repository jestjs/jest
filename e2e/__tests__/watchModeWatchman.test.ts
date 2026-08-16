/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import {skipSuiteOnWindows, skipSuiteWithoutWatchman} from '@jest/test-utils';
import * as fs from 'graceful-fs';
import {cleanup, writeFiles} from '../Utils';
import {runContinuous} from '../runJest';

skipSuiteOnWindows();
skipSuiteWithoutWatchman();

// `realpathSync` because watchman reports real paths: with the macOS tmpdir
// (`/var` -> `/private/var`) unresolved, event paths would not be relative to
// the watched root.
const DIR = path.resolve(fs.realpathSync(os.tmpdir()), 'watch-mode-watchman');

describe('watch mode with watchman', () => {
  let testRun: ReturnType<typeof runContinuous> | undefined;

  beforeEach(() => {
    cleanup(DIR);
    writeFiles(DIR, {
      '.watchmanconfig': '{}',
      '__tests__/first.test.js': `
        test('first', () => { expect(1).toBe(1); });
      `,
      'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
    });
  });

  afterEach(async () => {
    if (testRun) {
      await testRun.end();
      testRun = undefined;
    }
  });

  afterAll(() => cleanup(DIR));

  const numberOfTestRuns = (stderr: string): number =>
    stderr.match(/Ran all test suites\./g)?.length ?? 0;

  test('re-runs when a watched file changes', async () => {
    testRun = runContinuous(DIR, ['--watchAll']);

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 1 passed, 1 total',
    );
    // A failed crawl falls back to the node crawler, which would make the rest
    // of this suite pass without watchman ever being exercised.
    expect(testRun.getCurrentOutput().stdout).not.toContain(
      'Watchman crawl failed',
    );

    fs.appendFileSync(
      path.join(DIR, '__tests__', 'first.test.js'),
      "test('second', () => { expect(2).toBe(2); });\n",
    );

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Tests:       2 passed, 2 total',
    );
  });

  test('picks up a test file added while watching', async () => {
    testRun = runContinuous(DIR, ['--watchAll']);

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);

    fs.writeFileSync(
      path.join(DIR, '__tests__', 'added.test.js'),
      "test('added', () => { expect(1).toBe(1); });\n",
    );

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 2 passed, 2 total',
    );
  });

  test('drops a test file deleted while watching', async () => {
    testRun = runContinuous(DIR, ['--watchAll']);

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);

    fs.writeFileSync(
      path.join(DIR, '__tests__', 'extra.test.js'),
      "test('extra', () => { expect(1).toBe(1); });\n",
    );
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);

    fs.unlinkSync(path.join(DIR, '__tests__', 'extra.test.js'));

    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 3);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 1 passed, 1 total',
    );
  });
});
