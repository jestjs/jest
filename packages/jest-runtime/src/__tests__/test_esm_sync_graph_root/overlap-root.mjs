/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {token} from './shared-dep.mjs';
import {tokenFromNested} from './requires-nested-root.cjs';

export const sameInstance = token === tokenFromNested;
export const evaluations = globalThis.__sharedCEvals;
