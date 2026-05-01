/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../native-esm-sync-linker');

// `vm.SourceTextModule#linkRequests` and `instantiate` ship in Node v24.9.
// On older Node, the legacy async ESM path runs and is covered by the
// existing native-esm fixture.
onNodeVersions('>=24.9.0', () => {
  test('sync linker handles diamond + cycle graph', () => {
    const {exitCode, stderr} = runJest(DIR, ['sync-linker.test.js'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    });

    expect(stderr).toContain('1 passed');
    expect(exitCode).toBe(0);
  });
});
