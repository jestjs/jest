/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {RuleTester} from 'eslint';
const {rules} = require('../../');

const ruleTester = new RuleTester();
const expectedMsg =
  'Promise should be returned to test its fulfillment or rejection';

ruleTester.run('valid-expect-in-promise', rules['valid-expect-in-promise'], {
  invalid: [
    {
      code:
        'it("it1", () => { somePromise.then(' +
        '() => {expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 19,
          endColumn: 76,
          message: expectedMsg,
        },
      ],
      parserOptions: {ecmaVersion: 6},
    },
    {
      code:
        'it("it1", function() { getSomeThing().getPromise().then(' +
        'function() {expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 102,
          message: expectedMsg,
        },
      ],
    },
    {
      code:
        'it("it1", function() { Promise.resolve().then(' +
        'function() {expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 92,
          message: expectedMsg,
        },
      ],
    },
    {
      code:
        'it("it1", function() { somePromise.catch(' +
        'function() {expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 87,
          message: expectedMsg,
        },
      ],
    },
    {
      code:
        'it("it1", function() { somePromise.then(' +
        'function() { expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 87,
          message: expectedMsg,
        },
      ],
    },
    {
      code:
        'it("it1", function() { Promise.resolve().then(' +
        'function() { /*fulfillment*/ expect(someThing).toEqual(true)}, ' +
        'function() { /*rejection*/ expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 170,
          message: expectedMsg,
        },
        {
          column: 24,
          endColumn: 170,
          message: expectedMsg,
        },
      ],
    },
    {
      code:
        'it("it1", function() { Promise.resolve().then(' +
        'function() { /*fulfillment*/}, ' +
        'function() { /*rejection*/ expect(someThing).toEqual(true)})})',
      errors: [
        {
          column: 24,
          endColumn: 138,
          message: expectedMsg,
        },
      ],
    },
  ],

  valid: [
    {
      code:
        'it("it1", () => { return somePromise.then(() => {expect(someThing).toEqual(true)})})',
      parserOptions: {sourceType: 'module'},
    },

    'it("it1", function() { return somePromise.catch(' +
      'function() {expect(someThing).toEqual(true)})})',

    'it("it1", function() { somePromise.then(' +
      'function() {doSomeThingButNotExpect()})})',

    'it("it1", function() { return getSomeThing().getPromise().then(' +
      'function() {expect(someThing).toEqual(true)})})',

    'it("it1", function() { return Promise.resolve().then(' +
      'function() {expect(someThing).toEqual(true)})})',

    'it("it1", function() { return Promise.resolve().then(' +
      'function() { /*fulfillment*/ expect(someThing).toEqual(true)}, ' +
      'function() { /*rejection*/ expect(someThing).toEqual(true)})})',

    'it("it1", function() { return Promise.resolve().then(' +
      'function() { /*fulfillment*/}, ' +
      'function() { /*rejection*/ expect(someThing).toEqual(true)})})',

    'it("it1", function() { return somePromise.then()})',
  ],
});
