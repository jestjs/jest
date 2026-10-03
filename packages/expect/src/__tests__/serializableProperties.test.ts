/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@jest/globals';
import {SERIALIZABLE_PROPERTIES} from 'jest-matcher-utils';

class Volume {
  amount: number;
  unit: string;
  internalState: string;

  constructor(amount: number, unit: string, internalState: string) {
    this.amount = amount;
    this.unit = unit;
    this.internalState = internalState;
  }
}

// @ts-expect-error: Testing purpose
Volume.prototype[SERIALIZABLE_PROPERTIES] = ['amount', 'unit'];

test('toEqual only compares the serializable properties', () => {
  expect(new Volume(10, 'L', 'a')).toEqual(new Volume(10, 'L', 'b'));
  expect(new Volume(10, 'L', 'a')).not.toEqual(new Volume(20, 'L', 'a'));
});

test('toStrictEqual only compares the serializable properties', () => {
  expect(new Volume(10, 'L', 'a')).toStrictEqual(new Volume(10, 'L', 'b'));
  expect(new Volume(10, 'L', 'a')).not.toStrictEqual(new Volume(20, 'L', 'a'));
});

test('the serializable properties apply to nested values', () => {
  expect({volume: new Volume(10, 'L', 'a')}).toEqual({
    volume: new Volume(10, 'L', 'b'),
  });
  expect([new Volume(10, 'L', 'a')]).toEqual([new Volume(10, 'L', 'b')]);
});

test('toEqual is unchanged for objects without SERIALIZABLE_PROPERTIES', () => {
  expect({amount: 10, internalState: 'a'}).not.toEqual({
    amount: 10,
    internalState: 'b',
  });
});
