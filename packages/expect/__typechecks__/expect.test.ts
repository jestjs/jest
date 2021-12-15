/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as expect from 'expect';

export type M = expect.Matchers<void, unknown>;
export type N = expect.Matchers<void>;
// @ts-expect-error: Generic type 'Matchers<R, T>' requires between 1 and 2 type arguments.
export type E = expect.Matchers;
