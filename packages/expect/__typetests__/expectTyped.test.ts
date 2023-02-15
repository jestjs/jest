/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import {Matchers, expect} from 'expect';

declare module 'expect' {
  interface Matchers<R, T> {
    toTypedEqual(expected: T): void;
  }
}

expectType<void>(expect(100).toTypedEqual(100));
expectType<void>(expect(101).not.toTypedEqual(101));

expectError(() => {
  expect(100).toTypedEqual('three');
});
