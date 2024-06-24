/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import type {EqualsFunction, Tester} from '@jest/expect-utils';
import {jest, expect as jestExpect} from '@jest/globals';
import type * as jestMatcherUtils from 'jest-matcher-utils';

// asymmetric matchers

expect(jestExpect('value').toEqual(jestExpect.any(String))).type.toBeVoid();
expect(jestExpect(123).toEqual(jestExpect.any())).type.toRaiseError();
expect(jestExpect.not).type.not.toHaveProperty('any');

expect(jestExpect.not).type.not.toHaveProperty('anything');

expect(
  jestExpect(['A', 'B']).toEqual(jestExpect.arrayContaining(['A'])),
).type.toBeVoid();
expect(
  jestExpect(['A']).toEqual(jestExpect.arrayContaining('A')),
).type.toRaiseError();
expect(
  jestExpect(['A']).toEqual(jestExpect.arrayContaining()),
).type.toRaiseError();
expect(
  jestExpect(['B']).toEqual(jestExpect.not.arrayContaining(['A'])),
).type.toBeVoid();
expect(
  jestExpect(['A']).toEqual(jestExpect.not.arrayContaining('A')),
).type.toRaiseError();
expect(
  jestExpect(['A']).toEqual(jestExpect.not.arrayContaining()),
).type.toRaiseError();

expect(jestExpect(0.1 + 0.2).toEqual(jestExpect.closeTo(0.3))).type.toBeVoid();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.closeTo(0.3, 5)),
).type.toBeVoid();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.closeTo('three')),
).type.toRaiseError();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.closeTo(0.3, false)),
).type.toRaiseError();
expect(jestExpect(0.1 + 0.2).toEqual(jestExpect.closeTo())).type.toRaiseError();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.not.closeTo(0.3)),
).type.toBeVoid();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.not.closeTo(0.3, 5)),
).type.toBeVoid();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.not.closeTo('three')),
).type.toRaiseError();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.not.closeTo(0.3, false)),
).type.toRaiseError();
expect(
  jestExpect(0.1 + 0.2).toEqual(jestExpect.not.closeTo()),
).type.toRaiseError();

expect(
  jestExpect({a: 1}).toEqual(jestExpect.objectContaining({a: 1})),
).type.toBeVoid();
expect(
  jestExpect({a: 1}).toEqual(jestExpect.objectContaining(1)),
).type.toRaiseError();
expect(
  jestExpect({a: 1}).toEqual(jestExpect.objectContaining()),
).type.toRaiseError();
expect(
  jestExpect({b: 2}).toEqual(jestExpect.not.objectContaining({a: 1})),
).type.toBeVoid();
expect(
  jestExpect({a: 1}).toEqual(jestExpect.not.objectContaining(1)),
).type.toRaiseError();
expect(
  jestExpect({a: 1}).toEqual(jestExpect.not.objectContaining()),
).type.toRaiseError();

expect(
  jestExpect('one').toEqual(jestExpect.stringContaining('n')),
).type.toBeVoid();
expect(
  jestExpect('two').toEqual(jestExpect.stringContaining(2)),
).type.toRaiseError();
expect(
  jestExpect('three').toEqual(jestExpect.stringContaining()),
).type.toRaiseError();
expect(
  jestExpect('one').toEqual(jestExpect.not.stringContaining('m')),
).type.toBeVoid();
expect(
  jestExpect('two').toEqual(jestExpect.not.stringContaining(2)),
).type.toRaiseError();
expect(
  jestExpect('three').toEqual(jestExpect.not.stringContaining()),
).type.toRaiseError();

expect(
  jestExpect('one').toEqual(jestExpect.stringMatching(/^[No]ne/)),
).type.toBeVoid();
expect(
  jestExpect('one').toEqual(jestExpect.stringMatching(2)),
).type.toRaiseError();
expect(
  jestExpect('one').toEqual(jestExpect.stringMatching()),
).type.toRaiseError();
expect(
  jestExpect('two').toEqual(jestExpect.not.stringMatching(/^[No]ne/)),
).type.toBeVoid();
expect(
  jestExpect('two').toEqual(jestExpect.not.stringMatching(1)),
).type.toRaiseError();
expect(
  jestExpect('two').toEqual(jestExpect.not.stringMatching()),
).type.toRaiseError();

// modifiers and utilities

expect(jestExpect.assertions(2)).type.toBeVoid();
expect(jestExpect.assertions()).type.toRaiseError();

expect(jestExpect.hasAssertions()).type.toBeVoid();
expect(jestExpect.hasAssertions(true)).type.toRaiseError();

