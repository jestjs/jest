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

test('runs ESM/CJS interop fixture (__esModule unwrapping, named exports, singleton caching)', () => {
  const {exitCode, stderr} = runJest(
    DIR,
    ['--testPathPatterns', 'cjs-esm-interop'],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
