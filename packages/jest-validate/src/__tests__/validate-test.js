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
const defaultConfig = require('jest-config').defaults;
const {validConfig, deprecatedConfig} = require('jest-config');

test('validates default config', () => {
  expect(validate(defaultConfig, validConfig)).toBe(true);
});

[
  [{automock: []}, 'Boolean'],
  [{coverageReporters: {}}, 'Array'],
  [{preset: 1337}, 'String'],
  [{haste: 42}, 'Object'],
].forEach(([config, type]) => {
  test(`pretty prints valid config for ${type}`, () => {
    expect(() => validate(config, validConfig)).toThrowErrorMatchingSnapshot();
  });
});

test('omits null and undefined config values', () => {
  const config = {
    haste: undefined,
    preset: null,
  };
  expect(validate(config, validConfig)).toBe(true);
});

test('displays warning for unknown config options', () => {
  const config = {unknown: {}};
  const warn = console.warn;
  console.warn = jest.fn();

  validate(config, validConfig);

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('displays warning for deprecated config options', () => {
  const config = {scriptPreprocessor: 'test'};
  const warn = console.warn;
  console.warn = jest.fn();

  validate(config, validConfig, deprecatedConfig);

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('works with custom warnings', () => {
  const config = {unknown: 'string'};
  const validConfig = {test: [1, 2]};
  const warn = console.warn;
  const options = {
    footer: '\n\n  custom footer',
    namespace: 'My Custom',
  };
  console.warn = jest.fn();

  validate(config, validConfig, {}, options);

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('works with custom errors', () => {
  const config = {test: 'string'};
  const validConfig = {test: [1, 2]};
  const options = {
    footer: '\n\n  custom footer',
    namespace: 'My Custom',
  };

  expect(() => validate(config, validConfig, {}, options))
    .toThrowErrorMatchingSnapshot();
});
