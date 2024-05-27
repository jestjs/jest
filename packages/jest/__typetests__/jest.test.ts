/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import type {Config} from 'jest';

describe('Config', () => {
  test('is a reexport of the `InitialOptions`', () => {
    type InitialOptions = import('@jest/types').Config.InitialOptions;

    expect<Config>().type.toBe<InitialOptions>();
  });
});
