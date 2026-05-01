/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../native-esm-require-module');

onNodeVersions('>=24.9.0', () => {
  test('require(esm) returns namespace, throws on TLA, populates require.cache', () => {
    const {exitCode, stderr} = runJest(DIR, ['__tests__/require-esm.test.js'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    });

    expect(stderr).toContain('4 passed');
    expect(exitCode).toBe(0);
  });

  test('require()/import() fall back to ESM for .js with ESM syntax and no "type":"module" marker', () => {
    const {exitCode, stderr} = runJest(
      DIR,
      ['__tests__/syntax-fallback.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    expect(stderr).toContain('2 passed');
    expect(exitCode).toBe(0);
  });
});

onNodeVersions('<24.9.0', () => {
  test('require() of an ESM file throws ERR_REQUIRE_ESM with a Node-version message', () => {
    const {exitCode, stderr} = runJest(
      DIR,
      ['__tests__/require-esm-throws-on-old-node.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    expect(stderr).toContain('1 passed');
    expect(exitCode).toBe(0);
  });
});
