/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tokenFromNested} from './wraps-nested-require.mjs';
import {token} from './shared-dep.mjs';

export const sameInstance = token === tokenFromNested;
export const evaluations = globalThis.__sharedCEvals;
