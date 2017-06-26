/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const jestExpect = require('../');

['toHaveBeenCalled', 'toBeCalled'].forEach(called => {
  test(`${called} works with jest.fn`, () => {
    const fn = jest.fn();

    jestExpect(fn).not[called]();
    expect(() => jestExpect(fn)[called]()).toThrowErrorMatchingSnapshot();

    fn();
    jestExpect(fn)[called]();
    expect(() => jestExpect(fn).not[called]()).toThrowErrorMatchingSnapshot();

    expect(() => jestExpect(fn)[called](555)).toThrowErrorMatchingSnapshot();
  });
});

describe('toHaveBeenCalledTimes', () => {
  it('accepts only numbers', () => {
    const fn = jest.fn();
    fn();
    jestExpect(fn).toHaveBeenCalledTimes(1);

    [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
      expect(() =>
        jestExpect(fn).toHaveBeenCalledTimes(value),
      ).toThrowErrorMatchingSnapshot();
    });
  });

  it('verifies that actual is a Spy', () => {
    const fn = function fn() {};

    expect(() =>
      jestExpect(fn).toHaveBeenCalledTimes(2),
    ).toThrowErrorMatchingSnapshot();
  });

  it('passes if function called equal to expected times', () => {
    const fn = jest.fn();
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(2);

    expect(() =>
      jestExpect(fn).not.toHaveBeenCalledTimes(2),
    ).toThrowErrorMatchingSnapshot();
  });

  it('fails if function called more than expected times', () => {
    const fn = jest.fn();
    fn();
    fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(3);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    expect(() =>
      jestExpect(fn).toHaveBeenCalledTimes(2),
    ).toThrowErrorMatchingSnapshot();
  });

  it('fails if function called less than expected times', () => {
    const fn = jest.fn();
    fn();

    jestExpect(fn).toHaveBeenCalledTimes(1);
    jestExpect(fn).not.toHaveBeenCalledTimes(2);

    expect(() =>
      jestExpect(fn).toHaveBeenCalledTimes(2),
    ).toThrowErrorMatchingSnapshot();
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

    expect(() => jestExpect(fn)[calledWith]()).toThrowErrorMatchingSnapshot();
  });
});

[
  'lastCalledWith',
  'toHaveBeenCalledWith',
  'toHaveBeenLastCalledWith',
].forEach(calledWith => {
  test(`${calledWith} works when not called`, () => {
    const fn = jest.fn();
    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() =>
      jestExpect(fn)[calledWith]('foo', 'bar'),
    ).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with no arguments`, () => {
    const fn = jest.fn();
    fn();
    jestExpect(fn)[calledWith]();
  });

  test(`${calledWith} works with arguments that don't match`, () => {
    const fn = jest.fn();
    fn('foo', 'bar1');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() =>
      jestExpect(fn)[calledWith]('foo', 'bar'),
    ).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with arguments that match`, () => {
    const fn = jest.fn();
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    expect(() =>
      jestExpect(fn).not[calledWith]('foo', 'bar'),
    ).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with many arguments that don't match`, () => {
    const fn = jest.fn();
    fn('foo', 'bar1');
    fn('foo', 'bar2');
    fn('foo', 'bar3');

    jestExpect(fn).not[calledWith]('foo', 'bar');

    expect(() =>
      jestExpect(fn)[calledWith]('foo', 'bar'),
    ).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with many arguments`, () => {
    const fn = jest.fn();
    fn('foo1', 'bar');
    fn('foo', 'bar1');
    fn('foo', 'bar');

    jestExpect(fn)[calledWith]('foo', 'bar');

    expect(() =>
      jestExpect(fn).not[calledWith]('foo', 'bar'),
    ).toThrowErrorMatchingSnapshot();
  });
});
