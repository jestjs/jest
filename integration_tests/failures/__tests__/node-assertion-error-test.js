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

const assert = require('assert');

test('assert', () => {
  assert(false);
});

test('assert with a message', () => {
  assert(false, 'this is a message');
});

test('assert.ok', () => {
  assert.ok(false);
});

test('assert.ok with a message', () => {
  assert.ok(false, 'this is a message');
});

test('assert.equal', () => {
  assert.equal(1, 2);
});

test('assert.equal with a message', () => {
  assert.equal(1, 2, 'this is a message');
});

test('assert.deepEqual', () => {
  assert.deepEqual({a: {b: {c: 5}}}, {a: {b: {c: 6}}});
});

test('assert.deepEqual with a message', () => {
  assert.deepEqual({a: {b: {c: 5}}}, {a: {b: {c: 7}}}, 'this is a message');
});
