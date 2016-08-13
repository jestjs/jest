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

const jestExpect = require('../').expect;

describe('.toHaveBeenCalled() .toBeCalled()', () => {
  ['toHaveBeenCalled', 'toBeCalled'].forEach((matcherName) => {
    it('does not accept arguments', () => {
      [jasmine.createSpy('foo'), jest.fn()].forEach((foo) => {
        expect(() => jestExpect(foo)[matcherName](5))
          .toThrowError(/(toHaveBeenCalled|toBeCalled) matcher does not accept any arguments/);
      });
    });

    it('verifies that actual is a Spy', () => {
      const foo = () => {};

      expect(() => jestExpect(foo)[matcherName]())
        .toThrowError(/(toHaveBeenCalled|toBeCalled) matcher can only execute on a Spy/);
    });

    it('passes if function called', () => {
      [jasmine.createSpy('foo'), jest.fn()].forEach((foo) => {
        foo();

        jestExpect(foo).toHaveBeenCalled();
        expect(() => jestExpect(foo).not[matcherName]())
          .toThrowError(/a (mock|spy) to not be called, but it was called 1 times/);
      });
    });

    it(`fails if function hasn't called`, () => {
      [jasmine.createSpy('foo'), jest.fn()].forEach((foo) => {
        jestExpect(foo).not.toHaveBeenCalled();
        expect(() => jestExpect(foo)[matcherName]())
          .toThrowError(/expected a (mock|spy) to be called but it wasn't/);
      });
    });
  });
});

describe('.toHaveBeenCalledTimes()', () => {
  it('accept only numbers', () => {
    const foo = jasmine.createSpy('foo');
    foo();
    jestExpect(foo).toHaveBeenCalledTimes(1);

    [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
      expect(() => jestExpect(foo).toHaveBeenCalledTimes(value))
        .toThrowError(
          /toHaveBeenCalledTimes expected value should be a number/);
    });
  });

  it('verifies that actual is a Spy', () => {
    const foo = () => {};

    expect(() => jestExpect(foo).toHaveBeenCalledTimes(2))
      .toThrowError(/toHaveBeenCalledTimes matcher can only execute on a Spy/);
  });

  it('passes if function called equal to expected times', () => {
    const foo = jasmine.createSpy('foo');
    foo();
    foo();

    jestExpect(foo).toHaveBeenCalledTimes(2);
    expect(() => jestExpect(foo).not.toHaveBeenCalledTimes(2))
      .toThrowError(/spy to not be called 2 times, but it was called 2 times/);
  });

  it('fails if function called more than expected times', () => {
    const foo = jasmine.createSpy('foo');
    foo();
    foo();
    foo();

    jestExpect(foo).not.toHaveBeenCalledTimes(2);
    expect(() => jestExpect(foo).toHaveBeenCalledTimes(2))
      .toThrowError(/spy to be called 2 times, but it was called 3 times/);
  });

  it('fails if function called less than expected times', () => {
    const foo = jasmine.createSpy('foo');
    foo();

    jestExpect(foo).not.toHaveBeenCalledTimes(2);
    expect(() => jestExpect(foo).toHaveBeenCalledTimes(2))
      .toThrowError(/spy to be called 2 times, but it was called 1 times/);
  });
});
