/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

const dir = resolve(__dirname, '..', 'resolve-conditions');

beforeAll(() => {
  runYarnInstall(dir);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('^12.16.0 || >=13.7.0', () => {
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
});
