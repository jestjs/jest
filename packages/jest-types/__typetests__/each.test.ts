/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
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

expectType<void>(
  test.each(list)('some test', (a, done) => {
    expectType<number>(a);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each(list)(
    'some test',
    a => {
      expectType<number>(a);
    },
    1000,
  ),
);

expectType<void>(
  test.each(tupleList)('some test', (b, done) => {
    expectType<'one' | 'two' | 'three'>(b);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each(tupleList)(
    'some test',
    b => {
      expectType<'one' | 'two' | 'three'>(b);
    },
    1000,
  ),
);

expectType<void>(
  test.each([3, 4, 'seven'])('some test', (c, done) => {
    expectType<string | number>(c);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each([3, 4, 'seven'])(
    'some test',
    c => {
      expectType<string | number>(c);
    },
    1000,
  ),
);

expectType<void>(
  test.each(table)('some test', (a, b, expected) => {
    expectType<string | number>(a);
    expectType<string | number>(b);
    expectType<string | number>(expected);
  }),
);
expectType<void>(
  test.each(table)(
    'some test',
    (a, b, expected) => {
      expectType<string | number>(a);
      expectType<string | number>(b);
      expectType<string | number>(expected);
    },
    1000,
  ),
);

expectType<void>(
  test.each(tupleTable)('some test', (a, b, expected, extra) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
    expectType<boolean | undefined>(extra);
  }),
);
expectType<void>(
  test.each(tupleTable)(
    'some test',
    (a, b, expected, extra) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);
    },
    1000,
  ),
);

expectType<void>(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])('some test', (a, b, expected) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
  }),
);
expectType<void>(
  test.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])(
    'some test',
    (a, b, expected) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
    },
    1000,
  ),
);

expectType<void>(
  test.each(objectTable)('some test', ({a, b, expected, extra}, done) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
    expectType<boolean | undefined>(extra);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each([
    {a: 1, b: 2, expected: 'three', extra: true},
    {a: 3, b: 4, expected: 'seven', extra: false},
    {a: 5, b: 6, expected: 'eleven'},
  ])(
    'some test',
    ({a, b, expected, extra}, done) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);

      expectType<(reason?: string | Error) => void>(done);
    },
    1000,
  ),
);

expectType<void>(
  test.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('some test', ({a, b, expected}, done) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<number>(expected);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', ({item, expected}) => {
    expectType<unknown>(item);
    expectType<unknown>(expected);
  }),
);
expectType<void>(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', ({item, expected}, done) => {
    expectType<string>(item);
    expectType<boolean>(expected);

    expectType<(reason?: string | Error) => void>(done);
  }),
);
expectType<void>(
  test.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'some test',
    ({a, b, expected}) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<number>(expected);
    },
    1000,
  ),
);
expectType<void>(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expectType<unknown>(item);
      expectType<unknown>(expected);
    },
    1000,
  ),
);
expectType<void>(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expectType<string>(item);
      expectType<boolean>(expected);
    },
    1000,
  ),
);

expectError(test.each());
expectError(test.each('abc'));
expectError(test.each(() => {}));

expectType<typeof test.each>(test.only.each);
expectType<typeof test.each>(test.skip.each);

// test.concurrent.each

expectType<void>(
  test.concurrent.each(list)('some test', async a => {
    expectType<number>(a);
  }),
);
expectType<void>(
  test.concurrent.each(list)(
    'some test',
    async a => {
      expectType<number>(a);
    },
    1000,
  ),
);

expectType<void>(
  test.concurrent.each(tupleList)('some test', async b => {
    expectType<'one' | 'two' | 'three'>(b);
  }),
);
expectType<void>(
  test.concurrent.each(tupleList)(
    'some test',
    async b => {
      expectType<'one' | 'two' | 'three'>(b);
    },
    1000,
  ),
);

expectType<void>(
  test.concurrent.each([3, 4, 'seven'])('some test', async c => {
    expectType<string | number>(c);
  }),
);
expectType<void>(
  test.concurrent.each([3, 4, 'seven'])(
    'some test',
    async c => {
      expectType<string | number>(c);
    },
    1000,
  ),
);

expectType<void>(
  test.concurrent.each(table)('some test', async (a, b, expected) => {
    expectType<string | number>(a);
    expectType<string | number>(b);
    expectType<string | number>(expected);
  }),
);
expectType<void>(
  test.concurrent.each(table)(
    'some test',
    async (a, b, expected) => {
      expectType<string | number>(a);
      expectType<string | number>(b);
      expectType<string | number>(expected);
    },
    1000,
  ),
);

expectType<void>(
  test.concurrent.each(tupleTable)(
    'some test',
    async (a, b, expected, extra) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);
    },
  ),
);
expectType<void>(
  test.concurrent.each(tupleTable)(
    'some test',
    async (a, b, expected, extra) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);
    },
    1000,
  ),
);

