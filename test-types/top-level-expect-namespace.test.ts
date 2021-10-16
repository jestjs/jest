/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'mlh-tsd';
import {expect} from '@jest/globals';

// asymmetric matchers

expectType<void>(expect('value').toEqual(expect.any(String)));
expectError(expect(123).toEqual(expect.any()));
expectError(expect('value').toEqual(expect.not.any(Number)));

expectType<void>(expect(jest.fn()).toBeCalledWith(expect.anything()));
expectError(expect(jest.fn()).toBeCalledWith(expect.anything(true)));
expectError(expect(jest.fn()).toBeCalledWith(expect.not.anything()));

expectType<void>(expect(['A', 'B']).toEqual(expect.arrayContaining(['A'])));
expectError(expect(['A']).toEqual(expect.arrayContaining('A')));
expectError(expect(['A']).toEqual(expect.arrayContaining()));
expectType<void>(expect(['B']).toEqual(expect.not.arrayContaining(['A'])));
expectError(expect(['A']).toEqual(expect.not.arrayContaining('A')));
expectError(expect(['A']).toEqual(expect.not.arrayContaining()));

expectType<void>(expect({a: 1}).toEqual(expect.objectContaining({a: 1})));
expectError(expect({a: 1}).toEqual(expect.objectContaining(1)));
expectError(expect({a: 1}).toEqual(expect.objectContaining()));
expectType<void>(expect({b: 2}).toEqual(expect.not.objectContaining({a: 1})));
expectError(expect({a: 1}).toEqual(expect.not.objectContaining(1)));
expectError(expect({a: 1}).toEqual(expect.not.objectContaining()));

expectType<void>(expect('one').toEqual(expect.stringContaining('n')));
expectError(expect('two').toEqual(expect.stringContaining(2)));
expectError(expect('three').toEqual(expect.stringContaining()));
expectType<void>(expect('one').toEqual(expect.not.stringContaining('m')));
expectError(expect('two').toEqual(expect.not.stringContaining(2)));
expectError(expect('three').toEqual(expect.not.stringContaining()));

expectType<void>(expect('one').toEqual(expect.stringMatching(/^[No]ne/)));
expectError(expect('one').toEqual(expect.stringMatching(2)));
expectError(expect('one').toEqual(expect.stringMatching()));
expectType<void>(expect('two').toEqual(expect.not.stringMatching(/^[No]ne/)));
expectError(expect('two').toEqual(expect.not.stringMatching(1)));
expectError(expect('two').toEqual(expect.not.stringMatching()));

// chainers and utilities

expectType<void>(expect.assertions(2));
expectError(expect.assertions());

expectType<void>(expect.hasAssertions());
expectError(expect.hasAssertions(true));

expectType<Promise<void>>(
  expect(Promise.resolve('lemon')).resolves.toBe('lemon'),
);

expectType<Promise<void>>(
  expect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus'),
);

// equality and relational matchers

expectType<void>(expect(2).toBe(2));
expectType<void>(expect('three').not.toBe('four'));
expectError(expect(false).toBe());

expectType<void>(expect(0.2 + 0.1).toBeCloseTo(0.3));
expectType<void>(expect(0.2 + 0.1).toBeCloseTo(0.3, 5));
expectError(expect(0.2 + 0.1).toBeCloseTo());
expectError(expect(0.2 + 0.1).toBeCloseTo('three'));
expectError(expect(BigInt(0.2 + 0.1)).toBeCloseTo(BigInt(0.3)));
expectError(expect(0.2 + 0.1).toBeCloseTo(0.3, false));

expectType<void>(expect('value').toBeDefined());
expectError(expect(true).not.toBeDefined(false));

expectType<void>(expect(0).toBeFalsy());
expectError(expect(true).not.toBeFalsy(true));

expectType<void>(expect(10).toBeGreaterThan(5));
expectType<void>(expect(BigInt(5.65)).toBeGreaterThan(BigInt(5.61)));
expectError(expect(10).toBeGreaterThan());
expectError(expect(10).toBeGreaterThan('1'));

expectType<void>(expect(10).toBeGreaterThanOrEqual(5));
expectType<void>(expect(BigInt(5.65)).toBeGreaterThanOrEqual(BigInt(5.61)));
expectError(expect(10).toBeGreaterThanOrEqual());
expectError(expect(10).toBeGreaterThanOrEqual('1'));

expectType<void>(expect(5).toBeLessThan(10));
expectType<void>(expect(BigInt(5.61)).toBeLessThan(BigInt(5.65)));
expectError(expect(1).toBeLessThan());
expectError(expect(1).toBeLessThan('10'));

