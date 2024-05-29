/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {describe, test} from '@jest/globals';

const list = [1, 2, 3];
const tupleList = ['one', 'two', 'three'] as const;
const table = [
  [1, 2, 'three'],
  [3, 4, 'seven'],
];
const tupleTable: Array<[number, number, string, boolean?]> = [
  [1, 2, 'three', true],
  [3, 4, 'seven', false],
  [5, 6, 'eleven'],
];
const objectTable = [
  {a: 1, b: 2, expected: 'three', extra: true},
  {a: 3, b: 4, expected: 'seven', extra: false},
  {a: 5, b: 6, expected: 'eleven'},
];

// test.each

expect(
  test.each(list)('some test', (a, done) => {
    expect(a).type.toBeNumber();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each(list)(
    'some test',
    a => {
      expect(a).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each(tupleList)('some test', (b, done) => {
    expect(b).type.toBe<'one' | 'two' | 'three'>();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each(tupleList)(
    'some test',
    b => {
      expect(b).type.toBe<'one' | 'two' | 'three'>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each([3, 4, 'seven'])('some test', (c, done) => {
    expect(c).type.toBe<string | number>();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each([3, 4, 'seven'])(
    'some test',
    c => {
      expect(c).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each(table)('some test', (a, b, expected) => {
    expect(a).type.toBe<string | number>();
    expect(b).type.toBe<string | number>();
    expect(expected).type.toBe<string | number>();
  }),
).type.toBeVoid();
expect(
  test.each(table)(
    'some test',
    (a, b, expected) => {
      expect(a).type.toBe<string | number>();
      expect(b).type.toBe<string | number>();
      expect(expected).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each(tupleTable)('some test', (a, b, expected, extra) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
    expect(extra).type.toBe<boolean | undefined>();
  }),
).type.toBeVoid();
expect(
  test.each(tupleTable)(
    'some test',
    (a, b, expected, extra) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])('some test', (a, b, expected) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
  }),
).type.toBeVoid();
expect(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])(
    'some test',
    (a, b, expected) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ] as const)('some test', (a, b, expected) => {
    expect(a).type.toBe<1 | 3>();
    expect(b).type.toBe<2 | 4>();
    expect(expected).type.toBe<'three' | 'seven'>();
  }),
).type.toBeVoid();
expect(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ] as const)(
    'some test',
    (a, b, expected) => {
      expect(a).type.toBe<1 | 3>();
      expect(b).type.toBe<2 | 4>();
      expect(expected).type.toBe<'three' | 'seven'>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each(objectTable)('some test', ({a, b, expected, extra}, done) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
    expect(extra).type.toBe<boolean | undefined>();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each([
    {a: 1, b: 2, expected: 'three', extra: true},
    {a: 3, b: 4, expected: 'seven', extra: false},
    {a: 5, b: 6, expected: 'eleven'},
  ])(
    'some test',
    ({a, b, expected, extra}, done) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();

      expect(done).type.toBe<(reason?: string | Error) => void>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('some test', ({a, b, expected}, done) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeNumber();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', ({item, expected}) => {
    expect(item).type.toBe<string | boolean>();
    expect(expected).type.toBe<string | boolean>();
  }),
).type.toBeVoid();
expect(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', ({item, expected}, done) => {
    expect(item).type.toBeString();
    expect(expected).type.toBeBoolean();

    expect(done).type.toBe<(reason?: string | Error) => void>();
  }),
).type.toBeVoid();
expect(
  test.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'some test',
    ({a, b, expected}) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();
expect(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expect(item).type.toBe<string | boolean>();
      expect(expected).type.toBe<string | boolean>();
    },
    1000,
  ),
).type.toBeVoid();
expect(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expect(item).type.toBeString();
      expect(expected).type.toBeBoolean();
    },
    1000,
  ),
).type.toBeVoid();

expect(test.each()).type.toRaiseError();
expect(test.each('abc')).type.toRaiseError();
expect(test.each(() => {})).type.toRaiseError();

expect(test.only.each).type.toBe(test.each);
expect(test.skip.each).type.toBe(test.each);

// test.concurrent.each

expect(
  test.concurrent.each(list)('some test', async a => {
    expect(a).type.toBeNumber();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each(list)(
    'some test',
    async a => {
      expect(a).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.concurrent.each(tupleList)('some test', async b => {
    expect(b).type.toBe<'one' | 'two' | 'three'>();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each(tupleList)(
    'some test',
    async b => {
      expect(b).type.toBe<'one' | 'two' | 'three'>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.concurrent.each([3, 4, 'seven'])('some test', async c => {
    expect(c).type.toBe<string | number>();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each([3, 4, 'seven'])(
    'some test',
    async c => {
      expect(c).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.concurrent.each(table)('some test', async (a, b, expected) => {
    expect(a).type.toBe<string | number>();
    expect(b).type.toBe<string | number>();
    expect(expected).type.toBe<string | number>();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each(table)(
    'some test',
    async (a, b, expected) => {
      expect(a).type.toBe<string | number>();
      expect(b).type.toBe<string | number>();
      expect(expected).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.concurrent.each(tupleTable)(
    'some test',
    async (a, b, expected, extra) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();
    },
  ),
).type.toBeVoid();
expect(
  test.concurrent.each(tupleTable)(
    'some test',
    async (a, b, expected, extra) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.concurrent.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('some test', async ({a, b, expected}) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeNumber();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', async ({item, expected}) => {
    expect(item).type.toBe<string | boolean>();
    expect(expected).type.toBe<string | boolean>();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', async ({item, expected}) => {
    expect(item).type.toBeString();
    expect(expected).type.toBeBoolean();
  }),
).type.toBeVoid();
expect(
  test.concurrent.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'some test',
    async ({a, b, expected}) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expect(item).type.toBe<string | boolean>();
      expect(expected).type.toBe<string | boolean>();
    },
    1000,
  ),
).type.toBeVoid();
expect(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expect(item).type.toBeString();
      expect(expected).type.toBeBoolean();
    },
    1000,
  ),
).type.toBeVoid();

expect(test.concurrent.each()).type.toRaiseError();
expect(test.concurrent.each('abc')).type.toRaiseError();
expect(test.concurrent.each(() => {})).type.toRaiseError();

expect(test.concurrent.only.each).type.toBe(test.concurrent.each);
expect(test.concurrent.skip.each).type.toBe(test.concurrent.each);

// describe.each

expect(
  describe.each(list)('describe each', a => {
    expect(a).type.toBeNumber();
  }),
).type.toBeVoid();
expect(
  describe.each(list)(
    'describe each',
    a => {
      expect(a).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each(tupleList)('describe each', b => {
    expect(b).type.toBe<'one' | 'two' | 'three'>();
  }),
).type.toBeVoid();
expect(
  describe.each(tupleList)(
    'describe each',
    b => {
      expect(b).type.toBe<'one' | 'two' | 'three'>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each([3, 4, 'seven'])('describe each', c => {
    expect(c).type.toBe<string | number>();
  }),
).type.toBeVoid();
expect(
  describe.each([3, 4, 'seven'])(
    'describe each',
    c => {
      expect(c).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each(table)('describe each', (a, b, expected) => {
    expect(a).type.toBe<string | number>();
    expect(b).type.toBe<string | number>();
    expect(expected).type.toBe<string | number>();
  }),
).type.toBeVoid();
expect(
  describe.each(table)(
    'describe each',
    (a, b, expected) => {
      expect(a).type.toBe<string | number>();
      expect(b).type.toBe<string | number>();
      expect(expected).type.toBe<string | number>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each(tupleTable)('describe each', (a, b, expected, extra) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
    expect(extra).type.toBe<boolean | undefined>();
  }),
).type.toBeVoid();
expect(
  describe.each(tupleTable)(
    'describe each',
    (a, b, expected, extra) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])('describe each', (a, b, expected) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
  }),
).type.toBeVoid();
expect(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])(
    'describe each',
    (a, b, expected) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ] as const)('describe each', (a, b, expected) => {
    expect(a).type.toBe<1 | 3>();
    expect(b).type.toBe<2 | 4>();
    expect(expected).type.toBe<'three' | 'seven'>();
  }),
).type.toBeVoid();
expect(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ] as const)(
    'describe each',
    (a, b, expected) => {
      expect(a).type.toBe<1 | 3>();
      expect(b).type.toBe<2 | 4>();
      expect(expected).type.toBe<'three' | 'seven'>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each(objectTable)('describe each', ({a, b, expected, extra}) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
    expect(extra).type.toBe<boolean | undefined>();
  }),
).type.toBeVoid();
expect(
  describe.each([
    {a: 1, b: 2, expected: 'three', extra: true},
    {a: 3, b: 4, expected: 'seven', extra: false},
    {a: 5, b: 6, expected: 'eleven'},
  ])(
    'describe each',
    ({a, b, expected, extra}) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
      expect(extra).type.toBe<boolean | undefined>();
    },
    1000,
  ),
).type.toBeVoid();

expect(
  describe.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('describe each', ({a, b, expected}) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeNumber();
  }),
).type.toBeVoid();
expect(
  describe.each<{
    a: number;
    b: number;
    expected: string;
  }>`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('describe each', ({a, b, expected}) => {
    expect(a).type.toBeNumber();
    expect(b).type.toBeNumber();
    expect(expected).type.toBeString();
  }),
).type.toBeVoid();
expect(
  describe.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'describe each',
    ({a, b, expected}) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeNumber();
    },
    1000,
  ),
).type.toBeVoid();
expect(
  describe.each<{
    a: number;
    b: number;
    expected: string;
  }>`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'describe each',
    ({a, b, expected}) => {
      expect(a).type.toBeNumber();
      expect(b).type.toBeNumber();
      expect(expected).type.toBeString();
    },
    1000,
  ),
).type.toBeVoid();

expect(describe.each()).type.toRaiseError();
expect(describe.each('abc')).type.toRaiseError();
expect(describe.each(() => {})).type.toRaiseError();

expect(describe.only.each).type.toBe(describe.each);
expect(describe.skip.each).type.toBe(describe.each);
