/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Cycle: c imports the lazy ref from a, exercised via getter only.
import * as a from './a.mjs';

export const valueC = 'c';
export const peekA = () => a.valueA;
