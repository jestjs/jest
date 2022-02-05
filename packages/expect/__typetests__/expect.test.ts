/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError} from 'tsd-lite';
import type * as expect from 'expect';

type M = expect.Matchers<void, unknown>;
type N = expect.Matchers<void>;

expectError(() => {
  type E = expect.Matchers;
});
