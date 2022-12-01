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
  value: number;
}

function createSpecialObject(value: number) {
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

it('has no custom testers as default', () => {
  const special1 = createSpecialObject(1);
  const special2 = createSpecialObject(2);

  // Basic matchers passing
  expect(special1).toBe(special1);
  expect(special1).toEqual(special1);
  expect([special1, special2]).toEqual([special1, special2]);
  expect(new Set([special1])).toEqual(new Set([special1]));
  expect(new Map([['key', special1]])).toEqual(new Map([['key', special1]]));
  expect(toIterator([special1, special2])).toEqual(
    toIterator([special1, special2]),
  );

  // Basic matchers not passing
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
    expect([createSpecialObject(1)]).toContainEqual(createSpecialObject(2));
    expect({a: createSpecialObject(1)}).toHaveProperty(
      'a',
      createSpecialObject(2),
    );
  });

  // it('applies custom testers to toStrictEqual', () => {});

  // it('applies custom testers to toMatchObject', () => {});

  // TODO: Add tests for other matchers
  // TODO: Add tests for built-in custom testers (e.g. iterableEquality, subsetObjectEquality)
  // TODO: Add tests for extended expect matchers that use this.equal();
});
