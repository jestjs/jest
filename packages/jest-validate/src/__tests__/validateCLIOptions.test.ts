/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {DeprecatedOptions} from '../types';
import validateCLIOptions from '../validateCLIOptions';

test('validates yargs special options', () => {
  const argv = {
    $0: 'foo',
    _: ['bar'],
    h: false,
    help: false,
  };

  expect(validateCLIOptions(argv)).toBe(true);
});

test('fails for unknown option', () => {
  const argv = {
    $0: 'foo',
    _: ['bar'],
    unknown: 'unknown',
  };

  expect(() => validateCLIOptions(argv)).toThrowErrorMatchingSnapshot();
});

test('fails for multiple unknown options', () => {
  const argv = {
    $0: 'foo',
    _: ['bar'],
    jest: 'cool',
    test: 'unknown',
  };

  expect(() => validateCLIOptions(argv)).toThrowErrorMatchingSnapshot();
});

test('does not show suggestion when unrecognized cli param length <= 1', () => {
  const argv = {
    $0: 'foo',
    _: ['bar'],
    l: true,
  };

  expect(() => validateCLIOptions(argv)).toThrowErrorMatchingSnapshot();
});

test('shows suggestion when unrecognized cli param length > 1', () => {
  const argv = {
    $0: 'foo',
    _: ['bar'],
    hell: true,
  };

  expect(() => validateCLIOptions(argv)).toThrowErrorMatchingSnapshot();
});

describe('handles deprecated CLI options', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn');
  });

  afterEach(() => {
    jest.mocked(console.warn).mockRestore();
  });

  test('print warning for deprecated options that are listed in config', () => {
    const optionName = 'foo';
    const argv = {
      $0: 'foo',
      _: ['bar'],
      [optionName]: true,
    };

    validateCLIOptions(argv, {
      deprecationEntries: {
        [optionName]: () => 'Deprecation message',
      } as DeprecatedOptions,
      [optionName]: {},
    });

    expect(jest.mocked(console.warn).mock.calls[0][0]).toMatchSnapshot();
  });

  test('throw an error for deprecated options that are not listed in config', () => {
    const optionName = 'foo';

    const argv = {
      $0: 'foo',
      _: ['bar'],
      [optionName]: true,
    };

    expect(() =>
      validateCLIOptions(argv, {
        deprecationEntries: {
          [optionName]: () => 'Deprecation message',
        } as DeprecatedOptions,
      }),
    ).toThrowErrorMatchingSnapshot();
  });
});
