/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from 'tstyche';
import {isA} from '@jest/expect-utils';

test('isA', () => {
  expect(isA('String', 'default')).type.toBeBoolean();
  expect(isA<number>('Number', 123)).type.toBeBoolean();

  const sample = {} as unknown;

  if (isA('String', sample)) {
    expect(sample).type.toBeUnknown();
  }

  if (isA<string>('String', sample)) {
    expect(sample).type.toBeString();
  }

  if (isA<number>('Number', sample)) {
    expect(sample).type.toBeNumber();
  }

  if (isA<Map<unknown, unknown>>('Map', sample)) {
    expect(sample).type.toBe<Map<unknown, unknown>>();
  }

  if (isA<Set<unknown>>('Set', sample)) {
    expect(sample).type.toBe<Set<unknown>>();
  }
});
