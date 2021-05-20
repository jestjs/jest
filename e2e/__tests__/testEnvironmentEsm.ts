/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('^12.16.0 || >=13.7.0', () => {
  it('support test environment written in ESM', () => {
    const DIR = resolve(__dirname, '../test-environment-esm');
    const {exitCode} = runJest(DIR);

    expect(exitCode).toBe(0);
  });
});
