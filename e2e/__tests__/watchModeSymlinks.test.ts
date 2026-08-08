/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import {skipSuiteOnWindows} from '@jest/test-utils';
import * as fs from 'graceful-fs';
import {cleanup, writeFiles, writeSymlinks} from '../Utils';
import {runContinuous} from '../runJest';

// Symlinks are only enabled on windows with developer mode.
// https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
skipSuiteOnWindows();

// `realpathSync` because file watchers report real paths: with the macOS
// tmpdir (`/var` -> `/private/var`) unresolved, event paths would not be
// relative to the watched root.
const DIR = path.resolve(fs.realpathSync(os.tmpdir()), 'watch-mode-symlinks');
const OUTSIDE_DIR = path.resolve(
  fs.realpathSync(os.tmpdir()),
  'watch-mode-symlinks-outside',
);

const sleep = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

describe('watch mode with symlinks', () => {
  let testRun: ReturnType<typeof runContinuous> | undefined;

  beforeEach(() => {
    cleanup(DIR);
    cleanup(OUTSIDE_DIR);

    writeFiles(DIR, {
      '__tests__/plain.test.js': `
        test('plain', () => { expect(1).toBe(1); });
      `,
      'linked/target.js': `
        test('linked', () => { expect(1).toBe(1); });
      `,
      'package.json': JSON.stringify({
        jest: {haste: {enableSymlinks: true}},
      }),
    });
    writeSymlinks(DIR, {
      'linked/target.js': '__tests__/linked.test.js',
    });
    writeFiles(OUTSIDE_DIR, {
      'inner.js': `
        module.exports = 1;
      `,
    });
    fs.symlinkSync(OUTSIDE_DIR, path.join(DIR, 'dirlink'), 'junction');
  });

  afterEach(async () => {
    if (testRun) {
      await testRun.end();
      testRun = undefined;
    }
  });

  afterAll(() => {
    cleanup(DIR);
    cleanup(OUTSIDE_DIR);
  });

  const numberOfTestRuns = (stderr: string): number =>
    stderr.match(/Ran all test suites\./g)?.length ?? 0;

  test('discovers symlinked test files and re-runs when the target changes', async () => {
    testRun = runContinuous(DIR, ['--watchAll', '--no-watchman']);

    // The symlinked test is crawled at its link path and runs alongside the
    // plain one.
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 2 passed, 2 total',
    );

    // Modifying the target through its real path re-runs, picking up the
    // added test through the link.
    fs.appendFileSync(
      path.join(DIR, 'linked', 'target.js'),
      "test('linked 2', () => { expect(2).toBe(2); });\n",
    );
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Tests:       3 passed, 3 total',
    );

    // Changes inside a symlinked directory happen at their real path outside
    // the watched root, so nothing re-runs.
    fs.appendFileSync(path.join(OUTSIDE_DIR, 'inner.js'), '// changed\n');
    await sleep(3000);
    expect(numberOfTestRuns(testRun.getCurrentOutput().stderr)).toBe(2);
  });

  test('picks up a symlink created while watching', async () => {
    testRun = runContinuous(DIR, ['--watchAll', '--no-watchman']);
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);

    fs.symlinkSync(
      path.join(DIR, 'linked', 'target.js'),
      path.join(DIR, '__tests__', 'added.test.js'),
      'junction',
    );
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 3 passed, 3 total',
    );
  });

  test('removes a symlinked test file that is deleted', async () => {
    testRun = runContinuous(DIR, ['--watchAll', '--no-watchman']);
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 1);

    fs.unlinkSync(path.join(DIR, '__tests__', 'linked.test.js'));
    await testRun.waitUntil(({stderr}) => numberOfTestRuns(stderr) === 2);
    expect(testRun.getCurrentOutput().stderr).toContain(
      'Test Suites: 1 passed, 1 total',
    );
  });
});
