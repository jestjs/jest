/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {multipleValidOptions} from '../condition';
import jestValidateDefaultConfig from '../defaultConfig';
import jestValidateExampleConfig from '../exampleConfig';
import validate from '../validate';
import {
  defaultConfig,
  deprecatedConfig,
  validConfig,
} from './__fixtures__/jestConfig';

const spyConsoleWarn = jest.spyOn(console, 'warn');

beforeEach(() => {
  spyConsoleWarn.mockImplementation(() => {});
});

afterEach(() => {
  spyConsoleWarn.mockReset();
});

test('recursively validates default Jest config', () => {
  expect(
    validate(defaultConfig, {
      exampleConfig: validConfig,
    }),
  ).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test('recursively validates default jest-validate config', () => {
  expect(
    validate(jestValidateDefaultConfig, {
      exampleConfig: jestValidateExampleConfig,
    }),
  ).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test.each([
  ['Boolean', {automock: []}],
  ['Array', {coverageReporters: {}}],
  ['String', {preset: 1337}],
  ['Object', {haste: 42}],
])('pretty prints valid config for %s', (_type, config) => {
  expect(() =>
    validate(config, {
      exampleConfig: validConfig,
    }),
  ).toThrowErrorMatchingSnapshot();
});

test('pretty prints valid config for Function', () => {
  const config = {fn: 'test'};
  const validConfig = {
    fn: (_config: unknown, _option: unknown, _deprecatedOptions: unknown) =>
      true,
  };
  expect(() =>
    validate(config, {
      exampleConfig: validConfig,
    }),
  ).toThrowErrorMatchingSnapshot();
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

test('recursively omits null and undefined config values', () => {
  const config = {
    coverageThreshold: {
      global: null,
    },
  };
  expect(
    validate(config, {exampleConfig: validConfig, recursive: true}),
  ).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test.each([
  [function () {}, function () {}],
  [async function () {}, function () {}],
  [function () {}, async function () {}],
  [async function () {}, async function () {}],
])(
  'treat async and non-async functions as equivalent',
  (value, exampleValue) => {
    expect(
      validate({name: value}, {exampleConfig: {name: exampleValue}}),
    ).toEqual({hasDeprecationWarnings: false, isValid: true});
  },
);

test('respects recursiveDenylist', () => {
  const config = {
    something: {
      nested: {
        some_random_key: 'value',
        some_random_key2: 'value2',
      },
    },
  };
  const exampleConfig = {
    something: {
      nested: {
        test: true,
      },
    },
  };

  validate(config, {exampleConfig});

  expect(spyConsoleWarn).toHaveBeenCalled();

  spyConsoleWarn.mockReset();

  validate(config, {
    exampleConfig,
    recursiveDenylist: ['something.nested'],
  });

  expect(spyConsoleWarn).not.toHaveBeenCalled();
});

test('displays warning for unknown config options', () => {
  const config = {unkwon: {}};
  const validConfig = {unknown: 'string'};

  validate(config, {exampleConfig: validConfig});

  expect(spyConsoleWarn.mock.calls[0][0]).toMatchSnapshot();
});

test('displays warning for deprecated config options', () => {
  const config = {scriptPreprocessor: 'test'};

  expect(
    validate(config, {
      deprecatedConfig,
      exampleConfig: validConfig,
    }),
  ).toEqual({
    hasDeprecationWarnings: true,
    isValid: true,
  });

  expect(spyConsoleWarn.mock.calls[0][0]).toMatchSnapshot();
});

test('works with custom warnings', () => {
  const config = {unknown: 'string'};
  const validConfig = {test: [1, 2]};
  const options = {
    comment: 'My custom comment',
    deprecatedConfig,
    exampleConfig: validConfig,
    title: {
      warning: 'My Custom Warning',
    },
  };

  validate(config, options);

  expect(spyConsoleWarn.mock.calls[0][0]).toMatchSnapshot();
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
  const options = {
    comment: 'My custom comment',
    deprecatedConfig,
    exampleConfig: validConfig,
    title: {
      deprecation: 'My Custom Deprecation Warning',
    },
  };

  validate(config, options);

  expect(spyConsoleWarn.mock.calls[0][0]).toMatchSnapshot();
});

test('works with multiple valid types', () => {
  const exampleConfig = {
    foo: multipleValidOptions('text', ['text']),
  };

  expect(
    validate(
      {foo: 'foo'},
      {
        exampleConfig,
      },
    ),
  ).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
  expect(
    validate(
      {foo: ['foo']},
      {
        exampleConfig,
      },
    ),
  ).toEqual({
    hasDeprecationWarnings: false,
    isValid: true,
  });
});

test('reports errors nicely when failing with multiple valid options', () => {
  const exampleConfig = {
    foo: multipleValidOptions('text', ['text']),
  };

  expect(() =>
    validate(
      {foo: 2},
      {
        exampleConfig,
      },
    ),
  ).toThrowErrorMatchingSnapshot();
});

test('Repeated types within multiple valid examples are coalesced in error report', () => {
  const exampleConfig = {
    foo: multipleValidOptions('foo', 'bar', 2),
  };

  expect(() =>
    validate(
      {foo: false},
      {
        exampleConfig,
      },
    ),
  ).toThrowErrorMatchingSnapshot();
});

test('Comments in config JSON using "//" key are not warned', () => {
  const config = {'//': 'a comment'};

  validate(config, {
    exampleConfig: validConfig,
  });
  expect(spyConsoleWarn).not.toHaveBeenCalled();

  spyConsoleWarn.mockReset();

  validate(config, {
    exampleConfig: validConfig,
    recursiveDenylist: ['myCustomKey' as "don't validate this"],
  });
  expect(spyConsoleWarn).not.toHaveBeenCalled();
});
