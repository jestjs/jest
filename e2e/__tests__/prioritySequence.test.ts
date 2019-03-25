/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import runJest from '../runJest';
import {extractSummary} from '../Utils';
const dir = path.resolve(__dirname, '../priority-sequence');

expect.extend({
  toBeIn(received, arr) {
    const isIn = arr.includes(received);
    if (isIn)
      return {
        message: `expect ${received} not to be in [${arr.join(', ')}]`,
        pass: true,
      };
    else
      return {
        message: `expect ${received} to be in [${arr.join(', ')}]`,
        pass: false,
      };
  },
});

test('run prioritySequence first', () => {
  const result = runJest(dir);
  expect(result.status).toBe(0);
  const sequence = extractSummary(result.stderr)
    .rest.replace(/PASS /g, '')
    .split('\n');
  expect(sequence).toEqual([
    './d.test.js',
    './b.test.js',
    './c.test.js',
    expect.toBeIn(['./a.test.js', './e.test.js']),
    expect.toBeIn(['./a.test.js', './e.test.js']),
  ]);
});