expectType<void>(
  test.concurrent.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('some test', async ({a, b, expected}) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<number>(expected);
  }),
);
expectType<void>(
  test.concurrent.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', async ({item, expected}) => {
    expectType<unknown>(item);
    expectType<unknown>(expected);
  }),
);
expectType<void>(
  test.concurrent.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `('some test', async ({item, expected}) => {
    expectType<string>(item);
    expectType<boolean>(expected);
  }),
);
expectType<void>(
  test.concurrent.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'some test',
    async ({a, b, expected}) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<number>(expected);
    },
    1000,
  ),
);

expectType<void>(
  test.each`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expectType<unknown>(item);
      expectType<unknown>(expected);
    },
    1000,
  ),
);
expectType<void>(
  test.each<{item: string; expected: boolean}>`
    item   | expected
    ${'a'} | ${true}
    ${'b'} | ${false}
  `(
    'some test',
    ({item, expected}) => {
      expectType<string>(item);
      expectType<boolean>(expected);
    },
    1000,
  ),
);

expectError(test.concurrent.each());
expectError(test.concurrent.each('abc'));
expectError(test.concurrent.each(() => {}));

expectType<typeof test.concurrent.each>(test.concurrent.only.each);
expectType<typeof test.concurrent.each>(test.concurrent.skip.each);

// describe.each

expectType<void>(
  describe.each(list)('describe each', a => {
    expectType<number>(a);
  }),
);
expectType<void>(
  describe.each(list)(
    'describe each',
    a => {
      expectType<number>(a);
    },
    1000,
  ),
);

expectType<void>(
  describe.each(tupleList)('describe each', b => {
    expectType<'one' | 'two' | 'three'>(b);
  }),
);
expectType<void>(
  describe.each(tupleList)(
    'describe each',
    b => {
      expectType<'one' | 'two' | 'three'>(b);
    },
    1000,
  ),
);

expectType<void>(
  describe.each([3, 4, 'seven'])('describe each', c => {
    expectType<string | number>(c);
  }),
);
expectType<void>(
  describe.each([3, 4, 'seven'])(
    'describe each',
    c => {
      expectType<string | number>(c);
    },
    1000,
  ),
);

expectType<void>(
  describe.each(table)('describe each', (a, b, expected) => {
    expectType<string | number>(a);
    expectType<string | number>(b);
    expectType<string | number>(expected);
  }),
);
expectType<void>(
  describe.each(table)(
    'describe each',
    (a, b, expected) => {
      expectType<string | number>(a);
      expectType<string | number>(b);
      expectType<string | number>(expected);
    },
    1000,
  ),
);

expectType<void>(
  describe.each(tupleTable)('describe each', (a, b, expected, extra) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
    expectType<boolean | undefined>(extra);
  }),
);
expectType<void>(
  describe.each(tupleTable)(
    'describe each',
    (a, b, expected, extra) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);
    },
    1000,
  ),
);

expectType<void>(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])('describe each', (a, b, expected) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
  }),
);
expectType<void>(
  describe.each([
    [1, 2, 'three'],
    [3, 4, 'seven'],
  ])(
    'describe each',
    (a, b, expected) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
    },
    1000,
  ),
);

expectType<void>(
  describe.each(objectTable)('describe each', ({a, b, expected, extra}) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
    expectType<boolean | undefined>(extra);
  }),
);
expectType<void>(
  describe.each([
    {a: 1, b: 2, expected: 'three', extra: true},
    {a: 3, b: 4, expected: 'seven', extra: false},
    {a: 5, b: 6, expected: 'eleven'},
  ])(
    'describe each',
    ({a, b, expected, extra}) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
      expectType<boolean | undefined>(extra);
    },
    1000,
  ),
);

expectType<void>(
  describe.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `('describe each', ({a, b, expected}) => {
    expectType<number>(a);
    expectType<number>(b);
    expectType<number>(expected);
  }),
);
expectType<void>(
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
    expectType<number>(a);
    expectType<number>(b);
    expectType<string>(expected);
  }),
);
expectType<void>(
  describe.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${1} | ${3}
  `(
    'describe each',
    ({a, b, expected}) => {
      expectType<number>(a);
      expectType<number>(b);
      expectType<number>(expected);
    },
    1000,
  ),
);
expectType<void>(
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
      expectType<number>(a);
      expectType<number>(b);
      expectType<string>(expected);
    },
    1000,
  ),
);

expectError(describe.each());
expectError(describe.each('abc'));
expectError(describe.each(() => {}));

expectType<typeof describe.each>(describe.only.each);
expectType<typeof describe.each>(describe.skip.each);
