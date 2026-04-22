/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../native-esm-cjs-require');

// Spawns jest against the fixture in ../native-esm-cjs-require. The real
// assertions live in that fixture's __tests__/cjs-require-esm.test.js —
// exitCode 0 here means those inner tests passed.
test('runs fixture where a CJS module loaded via import synchronously requires an ESM dependency', () => {
  const {exitCode, stderr} = runJest(DIR, [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
