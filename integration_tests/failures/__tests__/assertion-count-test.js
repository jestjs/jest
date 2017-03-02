/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const throws = () => {
  expect.assertions(2);
  expect(false).toBeTruthy();
};
const redeclare = () => {
  expect.assertions(1);
  expect(false).toBeTruthy();
  expect.assertions(2);
};

const noAssertions = () => {
  expect.assertions(0);
  expect(true).toBeTruthy();
};

describe('.assertions()', () => {
  it('throws', throws);
  it('throws on redeclare of assertion count', redeclare);
  it('throws on assertion', noAssertions);
});
