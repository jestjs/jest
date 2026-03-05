/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Replaces backslashes with forward slashes (equivalent to the `slash` package).
export default function slash(path: string): string {
  return path.replaceAll('\\', '/');
}
