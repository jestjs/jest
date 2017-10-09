/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

test('Verbose Reporter', () => {
  const result = runJest('verbose_reporter');
  const stderr = result.stderr.toString();

  expect(result.status).toBe(1);
  expect(stderr).toMatch('works just fine');
  expect(stderr).toMatch('does not work');
  expect(stderr).toMatch(/Verbose\n.*?works/);
});
