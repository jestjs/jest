/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
