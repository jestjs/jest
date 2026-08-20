/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {TestResult} from '@jest/types';

export default function normalizeMatcherMetadata(
  metadata: unknown,
): TestResult.MatcherMetadata | undefined {
  if (
    metadata === null ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata)
  ) {
    return undefined;
  }

  try {
    // Detach user data and apply the same rules in reporters, workers and JSON.
    const normalized: unknown = JSON.parse(JSON.stringify(metadata));
    if (
      normalized !== null &&
      typeof normalized === 'object' &&
      !Array.isArray(normalized)
    ) {
      return normalized as TestResult.MatcherMetadata;
    }
  } catch {
    // Optional metadata must never replace the original assertion failure.
  }

  return undefined;
}
