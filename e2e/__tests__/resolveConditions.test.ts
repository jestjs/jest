/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import runJest from '../runJest';

const dir = resolve(__dirname, '..', 'resolve-conditions');

test('resolves package exports correctly with custom resolver', () => {
  // run multiple times to ensure there are no caching errors
  for (let i = 0; i < 5; i++) {
    const {exitCode} = runJest(dir, [], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    });
    try {
      expect(exitCode).toBe(0);
    } catch (error) {
      console.log(`Test failed on iteration ${i + 1}`);
      throw error;
    }
  }
});

test.each([
  {
    conditions: undefined,
    environment: 'jsdom',
    expected: {addon: 'default', branch: 'browser', fallback: 'default'},
    label: 'jsdom defaults',
  },
  {
    conditions: ['browser'],
    environment: 'jsdom',
    expected: {addon: 'default', branch: 'browser', fallback: 'default'},
    label: 'explicit browser conditions',
  },
  {
    conditions: ['node'],
    environment: 'jsdom',
    expected: {addon: 'default', branch: 'node', fallback: 'node'},
    label: 'explicit jsdom node conditions',
  },
  {
    conditions: ['special'],
    environment: 'jsdom',
    expected: {addon: 'default', branch: 'special', fallback: 'default'},
    label: 'custom jsdom conditions',
  },
  {
    conditions: [],
    environment: 'jsdom',
    expected: {addon: 'default', branch: 'default', fallback: 'default'},
    label: 'empty jsdom conditions',
  },
  {
    conditions: undefined,
    environment: 'node',
    expected: {addon: 'node', branch: 'node', fallback: 'node'},
    label: 'node defaults',
  },
  {
    conditions: ['special'],
    environment: 'node',
    expected: {addon: 'default', branch: 'special', fallback: 'default'},
    label: 'custom node conditions',
  },
  {
    conditions: [],
    environment: 'node',
    expected: {addon: 'default', branch: 'default', fallback: 'default'},
    label: 'empty node conditions',
  },
  {
    conditions: ['node'],
    environment: 'node',
    expected: {addon: 'default', branch: 'node', fallback: 'node'},
    label: 'explicit node conditions',
  },
  {
    conditions: ['node-addons'],
    environment: 'node',
    expected: {addon: 'node', branch: 'default', fallback: 'default'},
    label: 'explicit node-addons conditions',
  },
])('CommonJS respects $label', ({environment, conditions, expected}) => {
  const {exitCode} = runJest(
    dir,
    [
      '--runInBand',
      '--runTestsByPath',
      '__tests__/cjs-export-conditions.test.cjs',
      '--env',
      environment,
      '--testEnvironmentOptions',
      JSON.stringify({customExportConditions: conditions}),
      '--globals',
      JSON.stringify({EXPORT_CONDITIONS_EXPECTED: expected}),
    ],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  expect(exitCode).toBe(0);
});

test('keeps cached resolutions separate across environments', () => {
  const {exitCode} = runJest(
    dir,
    [
      '--runInBand',
      '--runTestsByPath',
      '__tests__/cache-1-node.test.cjs',
      '__tests__/cache-2-jsdom.test.cjs',
      '__tests__/cache-3-node.test.cjs',
      '--testSequencer',
      resolve(__dirname, '..', 'custom-test-sequencer', 'testSequencer.js'),
    ],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  expect(exitCode).toBe(0);
});