expect(jestExpect(Promise.resolve('lemon')).resolves.toBe('lemon')).type.toBe<
  Promise<void>
>();

expect(
  jestExpect(Promise.resolve('lemon')).resolves.not.toBe('lemon'),
).type.toBe<Promise<void>>();

expect(
  jestExpect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus'),
).type.toBe<Promise<void>>();

expect(
  jestExpect(Promise.reject(new Error('octopus'))).rejects.not.toThrow(
    'octopus',
  ),
).type.toBe<Promise<void>>();

expect(jestExpect(1).not).type.not.toHaveProperty('not');
expect(jestExpect(1).not).type.not.toHaveProperty('resolves');
expect(jestExpect(1).not).type.not.toHaveProperty('rejects');

expect(jestExpect(1).resolves).type.not.toHaveProperty('resolves');
expect(jestExpect(1).resolves).type.not.toHaveProperty('rejects');

expect(jestExpect(1).resolves.not).type.not.toHaveProperty('not');
expect(jestExpect(1).resolves.not).type.not.toHaveProperty('resolves');
expect(jestExpect(1).resolves.not).type.not.toHaveProperty('rejects');

expect(jestExpect(1).rejects).type.not.toHaveProperty('resolves');
expect(jestExpect(1).rejects).type.not.toHaveProperty('rejects');

expect(jestExpect(1).rejects.not).type.not.toHaveProperty('not');
expect(jestExpect(1).rejects.not).type.not.toHaveProperty('resolves');
expect(jestExpect(1).rejects.not).type.not.toHaveProperty('rejects');

// equality and relational matchers

expect(jestExpect(2).toBe(2)).type.toBeVoid();
expect(jestExpect('three').not.toBe('four')).type.toBeVoid();
expect(jestExpect(false).toBe()).type.toRaiseError();

expect(jestExpect(0.2 + 0.1).toBeCloseTo(0.3)).type.toBeVoid();
expect(jestExpect(0.2 + 0.1).toBeCloseTo(0.3, 5)).type.toBeVoid();
expect(jestExpect(0.2 + 0.1).toBeCloseTo()).type.toRaiseError();
expect(jestExpect(0.2 + 0.1).toBeCloseTo('three')).type.toRaiseError();
expect(
  jestExpect(BigInt(0.2 + 0.1)).toBeCloseTo(BigInt(0.3)),
).type.toRaiseError();
expect(jestExpect(0.2 + 0.1).toBeCloseTo(0.3, false)).type.toRaiseError();

expect(jestExpect('value').toBeDefined()).type.toBeVoid();
expect(jestExpect(true).not.toBeDefined(false)).type.toRaiseError();

expect(jestExpect(0).toBeFalsy()).type.toBeVoid();
expect(jestExpect(true).not.toBeFalsy(true)).type.toRaiseError();

expect(jestExpect(10).toBeGreaterThan(5)).type.toBeVoid();
expect(jestExpect(BigInt(5.65)).toBeGreaterThan(BigInt(5.61))).type.toBeVoid();
expect(jestExpect(10).toBeGreaterThan()).type.toRaiseError();
expect(jestExpect(10).toBeGreaterThan('1')).type.toRaiseError();

expect(jestExpect(10).toBeGreaterThanOrEqual(5)).type.toBeVoid();
expect(
  jestExpect(BigInt(5.65)).toBeGreaterThanOrEqual(BigInt(5.61)),
).type.toBeVoid();
expect(jestExpect(10).toBeGreaterThanOrEqual()).type.toRaiseError();
expect(jestExpect(10).toBeGreaterThanOrEqual('1')).type.toRaiseError();

expect(jestExpect(5).toBeLessThan(10)).type.toBeVoid();
expect(jestExpect(BigInt(5.61)).toBeLessThan(BigInt(5.65))).type.toBeVoid();
expect(jestExpect(1).toBeLessThan()).type.toRaiseError();
expect(jestExpect(1).toBeLessThan('10')).type.toRaiseError();

expect(jestExpect(5).toBeLessThanOrEqual(10)).type.toBeVoid();
expect(
  jestExpect(BigInt(5.61)).toBeLessThanOrEqual(BigInt(5.65)),
).type.toBeVoid();
expect(jestExpect(1).toBeLessThanOrEqual()).type.toRaiseError();
expect(jestExpect(1).toBeLessThanOrEqual('10')).type.toRaiseError();

