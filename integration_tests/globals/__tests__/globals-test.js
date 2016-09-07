/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


'use strict';

it('it', () => {});
test('test', () => {});

describe('describe', () => {
  test('test', () => {});
});

fdescribe('fdescribe', () => {
  test('test', () => {});
});

describe.only('describe.only', () => {
  test('test', () => {});
});

it.skip('it.skip', () => {});
test.skip('test.skip', () => {});

it.only('it.only', () => {});
test.only('test.only', () => {});

xit('xit', () => {});
/* eslint-disable no-undef */
xtest('xtest', () => {});
/* eslint-enable no-undef */

xdescribe('xdescribe', () => {
  test('test');
});
