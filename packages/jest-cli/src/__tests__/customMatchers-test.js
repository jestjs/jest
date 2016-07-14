/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

const JasmineFormatter = require('jest-util').JasmineFormatter;

const formatter = new JasmineFormatter(jasmine, {global: {}});
const CALLED_AT_LEAST_ONCE = 'Expected to be called at least once';
const SHOULD_NOT_BE_CALLED = 'Expected not to be called';
const NOT_EXPECTED_VALUES =
  'Was not called with the expected values.\n' +
  `Expected call:\n${formatter.prettyPrint([1, {}, 'Error'])}\n` +
  `Actual call:\n${formatter.prettyPrint([1, {}, ''])}`;

const NOT_EXPECTED_VALUES_EXACTLY_FOUR =
  'Was not called with the expected values.\n' +
  `Expected call:\n${formatter.prettyPrint([5])}\n` +
  `Actual calls:\n${formatter.prettyPrint([4])},` +
  `\n${formatter.prettyPrint([3])},` +
  `\n${formatter.prettyPrint([2])}` +
  `\nand 1 other call.`;

const NOT_EXPECTED_VALUES_MORE_THAN_FOUR =
  'Was not called with the expected values.\n' +
  `Expected call:\n${formatter.prettyPrint([5])}\n` +
  `Actual calls:\n${formatter.prettyPrint([8])},` +
  `\n${formatter.prettyPrint([7])},` +
  `\n${formatter.prettyPrint([6])}` +
  `\nand 4 other calls.`;

const NOT_EXPECTED_VALUES_LAST_TIME =
  `Wasn't last called with the expected values.\n` +
  `Expected call:\n${formatter.prettyPrint([1, {}, 'Error'])}\n` +
  `Actual call:\n${formatter.prettyPrint([1, {}, ''])}`;

const SHOULD_NOT_HAVE_CALLED_WITH =
  `Shouldn't have been called with\n${formatter.prettyPrint([1, {}, ''])}`;

const SHOULD_NOT_HAVE_LAST_CALLED_WITH =
  `Shouldn't have been last called with\n${formatter.prettyPrint([1, {}, ''])}`;

describe('toBeCalled', () => {
  it('shows a custom message when the test fails', () => {
    const fn = jest.fn();
    expect(() => expect(fn).toBeCalled()).toThrowError(
      CALLED_AT_LEAST_ONCE,
    );
  });

  it('shows another message for failing a "not" expression', () => {
    const fn = jest.fn();
    fn();
    expect(() => expect(fn).not.toBeCalled()).toThrowError(
      SHOULD_NOT_BE_CALLED,
    );
  });

  it(`doesn't show any message when succeeding`, () => {
    const fn = jest.fn();
    fn();
    expect(fn).toBeCalled();
  });
});

describe('lastCalledWith', () => {
  it(`doesn't show any message when succeding`, () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(fn).lastCalledWith(1, {}, '');
  });

  it('shows another message for failing a "not" expression', () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(() => expect(fn).not.lastCalledWith(1, {}, '')).toThrowError(
      SHOULD_NOT_HAVE_LAST_CALLED_WITH,
    );
  });

  it('shows a custom message when the test fails', () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(() => expect(fn).lastCalledWith(1, {}, 'Error')).toThrowError(
      NOT_EXPECTED_VALUES_LAST_TIME,
    );
  });

});

describe('toBeCalledWith', () => {
  it(`doesn't show any message when succeeding`, () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(fn).toBeCalledWith(1, {}, '');
  });

  it('shows another message for failing a "not" expression', () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(() => expect(fn).not.toBeCalledWith(1, {}, '')).toThrowError(
      SHOULD_NOT_HAVE_CALLED_WITH,
    );
  });

  it('shows a custom message when the test fails without other calls when calls >= 3', () => {
    const fn = jest.fn();
    fn(1, {}, '');
    expect(() => expect(fn).toBeCalledWith(1, {}, 'Error')).toThrowError(
      NOT_EXPECTED_VALUES,
    );
  });

  it('shows a custom message with amount of singular amount of other calls when calls === 4', () => {
    const fn = jest.fn();
    fn(1);
    fn(2);
    fn(3);
    fn(4);
    expect(() => expect(fn).toBeCalledWith(5)).toThrowError(
      NOT_EXPECTED_VALUES_EXACTLY_FOUR,
    );
  });

  it('shows a custom message with plurar amount of other calls when calls > 4', () => {
    const fn = jest.fn();
    fn(1);
    fn(2);
    fn(3);
    fn(4);
    fn(6);
    fn(7);
    fn(8);
    expect(() => expect(fn).toBeCalledWith(5)).toThrowError(
      NOT_EXPECTED_VALUES_MORE_THAN_FOUR,
    );
  });
});
