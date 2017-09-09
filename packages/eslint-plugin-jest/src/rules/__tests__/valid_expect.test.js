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

import {RuleTester} from 'eslint';
import {rules} from '../../';

const ruleTester = new RuleTester();

ruleTester.run('valid-expect', rules['valid-expect'], {
  valid: [
    'expect("something").toEqual("else");',
    'expect(true).toBeDefined();',
    'expect([1, 2, 3]).toEqual([1, 2, 3]);',
    'expect(undefined).not.toBeDefined();',
    'expect(Promise.resolve(2)).resolves.toBeDefined();',
    'expect(Promise.reject(2)).rejects.toBeDefined();',
  ],

  invalid: [
    {
      code: 'expect().toBe(true);',
      errors: [
        {
          endColumn: 8,
          column: 7,
          message: 'No arguments were passed to expect().',
        },
      ],
    },
    {
      code: 'expect().toEqual("something");',
      errors: [
        {
          endColumn: 8,
          column: 7,
          message: 'No arguments were passed to expect().',
        },
      ],
    },
    {
      code: 'expect("something", "else").toEqual("something");',
      errors: [
        {
          endColumn: 26,
          column: 21,
          message: 'More than one argument was passed to expect().',
        },
      ],
    },
    {
      code: 'expect("something");',
      errors: [
        {
          endColumn: 20,
          column: 1,
          message: 'No assertion was called on expect().',
        },
      ],
    },
    {
      code: 'expect();',
      errors: [
        {
          endColumn: 9,
          column: 1,
          message: 'No assertion was called on expect().',
        },
        {
          endColumn: 8,
          column: 7,
          message: 'No arguments were passed to expect().',
        },
      ],
    },
    {
      code: 'expect(true).toBeDefined;',
      errors: [
        {
          endColumn: 25,
          column: 14,
          message: '"toBeDefined" was not called.',
        },
      ],
    },
    {
      code: 'expect(true).not.toBeDefined;',
      errors: [
        {
          endColumn: 29,
          column: 18,
          message: '"toBeDefined" was not called.',
        },
      ],
    },
    {
      code: 'expect(true).nope.toBeDefined;',
      errors: [
        {
          endColumn: 18,
          column: 14,
          message: '"nope" is not a valid property of expect.',
        },
      ],
    },
  ],
});
