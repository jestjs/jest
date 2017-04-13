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
    {
      code: 'expect(true).toBeSomethingWeird();',
      options: [{extraMatchers: ['toBeSomethingWeird']}],
    },
    {
      code: 'expect(true).not.toBeSomethingWeird();',
      options: [{extraMatchers: ['toBeSomethingWeird']}],
    },
  ],

  invalid: [
    {
      code: 'expect().toBe(true);',
      errors: [
        {
          message: 'No arguments were passed to expect().',
        },
      ],
    },
    {
      code: 'expect().toEqual("something");',
      errors: [
        {
          message: 'No arguments were passed to expect().',
        },
      ],
    },
    {
      code: 'expect("something", "else").toEqual("something");',
      errors: [
        {
          message: 'More than one argument was passed to expect().',
        },
      ],
    },
    {
      code: 'expect("something");',
      errors: [
        {
          message: 'No assertion was called on expect().',
        },
      ],
    },
    {
      code: 'expect();',
      errors: [
        {
          message: 'No arguments were passed to expect().',
        },
        {
          message: 'No assertion was called on expect().',
        },
      ],
    },
    {
      code: 'expect(true).toBeDefined;',
      errors: [
        {
          message: '"toBeDefined" was not called.',
        },
      ],
    },
    {
      code: 'expect(true).not.toBeDefined;',
      errors: [
        {
          message: '"toBeDefined" was not called.',
        },
      ],
    },
    {
      code: 'expect(true).nope.toBeDefined;',
      errors: [
        {
          message: '"nope" is not a valid property of expect.',
        },
        {
          message: '"toBeDefined" was not called.',
        },
      ],
    },
    {
      code: 'expect(true).nope.toBeDefined();',
      errors: [
        {
          message: '"nope" is not a valid property of expect.',
        },
      ],
    },
    {
      code: 'expect(true).toBeSomethingWeird();',
      errors: [
        {
          message: '"toBeSomethingWeird" is not a known matcher.',
        },
      ],
    },
    {
      code: 'expect(true).not.toBeSomethingWeird();',
      errors: [
        {
          message: '"toBeSomethingWeird" is not a known matcher.',
        },
      ],
    },
    {
      code: 'expect(true).not.toBeSomethingElseWeird();',
      errors: [
        {
          message: '"toBeSomethingElseWeird" is not a known matcher.',
        },
      ],
      options: [{extraMatchers: ['toBeSomethingWeird']}],
    },
    {
      code: 'expect(true).not.toBeSomethingWeird();',
      errors: [
        {
          message: '"toBeSomethingWeird" is not a known matcher.',
        },
      ],
      options: [{extraTypos: ['toBeSomethingWeird']}],
    },
  ],
});
