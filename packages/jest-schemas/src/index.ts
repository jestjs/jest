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

export const DiffOptions = types.DiffOptions;
// `diff` is a pass-through for arbitrary `jest-diff` options (including
// color functions, which cannot be expressed in the JSON schema above), so
// the static type allows unknown keys while the runtime schema stays closed.
export type DiffOptions = Static<typeof DiffOptions> & Record<string, unknown>;

export const InitialOptions = types.InitialOptions;
export type InitialOptions = Static<typeof InitialOptions>;

export const FakeTimers = types.FakeTimers;
export type FakeTimers = Static<typeof FakeTimers>;
