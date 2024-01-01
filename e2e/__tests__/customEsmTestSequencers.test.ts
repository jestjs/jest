/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';
const dir = path.resolve(__dirname, '../custom-esm-test-sequencer');

test('run prioritySequence', () => {
  const result = runJest(dir, ['-i'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(result.exitCode).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replaceAll('PASS ', '')
    .split('\n');
  expect(sequence).toEqual([
    './a.test.js',
    './b.test.js',
    './c.test.js',
    './d.test.js',
    './e.test.js',
  ]);
});
