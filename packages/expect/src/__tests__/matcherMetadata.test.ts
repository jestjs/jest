/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jestExpect, {JestAssertionError, type SyncExpectationResult} from '../';

declare module '../types' {
  interface Matchers<R> {
    toHaveMetadata(): R;
  }
}

function getFailedMatcherResult(metadata: unknown) {
  jestExpect.extend({
    toHaveMetadata() {
      return {
        actual: 'received',
        expected: 'expected',
        message: () => 'Images differ',
        metadata,
        pass: false,
      } as SyncExpectationResult;
    },
  });

  try {
    jestExpect('received').toHaveMetadata();
  } catch (error) {
    if (error instanceof JestAssertionError) {
      return error.matcherResult;
    }
    throw error;
  }
  throw new Error('Expected the matcher to fail');
}

test('detaches matcher metadata while preserving the assertion details', () => {
  const metadata = {artifact: {diffPath: 'diff.png'}, values: [null, true, 42]};
  const result = getFailedMatcherResult(metadata);
  metadata.artifact.diffPath = 'changed.png';

  expect(result).toEqual({
    actual: 'received',
    expected: 'expected',
    message: 'Images differ',
    metadata: {artifact: {diffPath: 'diff.png'}, values: [null, true, 42]},
    pass: false,
  });
});

test('normalizes metadata using JSON serialization rules', () => {
  const result = getFailedMatcherResult({
    date: new Date('2026-01-01T00:00:00.000Z'),
    fn: () => {},
    missing: undefined,
    symbol: Symbol('artifact'),
    values: [undefined, Number.NaN, Infinity, () => {}],
  });

  expect(result?.metadata).toEqual({
    date: '2026-01-01T00:00:00.000Z',
    values: [null, null, null, null],
  });
});

const circular: Record<string, unknown> = {};
circular.self = circular;

test.each([
  undefined,
  null,
  'diff.png',
  [],
  circular,
  {value: BigInt(1)},
  {
    get value() {
      throw new Error('Cannot read metadata');
    },
  },
  {toJSON: () => 'not an object'},
])(
  'omits unsupported metadata without replacing the assertion failure (%#)',
  metadata => {
    expect(getFailedMatcherResult(metadata)).toStrictEqual({
      actual: 'received',
      expected: 'expected',
      message: 'Images differ',
      pass: false,
    });
  },
);