expect(jestExpect(() => {}).toBeInstanceOf(Function)).type.toBeVoid();
expect(jestExpect(() => {}).toBeInstanceOf()).type.toRaiseError();

expect(jestExpect(Number('ten')).toBeNaN()).type.toBeVoid();
expect(jestExpect(Number('10')).not.toBeNaN(true)).type.toRaiseError();

expect(jestExpect(null).toBeNull()).type.toBeVoid();
expect(jestExpect('not null').not.toBeNull(true)).type.toRaiseError();

expect(jestExpect('true').toBeTruthy()).type.toBeVoid();
expect(jestExpect(false).not.toBeTruthy(true)).type.toRaiseError();

expect(jestExpect(undefined).toBeUndefined()).type.toBeVoid();
expect(jestExpect('value').not.toBeUndefined(false)).type.toRaiseError();

expect(jestExpect(['lemon', 'lime']).not.toContain('orange')).type.toBeVoid();
expect(jestExpect('citrus fruits').toContain('fruit')).type.toBeVoid();

const a = {key1: true, key2: false};
expect(
  jestExpect([{key1: true, key2: false}]).toContainEqual(a),
).type.toBeVoid();

expect(jestExpect({a: 1, b: undefined}).toEqual({a: 1})).type.toBeVoid();
expect(jestExpect({a: 1}).toEqual()).type.toRaiseError();

expect(jestExpect({a: 1, b: 2}).toStrictEqual({a: 1, b: 2})).type.toBeVoid();
expect(jestExpect({a: 1}).toStrictEqual()).type.toRaiseError();

expect(jestExpect([1, 2, 3]).toHaveLength(3)).type.toBeVoid();
expect(jestExpect('abc').not.toHaveLength(5)).type.toBeVoid();
expect(jestExpect('abc').toHaveLength()).type.toRaiseError();

expect(
  jestExpect({kitchen: {area: 20}}).toHaveProperty('kitchen.area', 20),
).type.toBeVoid();
expect(
  jestExpect({kitchen: {area: 20}}).not.toHaveProperty(['kitchen', 'color']),
).type.toBeVoid();
expect(jestExpect({kitchen: {area: 20}}).toHaveProperty()).type.toRaiseError();
expect(
  jestExpect({kitchen: {area: 20}}).toHaveProperty(true),
).type.toRaiseError();

expect(jestExpect('grapefruits').toMatch(/fruit/)).type.toBeVoid();
expect(jestExpect('grapefruits').toMatch('fruit')).type.toBeVoid();
expect(jestExpect('grapefruits').toMatch(true)).type.toRaiseError();

expect(jestExpect({a: 1, b: 2}).toMatchObject({b: 2})).type.toBeVoid();
expect(
  jestExpect([{a: 1}, {b: 2, c: true}]).toMatchObject([{a: 1}, {b: 2}]),
).type.toBeVoid();
expect(jestExpect({c: true}).toMatchObject(true)).type.toRaiseError();
expect(jestExpect({c: true}).toMatchObject()).type.toRaiseError();

// error matchers

expect(jestExpect(() => {}).toThrow()).type.toBeVoid();
expect(jestExpect(() => {}).toThrow(/error/)).type.toBeVoid();
expect(jestExpect(() => {}).toThrow('error')).type.toBeVoid();
expect(jestExpect(() => {}).toThrow(Error)).type.toBeVoid();
expect(jestExpect(() => {}).toThrow(new Error('error'))).type.toBeVoid();

// mock matchers
expect(jestExpect(jest.fn()).toHaveBeenCalled()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenCalled(false)).type.toRaiseError();
expect(jestExpect(jest.fn()).toHaveBeenCalled('value')).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveBeenCalledTimes(3)).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenCalledTimes(true)).type.toRaiseError();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledTimes('twice'),
).type.toRaiseError();
expect(jestExpect(jest.fn()).toHaveBeenCalledTimes()).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveReturned()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveReturned('value')).type.toRaiseError();
expect(jestExpect(jest.fn()).toHaveReturned(false)).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveReturnedTimes(3)).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveReturnedTimes('twice')).type.toRaiseError();
expect(jestExpect(jest.fn()).toHaveReturnedTimes(true)).type.toRaiseError();
expect(jestExpect(jest.fn()).toHaveReturnedTimes()).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveReturnedWith()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveReturnedWith('value')).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveReturnedWith(123)).type.toBeVoid();
expect(
  jestExpect(jest.fn<() => string>()).toHaveReturnedWith(
    jestExpect.stringContaining('value'),
  ),
).type.toBeVoid();

