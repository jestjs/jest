/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @type ./empty.d.ts
 */

import {expectType} from 'mlh-tsd';
import {jest} from '@jest/globals';

// DEMO: The following three tests should fail
expectType<string>(jest.addMatchers({}));
expectType<void>(jest.autoMockOff());
expectType<void>(jest.autoMockOn());

// DEMO: The following three tests should pass
expectType<typeof jest>(jest.clearAllMocks());
expectType<void>(jest.clearAllTimers());
expectType<typeof jest>(jest.resetAllMocks());
