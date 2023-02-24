/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Tester} from '@jest/expect-utils';
import jestExpect from '../';

class Volume {
  public amount: number;
  public unit: 'L' | 'mL';

  constructor(amount: number, unit: 'L' | 'mL') {
    this.amount = amount;
    this.unit = unit;
  }

  toString(): string {
    return `[Volume ${this.amount}${this.unit}]`;
  }

  equals(other: Volume): boolean {
    if (this.unit === other.unit) {
      return this.amount === other.amount;
    } else if (this.unit === 'L' && other.unit === 'mL') {
      return this.amount * 1000 === other.amount;
    } else {
      return this.amount === other.amount * 1000;
    }
  }
}

function createVolume(amount: number, unit: 'L' | 'mL' = 'L') {
  return new Volume(amount, unit);
}

function isVolume(a: unknown): a is Volume {
  return a instanceof Volume;
}

const areVolumesEqual: Tester = (
  a: unknown,
  b: unknown,
): boolean | undefined => {
  const isAVolume = isVolume(a);
  const isBVolume = isVolume(b);

  if (isAVolume && isBVolume) {
    return a.equals(b);
  } else if (isAVolume !== isBVolume) {
    return false;
  } else {
    return undefined;
  }
};

function* toIterator<T>(array: Array<T>): Iterator<T> {
  for (const obj of array) {
    yield obj;
  }
}

declare module '../types' {
  interface Matchers<R> {
    toEqualVolume(expected: Volume): R;
  }
}

jestExpect.extend({
  toEqualVolume(expected: Volume, actual: Volume) {
    const result = this.equals(expected, actual, this.customTesters);

    return {
      message: () =>
        `Expected Volume object: ${expected.toString()}. Actual Volume object: ${actual.toString()}`,
      pass: result,
    };
  },
});

// Create Volumes with different specifications but the same value for use in
// tests. Without the custom tester, these volumes would not be equal because
// their properties have different values. However, with our custom tester they
// are equal.
const volume1 = createVolume(1, 'L');
const volume2 = createVolume(1000, 'mL');

const volumeArg1 = createVolume(1, 'L');
const volumeArg2 = createVolume(1000, 'mL');
const volumeArg3 = createVolume(2, 'L');
const volumeArg4 = createVolume(2000, 'mL');

const volumeReturn1 = createVolume(2, 'L');
const volumeReturn2 = createVolume(2000, 'mL');

const testArgs = [volumeArg1, volumeArg2, [volumeArg3, volumeArg4]];
// Swap the order of args to assert custom tester sees these volumes as equal
const expectedArgs = [volumeArg2, volumeArg1, [volumeArg4, volumeArg3]];

expect.addEqualityTesters([areVolumesEqual]);

describe('with custom equality testers', () => {
  it('basic matchers customTesters do not apply to still do not pass different Volume objects', () => {
    expect(volume1).not.toBe(volume2);
    expect([volume1]).not.toContain(volume2);
  });

  it('basic matchers pass different Volume objects', () => {
    expect(volume1).toEqual(volume1);
    expect(volume1).toEqual(volume2);
    expect([volume1, volume2]).toEqual([volume2, volume1]);
    expect(new Map([['key', volume1]])).toEqual(new Map([['key', volume2]]));
    expect(new Set([volume1])).toEqual(new Set([volume2]));
    expect(toIterator([volume1, volume2])).toEqual(
      toIterator([volume2, volume1]),
    );
    expect([volume1]).toContainEqual(volume2);
    expect({a: volume1}).toHaveProperty('a', volume2);
    expect({a: volume1, b: undefined}).toStrictEqual({
      a: volume2,
      b: undefined,
    });
    expect({a: 1, b: {c: volume1}}).toMatchObject({
      a: 1,
      b: {c: volume2},
    });
  });

  it('asymmetric matchers pass different Volume objects', () => {
    expect([volume1]).toEqual(expect.arrayContaining([volume2]));
    expect({a: 1, b: {c: volume1}}).toEqual(
      expect.objectContaining({b: {c: volume2}}),
    );
  });

  it('spy matchers pass different Volume objects', () => {
    const mockFn = jest.fn<(...args: Array<unknown>) => unknown>(
      () => volumeReturn1,
    );
    mockFn(...testArgs);

    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenLastCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenNthCalledWith(1, ...expectedArgs);

    expect(mockFn).toHaveReturnedWith(volumeReturn2);
    expect(mockFn).toHaveLastReturnedWith(volumeReturn2);
    expect(mockFn).toHaveNthReturnedWith(1, volumeReturn2);
  });

  it('custom matchers pass different Volume objects', () => {
    expect(volume1).toEqualVolume(volume2);
  });

  it('toBe recommends toStrictEqual even with different Volume objects', () => {
    expect(() => expect(volume1).toBe(volume2)).toThrow('toStrictEqual');
  });

  it('toBe recommends toEqual even with different Volume objects', () => {
    expect(() => expect({a: undefined, b: volume1}).toBe({b: volume2})).toThrow(
      'toEqual',
    );
  });

  it('toContains recommends toContainEquals even with different Volume objects', () => {
    expect(() => expect([volume1]).toContain(volume2)).toThrow(
      'toContainEqual',
    );
  });

  it('toMatchObject error shows Volume objects as equal', () => {
    expect(() =>
      expect({a: 1, b: volume1}).toMatchObject({a: 2, b: volume2}),
    ).toThrowErrorMatchingSnapshot();
  });

  it('iterableEquality still properly detects cycles', () => {
    const a = new Set();
    a.add(volume1);
    a.add(a);

    const b = new Set();
    b.add(volume2);
    b.add(b);

    expect(a).toEqual(b);
  });
});
