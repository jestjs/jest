/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.tmpdir(), 'jest-global-setup-per-worker');

test('should exist setup file', () => {
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(2);

  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine] of content) {
    expect(firstLine).toBe('setup-per-worker');
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2']);
  expect(secondLines).toEqual(
    expect.arrayContaining([process.env.JEST_WORKER_ID]),
  );
});
