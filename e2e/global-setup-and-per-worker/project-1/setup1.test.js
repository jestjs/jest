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

const DIR = path.join(
  os.tmpdir(),
  'jest-global-setup-and-per-worker-project-1',
);

test('should exist setup files', () => {
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(3);
  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine, secondLine] of content) {
    if (secondLine) {
      expect(firstLine).toBe('setup-per-worker');
    } else {
      expect(firstLine).toBe('setup');
    }
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2', undefined]);
  expect(secondLines).toEqual(
    expect.arrayContaining([process.env.JEST_WORKER_ID]),
  );
});
