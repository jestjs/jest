/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {stripVTControlCharacters as stripAnsi} from 'node:util';
import type {Test, TestCaseResult} from '@jest/test-result';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import Status from '../Status';

const globalConfig = makeGlobalConfig();
const rootDir = process.cwd();
const config = makeProjectConfig({cwd: rootDir, rootDir});
const inRoot = (...segments: Array<string>) => path.join(rootDir, ...segments);
const shown = (name: string) => path.join('src', name);

const makeTest = (path: string, projectConfig = config): Test => ({
  context: {
    config: projectConfig,
  } as Test['context'],
  duration: 0,
  path,
});

const makeTestCaseResult = (
  status: TestCaseResult['status'],
): TestCaseResult => ({
  ancestorTitles: [],
  duration: 0,
  failureDetails: [],
  failureMessages: [],
  fullName: `a ${status} test`,
  invocations: 1,
  location: null,
  numPassingAsserts: 0,
  retryReasons: [],
  status,
  title: `a ${status} test`,
});

const runningLines = (status: Status) =>
  stripAnsi(status.get().content)
    .split('\n')
    .filter(line => line.includes('RUNS'));

let originalColumns: number;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  process.stdout.columns = 200;
});

afterEach(() => {
  process.stdout.columns = originalColumns;
});

test('shows only the path of a running file whose tests have not finished', () => {
  const status = new Status(globalConfig);
  status.testStarted(inRoot('src', 'a.test.js'), config);

  expect(runningLines(status)).toEqual([` RUNS  ${shown('a.test.js')}`]);
});

test('counts the finished tests of a running file by status', () => {
  const status = new Status(globalConfig);
  const test = makeTest(inRoot('src', 'a.test.js'));
  status.testStarted(test.path, config);
  for (const result of [
    'passed',
    'passed',
    'failed',
    'skipped',
    'todo',
  ] as const) {
    status.addTestCaseResult(test, makeTestCaseResult(result));
  }

  expect(runningLines(status)).toEqual([
    ` RUNS  ${shown('a.test.js')} (1 failed, 1 skipped, 1 todo, 2 passed)`,
  ]);
});

test('counts each running file separately', () => {
  const status = new Status(globalConfig);
  const first = makeTest(inRoot('src', 'a.test.js'));
  const second = makeTest(inRoot('src', 'b.test.js'));
  status.testStarted(first.path, config);
  status.testStarted(second.path, config);
  status.addTestCaseResult(first, makeTestCaseResult('passed'));
  status.addTestCaseResult(second, makeTestCaseResult('failed'));
  status.addTestCaseResult(second, makeTestCaseResult('failed'));

  expect(runningLines(status)).toEqual([
    ` RUNS  ${shown('a.test.js')} (1 passed)`,
    ` RUNS  ${shown('b.test.js')} (2 failed)`,
  ]);
});

test('keeps the counts of the same file in different projects apart', () => {
  const otherConfig = makeProjectConfig({cwd: rootDir, rootDir});
  const status = new Status(globalConfig);
  const test = makeTest(inRoot('src', 'a.test.js'));
  const otherTest = makeTest(inRoot('src', 'a.test.js'), otherConfig);
  status.testStarted(test.path, config);
  status.testStarted(otherTest.path, otherConfig);
  status.addTestCaseResult(test, makeTestCaseResult('passed'));

  expect(runningLines(status)).toEqual([
    ` RUNS  ${shown('a.test.js')} (1 passed)`,
    ` RUNS  ${shown('a.test.js')}`,
  ]);
});

test('keeps the counts on the line when the path has to be shortened', () => {
  process.stdout.columns = 40;
  const status = new Status(globalConfig);
  const test = makeTest(
    inRoot(
      'some',
      'deeply',
      'nested',
      'directory',
      'with',
      'a',
      'long.test.js',
    ),
  );
  status.testStarted(test.path, config);
  status.addTestCaseResult(test, makeTestCaseResult('passed'));

  const [line] = runningLines(status);
  expect(line).toMatch(/ \(1 passed\)$/);
  expect(line.length).toBeLessThanOrEqual(40);
});
