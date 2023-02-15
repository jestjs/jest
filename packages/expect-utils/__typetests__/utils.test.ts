/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import {isA} from '@jest/expect-utils';

// isA

expectType<boolean>(isA('String', 'default'));
expectType<boolean>(isA<number>('Number', 123));

const sample = {} as unknown;

expectType<unknown>(sample);

if (isA('String', sample)) {
  expectType<unknown>(sample);
}

if (isA<string>('String', sample)) {
  expectType<string>(sample);
}

if (isA<number>('Number', sample)) {
  expectType<number>(sample);
}

if (isA<Map<unknown, unknown>>('Map', sample)) {
  expectType<Map<unknown, unknown>>(sample);
}

if (isA<Set<unknown>>('Set', sample)) {
  expectType<Set<unknown>>(sample);
}
