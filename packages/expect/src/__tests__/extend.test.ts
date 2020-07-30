/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as matcherUtils from 'jest-matcher-utils';
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import {iterableEquality, subsetEquality} from '../utils';
import {equals} from '../jasmineUtils';
import jestExpect from '../';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

jestExpect.extend({
  toBeDivisibleBy(actual: number, expected: number) {
    const pass = actual % expected === 0;
    const message = pass
      ? () => `expected ${actual} not to be divisible by ${expected}`
      : () => `expected ${actual} to be divisible by ${expected}`;

    return {message, pass};
  },
  toBeSymbol(actual: symbol, expected: symbol) {
    const pass = actual === expected;
    const message = () =>
      `expected ${actual.toString()} to be Symbol ${expected.toString()}`;

    return {message, pass};
  },
  toBeWithinRange(actual: number, floor: number, ceiling: number) {
    const pass = actual >= floor && actual <= ceiling;
    const message = pass
      ? () => `expected ${actual} not to be within range ${floor} - ${ceiling}`
      : () => `expected ${actual} to be within range ${floor} - ${ceiling}`;

    return {message, pass};
  },
});

it('is available globally when matcher is unary', () => {
  jestExpect(15).toBeDivisibleBy(5);
  jestExpect(15).toBeDivisibleBy(3);
  jestExpect(15).not.toBeDivisibleBy(6);

  jestExpect(() =>
    jestExpect(15).toBeDivisibleBy(2),
  ).toThrowErrorMatchingSnapshot();
});

it('is available globally when matcher is variadic', () => {
  jestExpect(15).toBeWithinRange(10, 20);
  jestExpect(15).not.toBeWithinRange(6);

  jestExpect(() =>
    jestExpect(15).toBeWithinRange(1, 3),
  ).toThrowErrorMatchingSnapshot();
});

it('exposes matcherUtils in context', () => {
  jestExpect.extend({
    _shouldNotError(_actual: unknown, _expected: unknown) {
      const pass = this.equals(
        this.utils,
        Object.assign(matcherUtils, {
          iterableEquality,
          subsetEquality,
        }),
      );
      const message = pass
        ? () => `expected this.utils to be defined in an extend call`
        : () => `expected this.utils not to be defined in an extend call`;

      return {message, pass};
    },
  });

  jestExpect()._shouldNotError();
});

it('is ok if there is no message specified', () => {
  jestExpect.extend({
    toFailWithoutMessage(_expected: unknown) {
      return {pass: false};
    },
  });

  expect(() =>
    jestExpect(true).toFailWithoutMessage(),
  ).toThrowErrorMatchingSnapshot();
});

it('exposes an equality function to custom matchers', () => {
  // jestExpect and expect share the same global state
  expect.assertions(3);
  jestExpect.extend({
    toBeOne() {
      expect(this.equals).toBe(equals);
      return {pass: !!this.equals(1, 1)};
    },
  });

  expect(() => jestExpect().toBeOne()).not.toThrow();
});

it('defines asymmetric unary matchers', () => {
  expect(() =>
    jestExpect({value: 2}).toEqual({value: jestExpect.toBeDivisibleBy(2)}),
  ).not.toThrow();
  expect(() =>
    jestExpect({value: 3}).toEqual({value: jestExpect.toBeDivisibleBy(2)}),
  ).toThrowErrorMatchingSnapshot();
});

it('defines asymmetric unary matchers that can be prefixed by not', () => {
  expect(() =>
    jestExpect({value: 2}).toEqual({value: jestExpect.not.toBeDivisibleBy(2)}),
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    jestExpect({value: 3}).toEqual({value: jestExpect.not.toBeDivisibleBy(2)}),
  ).not.toThrow();
});

it('defines asymmetric variadic matchers', () => {
  expect(() =>
    jestExpect({value: 2}).toEqual({value: jestExpect.toBeWithinRange(1, 3)}),
  ).not.toThrow();
  expect(() =>
    jestExpect({value: 3}).toEqual({value: jestExpect.toBeWithinRange(4, 11)}),
  ).toThrowErrorMatchingSnapshot();
});

it('defines asymmetric variadic matchers that can be prefixed by not', () => {
  expect(() =>
    jestExpect({value: 2}).toEqual({
      value: jestExpect.not.toBeWithinRange(1, 3),
    }),
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    jestExpect({value: 3}).toEqual({
      value: jestExpect.not.toBeWithinRange(5, 7),
    }),
  ).not.toThrow();
});

it('prints the Symbol into the error message', () => {
  const foo = Symbol('foo');
  const bar = Symbol('bar');

  expect(() =>
    jestExpect({a: foo}).toEqual({
      a: jestExpect.toBeSymbol(bar),
    }),
  ).toThrowErrorMatchingSnapshot();
});
