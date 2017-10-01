/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Immutable = require('immutable');
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

  test(`${calledWith} works with Map`, () => {
    const fn = jest.fn();

    const m1 = new Map([[1, 2], [2, 1]]);
    const m2 = new Map([[1, 2], [2, 1]]);
    const m3 = new Map([['a', 'b'], ['b', 'a']]);

    fn(m1);

    jestExpect(fn)[calledWith](m2);
    jestExpect(fn).not[calledWith](m3);

    expect(() =>
      jestExpect(fn).not[calledWith](m2),
    ).toThrowErrorMatchingSnapshot();
    expect(() => jestExpect(fn)[calledWith](m3)).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with Set`, () => {
    const fn = jest.fn();

    const s1 = new Set([1, 2]);
    const s2 = new Set([1, 2]);
    const s3 = new Set([3, 4]);

    fn(s1);

    jestExpect(fn)[calledWith](s2);
    jestExpect(fn).not[calledWith](s3);

    expect(() =>
      jestExpect(fn).not[calledWith](s2),
    ).toThrowErrorMatchingSnapshot();
    expect(() => jestExpect(fn)[calledWith](s3)).toThrowErrorMatchingSnapshot();
  });

  test(`${calledWith} works with Immutable.js objects`, () => {
    const fn = jest.fn();
    const directlyCreated = new Immutable.Map([['a', {b: 'c'}]]);
    const indirectlyCreated = new Immutable.Map().set('a', {b: 'c'});
    fn(directlyCreated, indirectlyCreated);

    jestExpect(fn)[calledWith](indirectlyCreated, directlyCreated);

    expect(() =>
      jestExpect(fn).not[calledWith](indirectlyCreated, directlyCreated),
    ).toThrowErrorMatchingSnapshot();
  });
});
