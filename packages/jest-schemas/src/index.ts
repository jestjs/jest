/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Static} from '@sinclair/typebox';
import * as types from './raw-types';

export const SnapshotFormat = types.SnapshotFormat;
export type SnapshotFormat = Static<typeof SnapshotFormat>;

export const InitialOptions = types.InitialOptions;
export type InitialOptions = Static<typeof InitialOptions>;

export const FakeTimers = types.FakeTimers;
export type FakeTimers = Static<typeof FakeTimers>;
