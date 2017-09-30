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

test('requestAnimationFrame', () => {
  const result = runJest('request_animation_frame', ['--verbose']);
  const stderr = result.stderr.toString();

  console.log(stderr);

  expect(stderr).toMatch('requestAnimationFrame test');
  expect(result.status).toBe(0);
});
