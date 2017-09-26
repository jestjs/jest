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

ruleTester.run('no-disabled-tests', rules['no-disabled-tests'], {
  valid: [
    'describe("foo", function () {})',
    'it("foo", function () {})',
    'describe.only("foo", function () {})',
    'it.only("foo", function () {})',
    'test("foo", function () {})',
    'test.only("foo", function () {})',
    'var appliedSkip = describe.skip; appliedSkip.apply(describe)',
    'var calledSkip = it.skip; calledSkip.call(it)',
  ],

  invalid: [
    {
      code: 'describe.skip("foo", function () {})',
      errors: [{message: 'Skipped test suite', column: 1, line: 1}],
    },
    {
      code: 'describe["skip"]("foo", function () {})',
      errors: [{message: 'Skipped test suite', column: 1, line: 1}],
    },
    {
      code: 'it.skip("foo", function () {})',
      errors: [{message: 'Skipped test', column: 1, line: 1}],
    },
    {
      code: 'it["skip"]("foo", function () {})',
      errors: [{message: 'Skipped test', column: 1, line: 1}],
    },
    {
      code: 'test.skip("foo", function () {})',
      errors: [{message: 'Skipped test', column: 1, line: 1}],
    },
    {
      code: 'test["skip"]("foo", function () {})',
      errors: [{message: 'Skipped test', column: 1, line: 1}],
    },
    {
      code: 'xdescribe("foo", function () {})',
      errors: [{message: 'Disabled test suite', column: 1, line: 1}],
    },
    {
      code: 'xit("foo", function () {})',
      errors: [{message: 'Disabled test', column: 1, line: 1}],
    },
    {
      code: 'xtest("foo", function () {})',
      errors: [{message: 'Disabled test', column: 1, line: 1}],
    },
    {
      code: 'it("has title but no callback")',
      errors: [
        {
          message: 'Test is missing function argument',
          column: 1,
          line: 1,
        },
      ],
    },
    {
      code: 'test("has title but no callback")',
      errors: [
        {
          message: 'Test is missing function argument',
          column: 1,
          line: 1,
        },
      ],
    },
    {
      code: 'it("contains a call to pending", function () { pending() })',
      errors: [{message: 'Call to pending() within test', column: 48, line: 1}],
    },
    {
      code: 'describe("contains a call to pending", function () { pending() })',
      errors: [
        {
          message: 'Call to pending() within test suite',
          column: 54,
          line: 1,
        },
      ],
    },
  ],
});
