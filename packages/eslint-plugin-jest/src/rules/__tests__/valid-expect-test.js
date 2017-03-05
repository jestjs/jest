/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

// This implementation is copied from eslint-plugin-jasmine.
// Credits goes to Alexander Afanasyev
// TODO: Should license at the top be MIT, as that's what the code in
// eslint-plugin-jasmine is?

/* eslint-disable sort-keys */

'use strict';

const RuleTester = require('eslint').RuleTester;
const rules = require('../../').rules;

const ruleTester = new RuleTester();

ruleTester.run('valid-expect', rules['valid-expect'], {
  valid: [
    'expect("something").toEqual("else");',
    'expect(true).toBeDefined();',
    'expect([1, 2, 3]).toEqual([1, 2, 3]);',
    'expect(undefined).not.toBeDefined();',
  ],

  invalid: [
    {
      code: 'expect().toBe(true);',
      errors: [
        {
          message: 'No arguments passed to expect()',
        },
      ],
    },
    {
      code: 'expect().toEqual("something");',
      errors: [
        {
          message: 'No arguments passed to expect()',
        },
      ],
    },
    {
      code: 'expect("something", "else").toEqual("something");',
      errors: [
        {
          message: 'More than one argument passed to expect()',
        },
      ],
    },
    {
      code: 'expect("something");',
      errors: [
        {
          message: 'Matcher was not called',
        },
        {
          message: 'Nothing called on expect()',
        },
      ],
    },
    {
      code: 'expect();',
      errors: [
        {
          message: 'No arguments passed to expect()',
        },
        {
          message: 'Matcher was not called',
        },
        {
          message: 'Nothing called on expect()',
        },
      ],
    },
    {
      code: 'expect(true).toBeDefined;',
      errors: [
        {
          message: 'Matcher was not called',
        },
      ],
    },
  ],
});
