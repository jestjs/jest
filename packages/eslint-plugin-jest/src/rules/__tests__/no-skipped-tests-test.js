/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable sort-keys */

const RuleTester = require('eslint').RuleTester;
const rules = require('../../').rules;

const ruleTester = new RuleTester();
const expectedErrorMessage = 'Unexpected disabled test.';

ruleTester.run('no-disabled-tests', rules['no-disabled-tests'], {
  valid: [
    'describe()',
    'it()',
    'describe.only()',
    'it.only()',
    'test()',
    'test.only()',
    'var appliedSkip = describe.skip; appliedSkip.apply(describe)',
    'var calledSkip = it.skip; calledSkip.call(it)',
  ],

  invalid: [
    {
      code: 'describe.skip()',
      errors: [{message: expectedErrorMessage, column: 10, line: 1}],
    },
    {
      code: 'describe["skip"]()',
      errors: [{message: expectedErrorMessage, column: 10, line: 1}],
    },
    {
      code: 'it.skip()',
      errors: [{message: expectedErrorMessage, column: 4, line: 1}],
    },
    {
      code: 'it["skip"]()',
      errors: [{message: expectedErrorMessage, column: 4, line: 1}],
    },
    {
      code: 'test.skip()',
      errors: [{message: expectedErrorMessage, column: 6, line: 1}],
    },
    {
      code: 'test["skip"]()',
      errors: [{message: expectedErrorMessage, column: 6, line: 1}],
    },
    {
      code: 'xdescribe()',
      errors: [{message: expectedErrorMessage, column: 1, line: 1}],
    },
    {
      code: 'xit()',
      errors: [{message: expectedErrorMessage, column: 1, line: 1}],
    },
  ],
});
