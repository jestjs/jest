/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd-lite';
import {jestExpect} from '@jest/expect';
import {expect} from 'expect';
import type {Plugin} from 'pretty-format';

expectType<void>(jestExpect({}).toMatchSnapshot());

expectError(() => {
  expect({}).toMatchSnapshot();
});

expectType<void>(jestExpect.addSnapshotSerializer({} as Plugin));

expectError(() => {
  expect.addSnapshotSerializer();
});

expectAssignable<typeof expect>(jestExpect);
expectNotAssignable<typeof jestExpect>(expect);
