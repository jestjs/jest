/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
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

const hasNoAssertions = () => {
  expect.hasAssertions();
};

describe('.assertions()', () => {
  it('throws', throws);
  it('throws on redeclare of assertion count', redeclare);
  it('throws on assertion', noAssertions);
});

describe('.hasAssertions()', () => {
  it('throws when there are not assertions', hasNoAssertions);
});
