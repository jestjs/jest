/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const {isArrayBuffer} = require('util').types;
const isJSDOM =
  typeof window !== 'undefined' && typeof document !== 'undefined';

const skipTestJSDOM = isJSDOM ? test.skip : test;

skipTestJSDOM('Buffer', () => {
  const bufFromArray = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
  expect(isArrayBuffer(bufFromArray.buffer)).toBeTruthy();
  const bufFromArrayBuffer = Buffer.from(new ArrayBuffer(6));
  expect(bufFromArrayBuffer.buffer instanceof ArrayBuffer).toBeTruthy();
});

test.each([
  ['Int8Array', Int8Array, isJSDOM],
  ['Int16Array', Int16Array, isJSDOM],
  ['Int32Array', Int32Array, isJSDOM],
  ['Uint8Array', Uint8Array],
  ['Uint8ClampedArray', Uint8ClampedArray, isJSDOM],
  ['Uint16Array', Uint16Array, isJSDOM],
  ['Uint32Array', Uint32Array, isJSDOM],
  ['Float32Array', Float32Array, isJSDOM],
  ['Float64Array', Float64Array, isJSDOM],
])('%s', (name, ctor, testInstanceof = true) => {
  const typedArray = ctor.of();
  expect(isArrayBuffer(typedArray.buffer)).toBeTruthy();
  if (testInstanceof) {
    expect(typedArray.buffer instanceof ArrayBuffer).toBeTruthy();
  }
});