expect(jestExpect(jest.fn()).toHaveLastReturnedWith()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveLastReturnedWith(123)).type.toBeVoid();
expect(
  jestExpect(jest.fn<() => string>()).toHaveLastReturnedWith(
    jestExpect.stringContaining('value'),
  ),
).type.toBeVoid();

expect(jestExpect(jest.fn()).toHaveNthReturnedWith(1)).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveNthReturnedWith(1, 'value')).type.toBeVoid();
expect(
  jestExpect(jest.fn<() => string>()).toHaveNthReturnedWith(
    2,
    jestExpect.stringContaining('value'),
  ),
).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveNthReturnedWith()).type.toRaiseError();

// snapshot matchers

expect(jestExpect({a: 1}).toMatchSnapshot()).type.toBeVoid();
expect(jestExpect({a: 1}).toMatchSnapshot('hint')).type.toBeVoid();
expect(jestExpect({a: 1}).toMatchSnapshot(true)).type.toRaiseError();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot({
    date: jestExpect.any(Date),
    name: jestExpect.any(String),
  }),
).type.toBeVoid();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot(
    {
      date: jestExpect.any(Date),
      name: jestExpect.any(String),
    },
    'hint',
  ),
).type.toBeVoid();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchSnapshot({
    date: jestExpect.any(Date),
    time: jestExpect.any(Date),
  }),
).type.toRaiseError();

expect(jestExpect('abc').toMatchInlineSnapshot()).type.toBeVoid();
expect(
  jestExpect('abc').toMatchInlineSnapshot('inline snapshot here'),
).type.toBeVoid();
expect(jestExpect('abc').toMatchInlineSnapshot(true)).type.toRaiseError();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot({
    date: jestExpect.any(Date),
    name: jestExpect.any(String),
  }),
).type.toBeVoid();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot(
    {
      date: jestExpect.any(Date),
      name: jestExpect.any(String),
    },
    'inline snapshot here',
  ),
).type.toBeVoid();

expect(
  jestExpect({
    date: new Date(),
    name: 'John Doe',
  }).toMatchInlineSnapshot({
    date: jestExpect.any(Date),
    time: jestExpect.any(Date),
  }),
).type.toRaiseError();

expect(jestExpect(jest.fn()).toThrowErrorMatchingSnapshot()).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toThrowErrorMatchingSnapshot('hint'),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toThrowErrorMatchingSnapshot(true),
).type.toRaiseError();

expect(
  jestExpect(jest.fn()).toThrowErrorMatchingInlineSnapshot(),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toThrowErrorMatchingInlineSnapshot(
    'inline snapshot here',
  ),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toThrowErrorMatchingInlineSnapshot(true),
).type.toRaiseError();

// extend

type MatcherUtils = typeof jestMatcherUtils & {
  iterableEquality: Tester;
  subsetEquality: Tester;
};

expect(
  jestExpect.extend({
    toBeWithinRange(actual: number, floor: number, ceiling: number) {
      expect(this.assertionCalls).type.toBeNumber();
      expect(this.currentTestName).type.toBe<string | undefined>();
      expect(this.dontThrow).type.toBe<() => void>();
      expect(this.error).type.toBe<Error | undefined>();
      expect(this.equals).type.toBe<EqualsFunction>();
      expect(this.expand).type.toBe<boolean | undefined>();
      expect(this.expectedAssertionsNumber).type.toBe<number | null>();
      expect(this.expectedAssertionsNumberError).type.toBe<Error | undefined>();
      expect(this.isExpectingAssertions).type.toBeBoolean();
      expect(this.isExpectingAssertionsError).type.toBe<Error | undefined>();
      expect(this.isNot).type.toBe<boolean | undefined>();
      expect(this.numPassingAsserts).type.toBeNumber();
      expect(this.promise).type.toBe<string | undefined>();
      expect(this.suppressedErrors).type.toBe<Array<Error>>();
      expect(this.testPath).type.toBe<string | undefined>();
      expect(this.utils).type.toBe<MatcherUtils>();

      const pass = actual >= floor && actual <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${actual} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${actual} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
  }),
).type.toBeVoid();

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}

expect(jestExpect(100).toBeWithinRange(90, 110)).type.toBeVoid();
expect(jestExpect(101).not.toBeWithinRange(0, 100)).type.toBeVoid();

expect(
  jestExpect({apples: 6, bananas: 3}).toEqual({
    apples: jestExpect.toBeWithinRange(1, 10),
    bananas: jestExpect.not.toBeWithinRange(11, 20),
  }),
).type.toBeVoid();
