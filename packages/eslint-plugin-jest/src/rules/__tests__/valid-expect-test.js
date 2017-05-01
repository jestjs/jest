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
    'expect(Promise.resolve(2)).resolves.toBeDefined();',
    'expect(Promise.reject(2)).rejects.toBeDefined();',
    'expect.hasAssertions();',
    'expect.anything();',
    'expect.stringContaining("foobar");',
    'expect.arrayContaining(["foobar"]);',
    'expect.addSnapshotSerializer({});',
    'expect.extend({});',
    'expect.objectContaining({});',
    'expect.assertions(2);',
    'expect.stringMatching(/foobar/);',
    'expect.stringMatching(new RegExp("foobar"));',
    'expect.stringMatching("foobar");',
    'expect.stringContaining(path.join("__tests__", "__fixtures__"));',
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
    {
      code: 'expect.somethingWeird();',
      errors: [
        {
          endColumn: 22,
          column: 8,
          message: '"somethingWeird" is not a valid property of expect.',
        },
      ],
    },
    {
      code: 'expect.arrayContaining("foo", "bar", "baz");',
      errors: [
        {
          endColumn: 42,
          column: 31,
          message: 'More than one argument was passed to "arrayContaining".',
        },
      ],
    },
    {
      code: 'expect.assertions();',
      errors: [
        {
          endColumn: 18,
          column: 8,
          message: '"assertions" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.assertions("foobar");',
      errors: [
        {
          endColumn: 27,
          column: 19,
          message: 'Argument to "assertions" must be a number.',
        },
      ],
    },
    {
      code: 'expect.hasAssertions("foobar");',
      errors: [
        {
          endColumn: 30,
          column: 22,
          message: '"hasAssertions" must not be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.anything("foobar");',
      errors: [
        {
          endColumn: 25,
          column: 17,
          message: '"anything" must not be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.stringContaining();',
      errors: [
        {
          endColumn: 24,
          column: 8,
          message: '"stringContaining" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.stringContaining(true);',
      errors: [
        {
          endColumn: 29,
          column: 25,
          message: 'Argument to "stringContaining" must be a string.',
        },
      ],
    },
    {
      code: 'expect.arrayContaining();',
      errors: [
        {
          endColumn: 23,
          column: 8,
          message: '"arrayContaining" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.arrayContaining("foobar");',
      errors: [
        {
          endColumn: 32,
          column: 24,
          message: 'Argument to "arrayContaining" must be an array.',
        },
      ],
    },
    {
      code: 'expect.arrayContaining({});',
      errors: [
        {
          endColumn: 26,
          column: 24,
          message: 'Argument to "arrayContaining" must be an array.',
        },
      ],
    },
    {
      code: 'expect.addSnapshotSerializer();',
      errors: [
        {
          endColumn: 29,
          column: 8,
          message: '"addSnapshotSerializer" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.addSnapshotSerializer("foobar");',
      errors: [
        {
          endColumn: 38,
          column: 30,
          message: 'Argument to "addSnapshotSerializer" must be an object.',
        },
      ],
    },
    {
      code: 'expect.extend();',
      errors: [
        {
          endColumn: 14,
          column: 8,
          message: '"extend" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.extend("foobar");',
      errors: [
        {
          endColumn: 23,
          column: 15,
          message: 'Argument to "extend" must be an object.',
        },
      ],
    },
    {
      code: 'expect.objectContaining();',
      errors: [
        {
          endColumn: 24,
          column: 8,
          message: '"objectContaining" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.objectContaining("foobar");',
      errors: [
        {
          endColumn: 33,
          column: 25,
          message: 'Argument to "objectContaining" must be an object.',
        },
      ],
    },
    {
      code: 'expect.stringMatching();',
      errors: [
        {
          endColumn: 22,
          column: 8,
          message: '"stringMatching" must be called with arguments.',
        },
      ],
    },
    {
      code: 'expect.stringMatching(["foobar"]);',
      errors: [
        {
          endColumn: 33,
          column: 23,
          message: 'Argument to "stringMatching" must be a regexp.',
        },
      ],
    },
  ],
});
