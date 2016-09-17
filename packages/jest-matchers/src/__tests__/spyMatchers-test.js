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
].forEach(([called, mockName]) => {
  test(`${called} works with ${mockName}`, () => {
    const fn = mockName === 'jest.fn' ? jest.fn() : jasmine.createSpy('fn');
    let error;

    jestExpect(fn).not[called]();

    try {
      jestExpect(fn)[called]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();

    error = undefined;
    fn();

    jestExpect(fn)[called]();

    try {
      jestExpect(fn).not[called]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();

    error = undefined;

    try {
      jestExpect(fn)[called](555);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });
});

describe('toHaveBeenCalledTimes', () => {
  it('accepts only numbers', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    jestExpect(fn).toHaveBeenCalledTimes(1);

    [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
      let error;
      try {
        jestExpect(fn).toHaveBeenCalledTimes(value);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error).toMatchSnapshot();
    });
  });

  it('verifies that actual is a Spy', () => {
    const fn = () => {};

    let error;
    try {
      jestExpect(fn).toHaveBeenCalledTimes(2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
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

    let error;
    try {
      jestExpect(fn).not.toHaveBeenCalledTimes(2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  it('fails if function called more than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(3);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    let error;
    try {
      jestExpect(fn).toHaveBeenCalledTimes(2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  it('fails if function called less than expected times', () => {
    const fn = jasmine.createSpy('fn');
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(1);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    let error;
    try {
      jestExpect(fn).toHaveBeenCalledTimes(2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
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
    let error;
    const fn = () => {};

    try {
      jestExpect(fn)[calledWith]();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
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
  test(`${calledWith} works with ${mockName} and no arguments`, () => {
    let error;
    const fn = getFunction();
    jestExpect(fn).not[calledWith]('foo', 'bar');

    try {
      jestExpect(fn)[calledWith]('foo', 'bar');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  test(`${calledWith} works with ${mockName} and arguments that don't match`, () => {
    let error;
    const fn = getFunction();
    fn('foo', 'bar1');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    try {
      jestExpect(fn)[calledWith]('foo', 'bar');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  test(`${calledWith} works with ${mockName} and arguments that match`, () => {
    let error;
    const fn = getFunction();
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    try {
      jestExpect(fn).not[calledWith]('foo', 'bar');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  test(`${calledWith} works with ${mockName} and many arguments that don't match`, () => {
    let error;
    const fn = getFunction();
    fn('foo', 'bar1');
    fn('foo', 'bar2');
    fn('foo', 'bar3');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    try {
      jestExpect(fn)[calledWith]('foo', 'bar');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });

  test(`${calledWith} works with ${mockName} and many arguments`, () => {
    let error;
    const fn = getFunction();
    fn('foo1', 'bar');
    fn('foo', 'bar1');
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    try {
      jestExpect(fn).not[calledWith]('foo', 'bar');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error).toMatchSnapshot();
  });
});
