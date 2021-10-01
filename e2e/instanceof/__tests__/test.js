/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const http = require('http');
const util = require('util');
const v8 = require('v8');

const readFile = util.promisify(fs.readFile);

function getSuperClass(cls) {
  const prototype = Object.getPrototypeOf(cls.prototype);
  return prototype ? prototype.constructor : null;
}

const buffers = fs.readdirSync(__dirname);
const buffer = fs.readFileSync(__filename);
const error = (() => {
  try {
    fs.readFileSync('/');
  } catch (e) {
    return e;
  }
})();
const promise = readFile(__filename);

const nodeArrayType = buffers.constructor;
const nodeErrorType = error.constructor;
const nodePromiseType = promise.constructor;
const nodeUint8ArrayType = getSuperClass(buffer.constructor);
const nodeTypedArrayType = getSuperClass(nodeUint8ArrayType);
const nodeObjectType = getSuperClass(nodeTypedArrayType);

const globalTypedArrayType = getSuperClass(Uint8Array);

test('fs Error', () => {
  expect.hasAssertions();

  try {
    fs.readFileSync('does not exist');
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
  }
});

test('http error', done => {
  const request = http.request('http://does-not-exist/blah', res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('end', () => {
      done(new Error('Ended before failure'));
    });
  });

  request.once('error', err => {
    expect(err).toBeInstanceOf(Error);
    done();
  });
});

test('Array', () => {
  expect([]).toBeInstanceOf(Array);
});

test('array type', () => {
  expect(buffers).toBeInstanceOf(Array);
  expect(buffers).toBeInstanceOf(Object);
  expect([]).toBeInstanceOf(nodeArrayType);
  expect([]).toBeInstanceOf(nodeObjectType);
});

test('error type', () => {
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(Object);
  expect(new Error()).toBeInstanceOf(nodeErrorType);
  expect(new Error()).toBeInstanceOf(nodeObjectType);
});

test('promise type', () => {
  expect(promise).toBeInstanceOf(Promise);
  expect(promise).toBeInstanceOf(Object);
  expect(new Promise(resolve => resolve())).toBeInstanceOf(nodePromiseType);
  expect(new Promise(resolve => resolve())).toBeInstanceOf(nodeObjectType);
});

test('Uint8Array type', () => {
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer).toBeInstanceOf(Uint8Array);
  expect(buffer).toBeInstanceOf(globalTypedArrayType);
  expect(buffer).toBeInstanceOf(Object);
  expect(new Uint8Array([])).toBeInstanceOf(nodeUint8ArrayType);
  expect(new Uint8Array([])).toBeInstanceOf(nodeTypedArrayType);
  expect(new Uint8Array([])).toBeInstanceOf(nodeObjectType);
});

test('recognizes typed arrays as objects', () => {
  expect(new Uint8Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Uint8ClampedArray([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Uint16Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Uint32Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new BigUint64Array([])).toBeInstanceOf(Object);
  expect(new Int8Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Int16Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Int32Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new BigInt64Array([])).toBeInstanceOf(Object);
  expect(new Float32Array([1, 2, 3])).toBeInstanceOf(Object);
  expect(new Float64Array([1, 2, 3])).toBeInstanceOf(Object);
});

test('recognizes typed arrays as instances of TypedArray', () => {
  expect(new Uint8Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Uint8ClampedArray([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Uint16Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Uint32Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new BigUint64Array([])).toBeInstanceOf(globalTypedArrayType);
  expect(new Int8Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Int16Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Int32Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new BigInt64Array([])).toBeInstanceOf(globalTypedArrayType);
  expect(new Float32Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
  expect(new Float64Array([1, 2, 3])).toBeInstanceOf(globalTypedArrayType);
});

test('v8 serialize/deserialize', () => {
  const m1 = new Map();
  const m2 = v8.deserialize(v8.serialize(m1));
  expect(m1).toEqual(m2);
});
