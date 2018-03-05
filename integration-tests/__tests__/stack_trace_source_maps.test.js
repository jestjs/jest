/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const {run} = require('../Utils');
const runJest = require('../runJest');

it('processes stack traces and code frames with source maps', () => {
  const dir = path.resolve(__dirname, '../stack-trace-source-maps');
  run('yarn', dir);
  const {stderr} = runJest(dir, ['--no-cache']);
  expect(stderr).toMatch('> 14 |   (() => expect(false).toBe(true))();');
  expect(stderr).toMatch(`at __tests__/fails.ts:14:24
      at Object.<anonymous> (__tests__/fails.ts:14:35)`);
});
