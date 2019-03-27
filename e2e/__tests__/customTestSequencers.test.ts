/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import runJest from '../runJest';
import {extractSummary} from '../Utils';
const dir = path.resolve(__dirname, '../custom-test-sequencer');

test('run prioritySequence first', () => {
  const result = runJest(dir, ['-i']);
  expect(result.status).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replace(/PASS /g, '')
    .split('\n');
  expect(sequence).toEqual([
    './a.test.js',
    './b.test.js',
    './c.test.js',
    './d.test.js',
    './e.test.js',
  ]);
});
