/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('require + import of the same .cjs inside isolateModulesAsync keep distinct cache slots', () => {
  const {exitCode, stderr} = runJest('isolate-modules-cjs-esm', [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
