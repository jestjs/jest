/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const validate = require('../validate');
const defaultConfig = require('../defaults');

test('validates default config', () => {
  expect(validate(defaultConfig)).toBe(true);
});

[
  [{automock: []}, 'Boolean'],
  [{coverageReporters: {}}, 'Array'],
  [{preset: 1337}, 'String'],
  [{haste: 42}, 'Object'],
].forEach(([config, type]) => {
  test(`pretty prints valid config for ${type}`, () => {
    expect(() => validate(config)).toThrowErrorMatchingSnapshot();
  });
});

test(`omits null and undefined config values`, () => {
  const config = {
    preset: null,
    haste: undefined,
  };
  expect(validate(config)).toBe(true);
});

// to be moved to integration tests
test(`displays warning for unknown config options`, () => {
  const config = {
    unknown: [],
  };
  expect(validate(config)).toBe(true);
});
