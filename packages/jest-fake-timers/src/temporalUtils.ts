/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type TemporalEpochLike = {epochMilliseconds: number};
export type TemporalDurationLike = {total(options: {unit: string}): number};

export function toEpochMs(
  value: number | Date | TemporalEpochLike | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  // Use duck-typing rather than instanceof to handle cross-realm Date objects
  // (e.g. Sinon's ClockDate, which extends Date but may fail instanceof checks
  // across module boundaries in a webpack bundle).
  if (typeof (value as Date).getTime === 'function')
    return (value as Date).getTime();
  return (value as TemporalEpochLike).epochMilliseconds;
}

export function toDurationMs(value: number | TemporalDurationLike): number {
  if (typeof value === 'number') return value;
  return value.total({unit: 'millisecond'});
}
