/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type TemporalInstantLike = {epochMilliseconds: number};
export type TemporalDurationLike = {total(options: {unit: string}): number};

export function toEpochMs(
  value: number | Date | TemporalInstantLike | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  return value.epochMilliseconds;
}

export function toDurationMs(value: number | TemporalDurationLike): number {
  if (typeof value === 'number') return value;
  return value.total({unit: 'millisecond'});
}
