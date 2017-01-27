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

const jestExpect = require('../');

[
  ['toHaveBeenCalled', 'jasmine.createSpy'],
  ['toHaveBeenCalled', 'jest.fn'],
  ['toBeCalled', 'jasmine.createSpy'],
  ['toBeCalled', 'jest.fn'],
].forEach(([called, mockName]) => {
  test(`${called} works with ${mockName}`, () => {
    const fn = mockName === 'jest.fn' ? jest.fn() : jasmine.createSpy('fn');

    jestExpect(fn).not[called]();
    expect(() => jestExpect(fn)[called]())
      .toThrowErrorMatchingSnapshot();

    fn();
    jestExpect(fn)[called]();
    expect(() => jestExpect(fn).not[called]())
      .toThrowErrorMatchingSnapshot();

    expect(() => jestExpect(fn)[called](555))
      .toThrowErrorMatchingSnapshot();
  });
});

describe('toHaveBeenCalledTimes', () => {
  it('accepts only numbers', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    jestExpect(fn).toHaveBeenCalledTimes(1);

    [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
      expect(() => jestExpect(fn).toHaveBeenCalledTimes(value))
        .toThrowErrorMatchingSnapshot();
    });
  });

  it('verifies that actual is a Spy', () => {
    const fn = function fn() {};

    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowErrorMatchingSnapshot();
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
      .toThrowErrorMatchingSnapshot();
  });

  it('fails if function called more than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(3);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowErrorMatchingSnapshot();
  });

  it('fails if function called less than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(1);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    expect(() => jestExpect(fn).toHaveBeenCalledTimes(2))
      .toThrowErrorMatchingSnapshot();
  });
});

describe('toBeCalled*', () => {

  it(`fails when called-times shortcuts receive expected value`, () => {
    const fn = jasmine.createSpy('fn');

    ['toBeCalledOnce',
      'toBeCalledTwice',
      'toBeCalledThrice',
      'toBeCalledFourTimes'].forEach(matcherName =>
      expect(() => jestExpect(fn)[matcherName](1))
        .toThrowErrorMatchingSnapshot());
  });

  it(`passes when calls count match shortcut`, () => {
    ['toBeCalledOnce',
      'toBeCalledTwice',
      'toBeCalledThrice',
      'toBeCalledFourTimes'].forEach((matcherName, matcherIndx) => {

        matcherIndx += 1;
        const fn = jasmine.createSpy('fn');

        for (let i = 0; i < matcherIndx; i++) {
          fn();
        }

        jestExpect(fn)[matcherName]();
      });
  });
});

[
  'lastCalledWith',
  'toBeCalled',
  'toBeCalledWith',
  'toHaveBeenCalled',
  'toHaveBeenCalledWith',
  'toHaveBeenLastCalledWith',
].forEach(calledWith => {
  test(`${calledWith} works only on spies or jest.fn`, () => {
    const fn = function fn() {};

    expect(() => jestExpect(fn)[calledWith]())
      .toThrowErrorMatchingSnapshot();
  });
});


[
  ['lastCalledWith', 'jest.fn'],
  ['toBeCalledWith', 'jest.fn'],
  ['toHaveBeenCalledWith', 'jasmine.createSpy'],
  ['toHaveBeenCalledWith', 'jest.fn'],
  ['toHaveBeenLastCalledWith', 'jasmine.createSpy'],
  ['toHaveBeenLastCalledWith', 'jest.fn'],
].forEach(([calledWith, mockName]) => {
  const getFunction = () => {
    return mockName === 'jest.fn' ? jest.fn() : jasmine.createSpy('fn');
  };

  test(`${calledWith} works with ${mockName} when not called`, () => {
    const fn = getFunction();
    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() => jestExpect(fn)[calledWith]('foo', 'bar'))
      .toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with ${mockName} and no arguments`, () => {
    const fn = getFunction();
    fn();
    jestExpect(fn)[calledWith]();
  });

  test(`${calledWith} works with ${mockName} and arguments that don't match`, () => {
    const fn = getFunction();
    fn('foo', 'bar1');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() => jestExpect(fn)[calledWith]('foo', 'bar'))
      .toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with ${mockName} and arguments that match`, () => {
    const fn = getFunction();
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    expect(() => jestExpect(fn).not[calledWith]('foo', 'bar'))
      .toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with ${mockName} and many arguments that don't match`, () => {
    const fn = getFunction();
    fn('foo', 'bar1');
    fn('foo', 'bar2');
    fn('foo', 'bar3');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() => jestExpect(fn)[calledWith]('foo', 'bar'))
      .toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with ${mockName} and many arguments`, () => {
    const fn = getFunction();
    fn('foo1', 'bar');
    fn('foo', 'bar1');
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    expect(() => jestExpect(fn).not[calledWith]('foo', 'bar'))
      .toThrowErrorMatchingSnapshot();
  });
});
