/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {equals} from '../jasmineUtils';
import {iterableEquality, sparseArrayEquality, typeEquality} from '../utils';

// The same symbol as the one exported by `jest-matcher-utils`, looked up by key
// so that `@jest/expect-utils` does not have to depend on that package.
// https://github.com/jestjs/jest/issues/15073
const SERIALIZABLE_PROPERTIES = Symbol.for('@jest/serializableProperties');

const setSerializableProperties = (obj: object, keys: unknown): void => {
  (obj as Record<symbol, unknown>)[SERIALIZABLE_PROPERTIES] = keys;
};

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

setSerializableProperties(Volume.prototype, ['amount', 'unit']);

class UntaggedVolume {
  amount: number;
  internalState: string;

  constructor(amount: number, internalState: string) {
    this.amount = amount;
    this.internalState = internalState;
  }
}

describe('equals() and SERIALIZABLE_PROPERTIES', () => {
  test('ignores properties which are not serializable', () => {
    expect(equals(new Volume(10, 'L', 'a'), new Volume(10, 'L', 'b'))).toBe(
      true,
    );
  });

  test('compares properties which are serializable', () => {
    expect(equals(new Volume(10, 'L', 'a'), new Volume(20, 'L', 'a'))).toBe(
      false,
    );
    expect(equals(new Volume(10, 'L', 'a'), new Volume(10, 'mL', 'a'))).toBe(
      false,
    );
  });

  test('is unchanged when SERIALIZABLE_PROPERTIES is not set', () => {
    const a = new UntaggedVolume(10, 'a');
    const b = new UntaggedVolume(10, 'b');

    expect(equals(a, b)).toBe(false);
    expect(equals(a, new UntaggedVolume(10, 'a'))).toBe(true);
    expect(equals({amount: 10}, {amount: 10, internalState: 'a'})).toBe(false);
  });

  test('is unchanged when SERIALIZABLE_PROPERTIES is not an array', () => {
    class Malformed {
      amount: number;
      internalState: string;

      constructor(amount: number, internalState: string) {
        this.amount = amount;
        this.internalState = internalState;
      }
    }

    setSerializableProperties(Malformed.prototype, 'amount');

    expect(equals(new Malformed(10, 'a'), new Malformed(10, 'b'))).toBe(false);
  });

  test('supports declaring the properties on the instance itself', () => {
    const a = {amount: 10, internalState: 'a'};
    const b = {amount: 10, internalState: 'b'};

    setSerializableProperties(a, ['amount']);
    setSerializableProperties(b, ['amount']);

    expect(equals(a, b)).toBe(true);
  });

  test('compares an object with declared properties against a plain object', () => {
    expect(equals(new Volume(10, 'L', 'a'), {amount: 10, unit: 'L'})).toBe(
      true,
    );
    expect(equals(new Volume(10, 'mL', 'a'), {amount: 10, unit: 'L'})).toBe(
      false,
    );
  });

  test('applies to objects nested in other structures', () => {
    const a = new Volume(10, 'L', 'a');
    const b = new Volume(10, 'L', 'b');

    expect(equals({volume: a}, {volume: b})).toBe(true);
    expect(equals([a], [b])).toBe(true);
    expect(
      equals(new Map([['volume', a]]), new Map([['volume', b]]), [
        iterableEquality,
      ]),
    ).toBe(true);
    expect(equals(new Set([a]), new Set([b]), [iterableEquality])).toBe(true);
    expect(equals({volume: a}, {volume: new Volume(20, 'L', 'b')})).toBe(false);
  });

  test('applies when strict checking is enabled', () => {
    const testers = [iterableEquality, typeEquality, sparseArrayEquality];

    expect(
      equals(new Volume(10, 'L', 'a'), new Volume(10, 'L', 'b'), testers, true),
    ).toBe(true);
    expect(
      equals(new Volume(10, 'L', 'a'), new Volume(20, 'L', 'b'), testers, true),
    ).toBe(false);
  });

  test('does not apply to arrays and typed arrays', () => {
    const a = [1, 2];
    const b = [1, 3];
    const c = new Uint8Array([1, 2]);
    const d = new Uint8Array([1, 3]);

    setSerializableProperties(a, []);
    setSerializableProperties(b, []);
    setSerializableProperties(c, []);
    setSerializableProperties(d, []);

    // An empty list must not stop the items from being compared.
    expect(equals(a, b)).toBe(false);
    expect(equals(c, d)).toBe(false);
  });
});
