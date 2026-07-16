/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const workdirNodeModules = resolve(
  __dirname,
  '..',
  'resolve-with-paths',
  'node_modules',
);

beforeAll(() => {
  writeFiles(resolve(workdirNodeModules, 'mod'), {
    'index.js': 'module.exports = 42;',
  });
});

afterAll(() => {
  cleanup(workdirNodeModules);
});

test('require.resolve with paths', () => {
  const {exitCode} = runJest('resolve-with-paths');
  expect(exitCode).toBe(0);
});
