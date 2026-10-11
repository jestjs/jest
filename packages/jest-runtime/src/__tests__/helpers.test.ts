/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createOutsideJestVmPath,
  decodePossibleOutsideJestVmPath,
} from '../helpers';

describe('outsideJestVmPath', () => {
  test.each([
    '/plain/module.js',
    '/with space/module.js',
    '/with#hash/module.js',
    '/with?query/module.js',
  ])('round trips %s', filename => {
    expect(
      decodePossibleOutsideJestVmPath(createOutsideJestVmPath(filename)),
    ).toBe(filename);
  });

  test('leaves an ordinary specifier alone', () => {
    expect(decodePossibleOutsideJestVmPath('/plain/module.js')).toBeUndefined();
    expect(decodePossibleOutsideJestVmPath('jest-main')).toBeUndefined();
  });

  test('ignores the protocol without its authority delimiter', () => {
    expect(decodePossibleOutsideJestVmPath('jest-main:x.js')).toBeUndefined();
  });
});
