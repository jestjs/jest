/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import type {Config as ConfigTypes} from '@jest/types';
import type {Config} from 'jest';

declare const config: Config;

expectType<ConfigTypes.InitialOptions>(config);
