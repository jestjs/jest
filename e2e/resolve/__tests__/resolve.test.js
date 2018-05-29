/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let platform;

function testRequire(filename) {
  return () => (platform = require(filename));
}

test('should explicitly resolve filename.<platform>.js', () => {
  expect(testRequire('../test1.android.js')).not.toThrow();
  expect(platform.extension).toBe('android.js');
});

test('should explicitly resolve filename.native.js', () => {
  expect(testRequire('../test1.native.js')).not.toThrow();
  expect(platform.extension).toBe('native.js');
});

test('should explicitly resolve filename.js', () => {
  expect(testRequire('../test1.js')).not.toThrow();
  expect(platform.extension).toBe('js');
});

test('should explicitly resolve filename.json', () => {
  expect(testRequire('../test1.json')).not.toThrow();
  expect(platform.extension).toBe('json');
});

test('should resolve filename.<platform>.js', () => {
  expect(testRequire('../test1')).not.toThrow();
  expect(platform.extension).toBe('android.js');
});

test('should resolve filename.<platform>.js from haste package', () => {
  expect(testRequire('custom-resolve/test1')).not.toThrow();
  expect(platform.extension).toBe('android.js');
});

test('should resolve filename.native.js', () => {
  expect(testRequire('../test2')).not.toThrow();
  expect(platform.extension).toBe('native.js');
});

test('should resolve filename.js', () => {
  expect(testRequire('../test3')).not.toThrow();
  expect(platform.extension).toBe('js');
});

test('should resolve filename.json', () => {
  expect(testRequire('../test4')).not.toThrow();
  expect(platform.extension).toBe('json');
});

test('should preserve identity for symlinks', () => {
  expect(require('../../../packages/jest-resolve')).toBe(
    require('jest-resolve')
  );
});
