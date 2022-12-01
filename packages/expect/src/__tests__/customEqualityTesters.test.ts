/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Tester} from '@jest/expect-utils';
import jestExpect from '../';

const specialObjPropName = '$$special';
const specialObjSymbol = Symbol('special test object type');

interface SpecialObject {
  $$special: symbol;
  value: number | string;
}

function createSpecialObject(value: number | string) {
  return {
    [specialObjPropName]: specialObjSymbol,
    value,
  };
}

function isSpecialObject(a: unknown): a is SpecialObject {
  return (
    a != null &&
    typeof a === 'object' &&
    specialObjPropName in a &&
    (a as any)[specialObjPropName] === specialObjSymbol
  );
}

const specialObjTester: Tester = (
  a: unknown,
  b: unknown,
): boolean | undefined => {
  const isASpecial = isSpecialObject(a);
  const isBSpecial = isSpecialObject(b);

  if (isASpecial && isBSpecial) {
    return true;
  } else if ((isASpecial && !isBSpecial) || (!isASpecial && isBSpecial)) {
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

const specialArg1 = createSpecialObject('arg1');
const specialArg2 = createSpecialObject('arg2');
const specialArg3 = createSpecialObject('arg3');
const specialArg4 = createSpecialObject('arg4');
const specialReturn1 = createSpecialObject('return1');
const specialReturn2 = createSpecialObject('return2');

const testArgs = [specialArg1, specialArg2, [specialArg3, specialArg4]];
// Swap the order of args to assert customer tester does not affect test
const expectedArgs = [specialArg2, specialArg1, [specialArg4, specialArg3]];

it('has no custom testers as default', () => {
  const special1 = createSpecialObject(1);
  const special2 = createSpecialObject(2);

  // Basic matchers passing with default settings
  expect(special1).toBe(special1);
  expect(special1).toEqual(special1);
  expect([special1, special2]).toEqual([special1, special2]);
  expect(new Set([special1])).toEqual(new Set([special1]));
  expect(new Map([['key', special1]])).toEqual(new Map([['key', special1]]));
  expect(toIterator([special1, special2])).toEqual(
    toIterator([special1, special2]),
  );

  // Basic matchers not passing with default settings
  expect(special1).not.toBe(special2);
  expect(createSpecialObject(1)).not.toEqual(createSpecialObject(2));
  expect([special1, special2]).not.toEqual([special2, special1]);
  expect(new Set([special1])).not.toEqual(new Set([special2]));
  expect(new Map([['key', special1]])).not.toEqual(
    new Map([['key', special2]]),
  );
  expect(toIterator([special1, special2])).not.toEqual(
    toIterator([special2, special1]),
  );
  expect({a: special1, b: undefined}).not.toStrictEqual({
    a: special2,
    b: undefined,
  });
  expect({a: 1, b: {c: special1}}).not.toMatchObject({a: 1, b: {c: special2}});

  // Asymmetric matchers
  expect([special1]).not.toEqual(expect.arrayContaining([special2]));
  expect({a: 1, b: {c: special1}}).not.toEqual(
    expect.objectContaining({b: {c: special2}}),
  );

  // Spy matchers
  const mockFn = jest.fn(() => specialReturn1);
  mockFn(...testArgs);

  expect(mockFn).not.toHaveBeenCalledWith(...expectedArgs);
  expect(mockFn).not.toHaveBeenLastCalledWith(...expectedArgs);
  expect(mockFn).not.toHaveBeenNthCalledWith(1, ...expectedArgs);

  expect(mockFn).not.toHaveReturnedWith(specialReturn2);
  expect(mockFn).not.toHaveLastReturnedWith(specialReturn2);
  expect(mockFn).not.toHaveNthReturnedWith(1, specialReturn2);
});

describe('with custom equality testers', () => {
  let originalTesters: Array<Tester>;

  beforeAll(() => {
    originalTesters = jestExpect.customEqualityTesters;
    jestExpect.customEqualityTesters = [...originalTesters, specialObjTester];
  });

  afterAll(() => {
    jestExpect.customEqualityTesters = originalTesters;
  });

  it('basic matchers customTesters do not apply to', () => {
    const special1 = createSpecialObject(1);
    const special2 = createSpecialObject(2);

    expect(special1).toBe(special1);
    expect([special1]).toContain(special1);

    expect(special1).not.toBe(special2);
    expect([special1]).not.toContain(special2);
  });

  it('basic matchers customTesters do apply to', () => {
    const special1 = createSpecialObject(1);
    const special2 = createSpecialObject(2);

    expect(special1).toEqual(special1);
    expect(special1).toEqual(special2);
    expect([special1, special2]).toEqual([special2, special1]);
    expect(new Map([['key', special1]])).toEqual(new Map([['key', special2]]));
    expect(new Set([special1])).toEqual(new Set([special2]));
    expect(toIterator([special1, special2])).toEqual(
      toIterator([special2, special1]),
    );
    expect([special1]).toContainEqual(special2);
    expect({a: special1}).toHaveProperty('a', special2);
    expect({a: special1, b: undefined}).toStrictEqual({
      a: special2,
      b: undefined,
    });
    expect({a: 1, b: {c: special1}}).toMatchObject({
      a: 1,
      b: {c: special2},
    });
  });

  it('asymmetric matchers with custom testers', () => {
    const special1 = createSpecialObject(1);
    const special2 = createSpecialObject(2);

    expect([special1]).toEqual(expect.arrayContaining([special2]));
    expect({a: 1, b: {c: special1}}).toEqual(
      expect.objectContaining({b: {c: special2}}),
    );
  });

  it('spy matchers with custom testers', () => {
    const mockFn = jest.fn(() => specialReturn1);
    mockFn(...testArgs);

    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenLastCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenNthCalledWith(1, ...expectedArgs);

    expect(mockFn).toHaveReturnedWith(specialReturn2);
    expect(mockFn).toHaveLastReturnedWith(specialReturn2);
    expect(mockFn).toHaveNthReturnedWith(1, specialReturn2);
  });
});
