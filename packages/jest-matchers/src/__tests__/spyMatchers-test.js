/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
/* eslint-disable max-len */
'use strict';

const jestExpect = require('../').expect;

[
  ['toHaveBeenCalled', 'jasmine.createSpy'],
  ['toHaveBeenCalled', 'jest.fn'],
  ['toBeCalled', 'jasmine.createSpy'],
  ['toBeCalled', 'jest.fn'],
].forEach(([matcherName, mockName]) => {
  test(`${matcherName} works with ${mockName}`, () => {
    const fn = mockName === 'jest.fn' ? jest.fn() : jasmine.createSpy('fn');
    let error;

    jestExpect(fn).not[matcherName]();

    try {
      jestExpect(fn)[matcherName]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();

    error = undefined;
    fn();

    jestExpect(fn)[matcherName]();

    try {
      jestExpect(fn).not[matcherName]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();

    error = undefined;

    try {
      jestExpect(fn)[matcherName](555);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });
});

['toHaveBeenCalled', 'toBeCalled'].forEach(matcherName => {
  test(`${matcherName} works only on spies or jest.fn`, () => {
    let error;
    const fn = () => {};

    try {
      jestExpect(fn)[matcherName]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });
});

describe('.toHaveBeenCalledTimes()', () => {
  it('accepts only numbers', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    jestExpect(fn).toHaveBeenCalledTimes(1);

    [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
      expect(() => jestExpect(fn).toHaveBeenCalledTimes(value))
        .toThrowError(
          /toHaveBeenCalledTimes expected value should be a number/);
    });
  });

  it('verifies that actual is a Spy', () => {
    const fn = () => {};

    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowError(/toHaveBeenCalledTimes matcher can only be used on a spy or mock function/);
  });

  it('works both for Mock functions and Spies', () => {
    [jasmine.createSpy('fn'), jest.fn()].forEach(fn => {
      fn();
      fn();
      jestExpect(fn).toHaveBeenCalledTimes(2);
    });
  });

  it('passes if function called equal to expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(2);
    expect(() => jestExpect(fn).not.toHaveBeenCalledTimes(2))
      .toThrowError(/spy not to be called 2 times, but it was called 2 times/);
  });

  it('fails if function called more than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(3);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);
    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowError(/spy to be called 2 times, but it was called 3 times/);
  });

  it('fails if function called less than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(1);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);
    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowError(/spy to be called 2 times, but it was called 1 time/);
  });
});
