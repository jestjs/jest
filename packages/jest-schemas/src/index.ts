/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Static, Type} from '@sinclair/typebox';
import {RawFakeTimers, RawInitialOptions, RawSnapshotFormat} from './raw-types';

export const SnapshotFormat = Type.Strict(RawSnapshotFormat);
export type SnapshotFormat = Static<typeof RawSnapshotFormat>;

export const InitialOptions = Type.Strict(RawInitialOptions);
export type InitialOptions = Static<typeof RawInitialOptions>;

export const FakeTimers = Type.Strict(RawFakeTimers);
export type FakeTimers = Static<typeof RawFakeTimers>;
