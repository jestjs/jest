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
const {
  defaultConfig,
  validConfig,
  deprecatedConfig,
} = require('./fixtures/jestConfig');
const jestValidateExampleConfig = require('../exampleConfig');
const jestValidateDefaultConfig = require('../defaultConfig');

test('validates default Jest config', () => {
  expect(validate(defaultConfig, {
    exampleConfig: validConfig,
  })).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test('validates default jest-validate config', () => {
  expect(validate(jestValidateDefaultConfig, {
    exampleConfig: jestValidateExampleConfig,
  })).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

[
  [{automock: []}, 'Boolean'],
  [{coverageReporters: {}}, 'Array'],
  [{preset: 1337}, 'String'],
  [{haste: 42}, 'Object'],
].forEach(([config, type]) => {
  test(`pretty prints valid config for ${type}`, () => {
    expect(() => validate(config, {exampleConfig: validConfig}))
      .toThrowErrorMatchingSnapshot();
  });
});

test(`pretty prints valid config for Function`, () => {
  const config = {fn: 'test'};
  const validConfig = {fn: (config, option, deprecatedOptions) => true};
  expect(() => validate(config, {exampleConfig: validConfig}))
    .toThrowErrorMatchingSnapshot();
});

test('omits null and undefined config values', () => {
  const config = {
    haste: undefined,
    preset: null,
  };
  expect(validate(config, {exampleConfig: validConfig})).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test('displays warning for unknown config options', () => {
  const config = {unkwon: {}};
  const validConfig = {unknown: 'string'};
  const warn = console.warn;
  console.warn = jest.fn();

  validate(config, {exampleConfig: validConfig});

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('displays warning for deprecated config options', () => {
  const config = {scriptPreprocessor: 'test'};
  const warn = console.warn;
  console.warn = jest.fn();

  expect(validate(config, {
    deprecatedConfig,
    exampleConfig: validConfig,
  })).toEqual({
    hasDeprecationWarnings: true,
    isValid: true,
  });

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('works with custom warnings', () => {
  const config = {unknown: 'string'};
  const validConfig = {test: [1, 2]};
  const warn = console.warn;
  const options = {
    comment: 'My custom comment',
    deprecatedConfig,
    exampleConfig: validConfig,
    title: {
      warning: 'My Custom Warning',
    },
  };
  console.warn = jest.fn();

  validate(config, options);

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});

test('works with custom errors', () => {
  const config = {test: 'string'};
  const validConfig = {test: [1, 2]};
  const options = {
    comment: 'My custom comment',
    deprecatedConfig,
    exampleConfig: validConfig,
    title: {
      error: 'My Custom Error',
    },
  };

  expect(() => validate(config, options)).toThrowErrorMatchingSnapshot();
});

test('works with custom deprecations', () => {
  const config = {scriptPreprocessor: 'test'};
  const warn = console.warn;
  const options = {
    comment: 'My custom comment',
    deprecatedConfig,
    exampleConfig: validConfig,
    title: {
      deprecation: 'My Custom Deprecation Warning',
    },
  };
  console.warn = jest.fn();

  validate(config, options);

  expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  console.warn = warn;
});
