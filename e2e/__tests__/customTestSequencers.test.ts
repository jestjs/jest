/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';
const dir = path.resolve(__dirname, '../custom-test-sequencer');

test('run prioritySequence first sync', () => {
  const result = runJest(
    dir,
    [
      '-i',
      '--config',
      JSON.stringify({
        testSequencer: '<rootDir>/testSequencer.js',
      }),
    ],
    {},
  );
  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual([
    './a.test.js',
    './b.test.js',
    './c.test.js',
    './d.test.js',
    './e.test.js',
  ]);
});

test('run prioritySequence first async', () => {
  const result = runJest(
    dir,
    [
      '-i',
      '--config',
      JSON.stringify({
        testSequencer: '<rootDir>/testSequencerAsync.js',
      }),
    ],
    {},
  );
  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual([
    './a.test.js',
    './b.test.js',
    './c.test.js',
    './d.test.js',
    './e.test.js',
  ]);
});

test('run failed tests async', () => {
  const result = runJest(
    dir,
    [
      '--onlyFailures',
      '-i',
      '--config',
      JSON.stringify({
        testSequencer: '<rootDir>/testSequencerAsync.js',
      }),
    ],
    {},
  );
  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual(['./c.test.js', './d.test.js']);
});

test('run tests based on even seed', () => {
  const result = runJest(
    dir,
    [
      '-i',
      '--config',
      JSON.stringify({
        testSequencer: '<rootDir>/testSequencerWithSeed.js',
      }),
      '--seed=2',
    ],
    {},
  );
  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual([
    './a.test.js',
    './b.test.js',
    './c.test.js',
    './d.test.js',
    './e.test.js',
  ]);
});

test('run tests based on odd seed', () => {
  const result = runJest(
    dir,
    [
      '-i',
      '--config',
      JSON.stringify({
        testSequencer: '<rootDir>/testSequencerWithSeed.js',
      }),
      '--seed=1',
    ],
    {},
  );
  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual([
    './e.test.js',
    './d.test.js',
    './c.test.js',
    './b.test.js',
    './a.test.js',
  ]);
});
