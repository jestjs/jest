/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('runs test with native ESM', () => {
    const {exitCode, stderr, stdout} = runJest('resolve-async', [], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    });

    const {summary} = extractSummary(stderr);

    expect(summary).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});
