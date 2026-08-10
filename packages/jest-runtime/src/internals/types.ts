/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {expect, jest} from '@jest/globals';
import type {Global} from '@jest/types';

export interface EnvironmentGlobals extends Global.TestFrameworkGlobals {
  expect: typeof expect;
}

export interface JestGlobalsWithJest extends EnvironmentGlobals {
  jest: typeof jest;
}
