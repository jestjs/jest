/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const validateCLIOptions = require('../validateCLIOptions');

test('validates yargs special options', () => {
  const options = ['$0', '_', 'help', 'h'];
  const argv = {
    $0: true,
    _: true,
    h: false,
    help: false,
  };
  expect(validateCLIOptions(argv, options)).toBe(true);
});

test('fails for unknown option', () => {
  const options = ['$0', '_', 'help', 'h'];
  const argv = {
    $0: true,
    unknown: 'unknown',
  };
  expect(() => validateCLIOptions(argv, options))
    .toThrowErrorMatchingSnapshot();
});

test('fails for multiple unknown options', () => {
  const options = ['$0', '_', 'help', 'h'];
  const argv = {
    $0: true,
    jest: 'cool',
    test: 'unknown',
  };
  expect(() => validateCLIOptions(argv, options))
    .toThrowErrorMatchingSnapshot();
});