expectType<void>(expect(5).toBeLessThanOrEqual(10));
expectType<void>(expect(BigInt(5.61)).toBeLessThanOrEqual(BigInt(5.65)));
expectError(expect(1).toBeLessThanOrEqual());
expectError(expect(1).toBeLessThanOrEqual('10'));

expectType<void>(expect(() => {}).toBeInstanceOf(Function));
expectError(expect(() => {}).toBeInstanceOf());

expectType<void>(expect(Number('ten')).toBeNaN());
expectError(expect(Number('10')).not.toBeNaN(true));

expectType<void>(expect(null).toBeNull());
expectError(expect('not null').not.toBeNull(true));

expectType<void>(expect('true').toBeTruthy());
expectError(expect(false).not.toBeTruthy(true));

expectType<void>(expect(undefined).toBeUndefined());
expectError(expect('value').not.toBeUndefined(false));

expectType<void>(expect(['lemon', 'lime']).not.toContain('orange'));
expectType<void>(expect('citrus fruits').toContain('fruit'));

const a = {key1: true, key2: false};
expectType<void>(expect([{key1: true, key2: false}]).toContainEqual(a));

expectType<void>(expect({a: 1, b: undefined}).toEqual({a: 1}));
expectError(expect({a: 1}).toEqual());

expectType<void>(expect({a: 1, b: 2}).toStrictEqual({a: 1, b: 2}));
expectError(expect({a: 1}).toStrictEqual());

expectType<void>(expect([1, 2, 3]).toHaveLength(3));
expectType<void>(expect('abc').not.toHaveLength(5));
expectError(expect('abc').toHaveLength());

expectType<void>(
  expect({kitchen: {area: 20}}).toHaveProperty('kitchen.area', 20),
);
expectType<void>(
  expect({kitchen: {area: 20}}).not.toHaveProperty(['kitchen', 'color']),
);
expectError(expect({kitchen: {area: 20}}).toHaveProperty());
expectError(expect({kitchen: {area: 20}}).toHaveProperty(true));

expectType<void>(expect('grapefruits').toMatch(/fruit/));
expectType<void>(expect('grapefruits').toMatch('fruit'));
expectError(expect('grapefruits').toMatch(true));

expectType<void>(expect({a: 1, b: 2}).toMatchObject({b: 2}));
expectType<void>(
  expect([{a: 1}, {b: 2, c: true}]).toMatchObject([{a: 1}, {b: 2}]),
);
expectError(expect({c: true}).toMatchObject(true));
expectError(expect({c: true}).toMatchObject());

// error matchers

expectType<void>(expect(() => {}).toThrow());
expectType<void>(expect(() => {}).toThrow(/error/));
expectType<void>(expect(() => {}).toThrow('error'));
expectType<void>(expect(() => {}).toThrow(Error));
expectType<void>(expect(() => {}).toThrow(new Error('error')));

expectType<void>(expect(() => {}).toThrowError());
expectType<void>(expect(() => {}).toThrowError(/error/));
expectType<void>(expect(() => {}).toThrowError('error'));
expectType<void>(expect(() => {}).toThrowError(Error));
expectType<void>(expect(() => {}).toThrowError(new Error('error')));

// mock matchers

expectType<void>(expect(jest.fn()).toBeCalled());
expectError(expect(jest.fn()).toBeCalled('value'));
expectType<void>(expect(jest.fn()).toHaveBeenCalled());
expectError(expect(jest.fn()).toHaveBeenCalled(false));

expectType<void>(expect(jest.fn()).toBeCalledTimes(1));
expectError(expect(jest.fn()).toBeCalledTimes('twice'));
expectError(expect(jest.fn()).toBeCalledTimes());
expectType<void>(expect(jest.fn()).toHaveBeenCalledTimes(3));
expectError(expect(jest.fn()).toHaveBeenCalledTimes(true));
expectError(expect(jest.fn()).toHaveBeenCalledTimes());

expectType<void>(expect(jest.fn()).toBeCalledWith('value'));
expectType<void>(expect(jest.fn()).toBeCalledWith('value', 123));
// expectError(expect(jest.fn()).toBeCalledWith());
expectType<void>(expect(jest.fn()).toHaveBeenCalledWith(123));
expectType<void>(expect(jest.fn()).toHaveBeenCalledWith(123, 'value'));
// expectError(expect(jest.fn()).toHaveBeenCalledWith());

expectType<void>(expect(jest.fn()).lastCalledWith('value'));
expectType<void>(expect(jest.fn()).lastCalledWith('value', 123));
// expectError(expect(jest.fn()).lastCalledWith());
expectType<void>(expect(jest.fn()).toHaveBeenLastCalledWith(123));
expectType<void>(expect(jest.fn()).toHaveBeenLastCalledWith(123, 'value'));
// expectError(expect(jest.fn()).toHaveBeenLastCalledWith());

