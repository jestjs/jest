/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {MatchersObject} from './types';

const CALL_PRINT_LIMIT = 3;
const LAST_CALL_PRINT_LIMIT = 1;
const {
  stringify,
  ensureNoExpected,
  ensureExpectedIsNumber,
  pluralize,
} = require('jest-matcher-utils');

const equals = global.jasmine.matchersUtil.equals;

const spyMatchers: MatchersObject = {
  toHaveBeenCalled(actual: any, expected: void) {
    ensureNoExpected(expected, 'toHaveBeenCalled');
    ensureMockOrSpy(actual, 'toHaveBeenCalled');

    return isSpy(actual)
      ? jasmineToHaveBeenCalled(actual)
      : jestToHaveBeenCalled(actual);
  },

  toBeCalled(actual: any, expected: void) {
    ensureNoExpected(expected, 'toBeCalled');
    ensureMockOrSpy(actual, 'toBeCalled');
    return isSpy(actual)
      ? jasmineToHaveBeenCalled(actual)
      : jestToHaveBeenCalled(actual);
  },

  toHaveBeenCalledTimes(actual: any, expected: number) {
    ensureExpectedIsNumber(expected, 'toHaveBeenCalledTimes');
    ensureMockOrSpy(actual, 'toHaveBeenCalledTimes');

    const actualIsSpy = isSpy(actual);
    const type = actualIsSpy ? 'spy' : 'mock function';
    const count = actualIsSpy
      ? actual.calls.count()
      : actual.mock.calls.length;
    const pass = count === expected;
    const message = pass
      ? `Expected the ${type} not to be called ${pluralize('time', expected)}` +
        `, but it was called ${pluralize('time', count)}.`
      : `Expected the ${type} to be called ${pluralize('time', expected)},` +
        ` but it was called ${pluralize('time', count)}.`;

    return {message, pass};
  },

  toHaveBeenCalledWith(
    actual: any,
    _: any,
    options: Object,
    {args}: any,
  ) {
    ensureMockOrSpy(actual, 'toHaveBeenCalledWith');

    return toHaveBeenCalledWith(actual, Array.from(args));
  },

  toBeCalledWith(
    actual: any,
    _: any,
    options: Object,
    {args}: any,
  ) {
    ensureMockOrSpy(actual, 'toBeCalledWith');

    return toHaveBeenCalledWith(actual, Array.from(args));
  },

  toHaveBeenLastCalledWith(
    actual: any,
    _: any,
    options: Object,
    {args}: any,
  ) {
    ensureMockOrSpy(actual, 'toHaveBeenLastCalledWith');

    return toHaveBeenLastCalledWith(actual, Array.from(args));
  },

  lastCalledWith(
    actual: any,
    _: any,
    options: Object,
    {args}: any,
  ) {
    ensureMockOrSpy(actual, 'lastCalledWith');

    return toHaveBeenLastCalledWith(actual, Array.from(args));
  },
};

const jestToHaveBeenCalled = actual => {
  const pass = actual.mock.calls.length > 0;
  const message = pass
    ? `Expected the mock function not to be called, but it was` +
      ` called ${pluralize('time', actual.mock.calls.length)}.`
    : `Expected the mock function to be called.`;

  return {message, pass};
};

const jasmineToHaveBeenCalled = actual => {
  const pass = actual.calls.any();
  const message = pass
    ? `Expected the spy not to be called, but it was` +
      ` called ${pluralize('time', actual.calls.count())}.`
    : `Expected the spy to be called.`;

  return {message, pass};
};

const toHaveBeenLastCalledWith = (actual, expected) => {
  const actualIsSpy = isSpy(actual);
  const type = actualIsSpy ? 'spy' : 'mock function';
  const calls = actualIsSpy
    ? actual.calls.all().map(x => x.args)
    : actual.mock.calls;
  const pass = equals(calls[calls.length - 1], expected);

  const message = pass
    ? `Expected ${type} not to be last called` +
      ` with '${stringify(expected)}' but it was`
    : `Expected ${type} to be last called with:\n` +
       stringify(expected) +
       getActualCalls(calls, LAST_CALL_PRINT_LIMIT);

  return {message, pass};
};

const toHaveBeenCalledWith = (actual, expected) => {
  const actualIsSpy = isSpy(actual);
  const type = actualIsSpy ? 'spy' : 'mock function';
  const calls = actualIsSpy
    ? actual.calls.all().map(x => x.args)
    : actual.mock.calls;
  const pass = calls.some(call => equals(call, expected));

  const message = pass
    ? `Expected ${type} not to be called` +
      ` with '${stringify(expected)}' but it was`
    : `Expected ${type} to be called with:\n` +
       stringify(expected) +
       getActualCalls(calls, CALL_PRINT_LIMIT);

  return {message, pass};
};

const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

const ensureMockOrSpy = (mockOrSpy, matcherName) => {
  if (
    (mockOrSpy.calls === undefined || mockOrSpy.calls.all === undefined) &&
    mockOrSpy._isMockFunction !== true
  ) {
    throw new Error(
      `${matcherName} matcher can only be used on a spy or mock function.`,
    );
  }
};

const getActualCalls = (calls, limit) => {
  if (calls.length) {
    const count = calls.length - limit;
    return (
      `\nBut was called with:\n` +
      calls
        .slice(-limit)
        .map(call => stringify(call))
        .reverse()
        .join(',\n') +
      (count > 0
        ? `\nand ${pluralize('other call', count)}.` : '.')
    );
  } else {
    return `\nBut was not called.`;
  }
};

module.exports = spyMatchers;
