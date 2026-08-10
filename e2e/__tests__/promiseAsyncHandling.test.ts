/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSortedSummary} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../promise-async-handling');

skipSuiteOnJasmine();

test('fails because of unhandled promise rejection in test', () => {
  const {stderr, exitCode} = runJest(dir, ['unhandledRejectionTest.test.js']);

  expect(exitCode).toBe(1);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});

test('fails because of unhandled promise rejection in beforeAll hook', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionBeforeAll.test.js',
  ]);

  expect(exitCode).toBe(1);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});

test('fails because of unhandled promise rejection in beforeEach hook', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionBeforeEach.test.js',
  ]);

  expect(exitCode).toBe(1);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});

test('fails because of unhandled promise rejection in afterEach hook', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionAfterEach.test.js',
  ]);

  expect(exitCode).toBe(1);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});

test('fails because of unhandled promise rejection in afterAll hook', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionAfterAll.test.js',
  ]);

  expect(exitCode).toBe(1);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});

test('reports the cause of an unhandled rejection', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionWithCause.test.js',
  ]);

  expect(exitCode).toBe(1);
  // The unhandled path hands `formatExecError` the errors themselves, so the
  // cause is rendered rather than serialized with a `[cause]:` marker.
  expect(stderr).toContain('Cause:');
  expect(stderr).not.toContain('[cause]:');
  expect(extractSortedSummary(stderr)).toMatchSnapshot();
});

test('reports the inner errors of an unhandled AggregateError rejection', () => {
  const {stderr, exitCode} = runJest(dir, [
    'unhandledRejectionAggregate.test.js',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Errors contained in AggregateError:');
  expect(stderr).not.toContain('[errors]:');
  expect(extractSortedSummary(stderr)).toMatchSnapshot();
});

test('succeeds for async handled promise rejections', () => {
  const {stderr, exitCode} = runJest(dir, ['rejectionHandled.test.js']);

  expect(exitCode).toBe(0);
  const sortedSummary = extractSortedSummary(stderr);
  expect(sortedSummary).toMatchSnapshot();
});