expectType<void>(expect(jest.fn()).nthCalledWith(1, 'value'));
expectType<void>(expect(jest.fn()).nthCalledWith(1, 'value', 123));
// expectError(expect(jest.fn()).nthCalledWith());
// expectError(expect(jest.fn()).nthCalledWith(2));
expectType<void>(expect(jest.fn()).toHaveBeenNthCalledWith(1, 'value'));
expectType<void>(expect(jest.fn()).toHaveBeenNthCalledWith(1, 'value', 123));
// expectError(expect(jest.fn()).toHaveBeenNthCalledWith());
// expectError(expect(jest.fn()).toHaveBeenNthCalledWith(2));

expectType<void>(expect(jest.fn()).toReturn());
expectError(expect(jest.fn()).toReturn('value'));
expectType<void>(expect(jest.fn()).toHaveReturned());
expectError(expect(jest.fn()).toHaveReturned(false));

expectType<void>(expect(jest.fn()).toReturnTimes(1));
expectError(expect(jest.fn()).toReturnTimes('twice'));
expectError(expect(jest.fn()).toReturnTimes());
expectType<void>(expect(jest.fn()).toHaveReturnedTimes(3));
expectError(expect(jest.fn()).toHaveReturnedTimes(true));
expectError(expect(jest.fn()).toHaveReturnedTimes());

expectType<void>(expect(jest.fn()).toReturnWith('value'));
expectError(expect(jest.fn()).toReturnWith());
expectType<void>(expect(jest.fn()).toHaveReturnedWith(123));
expectError(expect(jest.fn()).toHaveReturnedWith());

expectType<void>(expect(jest.fn()).lastReturnedWith('value'));
expectError(expect(jest.fn()).lastReturnedWith());
expectType<void>(expect(jest.fn()).toHaveLastReturnedWith(123));
expectError(expect(jest.fn()).toHaveLastReturnedWith());

expectType<void>(expect(jest.fn()).nthReturnedWith(1, 'value'));
expectError(expect(jest.fn()).nthReturnedWith());
expectError(expect(jest.fn()).nthReturnedWith(2));
expectType<void>(expect(jest.fn()).toHaveNthReturnedWith(1, 'value'));
expectError(expect(jest.fn()).toHaveNthReturnedWith());
expectError(expect(jest.fn()).toHaveNthReturnedWith(2));

// snapshot matchers

expectType<void>(expect({a: 1}).toMatchSnapshot());
expectType<void>(expect({a: 1}).toMatchSnapshot('hint'));
expectError(expect({a: 1}).toMatchSnapshot(true));

expectType<void>(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot({
    date: expect.any(Date),
    name: expect.any(String),
  }),
);

expectType<void>(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot(
    {
      date: expect.any(Date),
      name: expect.any(String),
    },
    'hint',
  ),
);

expectError(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot({
    date: expect.any(Date),
    time: expect.any(Date),
  }),
);

expectType<void>(expect('abc').toMatchInlineSnapshot());
expectType<void>(expect('abc').toMatchInlineSnapshot('inline snapshot here'));
expectError(expect('abc').toMatchInlineSnapshot(true));

expectType<void>(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot({
    date: expect.any(Date),
    name: expect.any(String),
  }),
);

expectType<void>(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot(
    {
      date: expect.any(Date),
      name: expect.any(String),
    },
    'inline snapshot here',
  ),
);

expectError(
  expect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot({
    date: expect.any(Date),
    time: expect.any(Date),
  }),
);

expectType<void>(expect(jest.fn()).toThrowErrorMatchingSnapshot());
expectType<void>(expect(jest.fn()).toThrowErrorMatchingSnapshot('hint'));
expectError(expect(jest.fn()).toThrowErrorMatchingSnapshot(true));

expectType<void>(expect(jest.fn()).toThrowErrorMatchingInlineSnapshot());
expectType<void>(
  expect(jest.fn()).toThrowErrorMatchingInlineSnapshot('inline snapshot here'),
);
expectError(expect(jest.fn()).toThrowErrorMatchingInlineSnapshot(true));

// extend

expectType<void>(
  expect.extend({
    toBeDivisibleBy(actual: number, expected: number) {
      expectType<boolean>(this.isNot);

      const pass = actual % expected === 0;
      const message = pass
        ? () =>
            `expected ${this.utils.printReceived(
              actual,
            )} not to be divisible by ${expected}`
        : () =>
            `expected ${this.utils.printReceived(
              actual,
            )} to be divisible by ${expected}`;

      return {message, pass};
    },
  }),
);

// TODO
// expect(4).toBeDivisibleBy(2);
// expect.toBeDivisibleBy(2);
