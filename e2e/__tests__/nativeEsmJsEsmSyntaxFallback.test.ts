/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../native-esm-js-esm-syntax-fallback');

test('falls back to native ESM when a .js dependency contains ESM syntax but has no type:module marker', () => {
  const {exitCode, stderr} = runJest(DIR, [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
