/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable sort-keys */

'use strict';

import {RuleTester} from 'eslint';
const {rules} = require('../../');

const ruleTester = new RuleTester();
const expectedErrorMessage = 'Unexpected focused test.';

ruleTester.run('no-focused-tests', rules['no-focused-tests'], {
  valid: [
    'describe()',
    'it()',
    'describe.skip()',
    'it.skip()',
    'test()',
    'test.skip()',
    'var appliedOnly = describe.only; appliedOnly.apply(describe)',
    'var calledOnly = it.only; calledOnly.call(it)',
  ],

  invalid: [
    {
      code: 'describe.only()',
      errors: [{message: expectedErrorMessage, column: 10, line: 1}],
    },
    {
      code: 'describe["only"]()',
      errors: [{message: expectedErrorMessage, column: 10, line: 1}],
    },
    {
      code: 'it.only()',
      errors: [{message: expectedErrorMessage, column: 4, line: 1}],
    },
    {
      code: 'it["only"]()',
      errors: [{message: expectedErrorMessage, column: 4, line: 1}],
    },
    {
      code: 'test.only()',
      errors: [{message: expectedErrorMessage, column: 6, line: 1}],
    },
    {
      code: 'test["only"]()',
      errors: [{message: expectedErrorMessage, column: 6, line: 1}],
    },
    {
      code: 'fdescribe()',
      errors: [{message: expectedErrorMessage, column: 1, line: 1}],
    },
    {
      code: 'fit()',
      errors: [{message: expectedErrorMessage, column: 1, line: 1}],
    },
  ],
});
