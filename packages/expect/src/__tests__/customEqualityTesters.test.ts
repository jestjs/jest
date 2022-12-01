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

it('has no custom testers as default', () => {
  expect(createSpecialObject(1)).toEqual(createSpecialObject(1));
  expect(createSpecialObject(1)).not.toEqual(createSpecialObject(2));
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

  it('does not apply custom testers to `toBe`', () => {
    expect(createSpecialObject(1)).not.toBe(createSpecialObject(1));
  });

  it('applies custom testers to `toEqual`', () => {
    expect(createSpecialObject(1)).toEqual(createSpecialObject(1));
    expect(createSpecialObject(1)).toEqual(createSpecialObject(2));
  });

  // TODO: Add tests for other matchers
  // TODO: Add tests for built-in custom testers (e.g. iterableEquality, subsetObjectEquality)
});
