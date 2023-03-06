/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {expectType} from 'tsd-lite';
import type {Options} from 'yargs';
import {yargsOptions} from 'jest-cli';

expectType<{[key: string]: Options}>(yargsOptions);
