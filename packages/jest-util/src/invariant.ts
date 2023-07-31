/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function invariant(
  condition: unknown,
  message = '',
): asserts condition {
  if (!condition) {
    throw new Error(
      `${
        message ? `${message} ` : ''
      }This is a bug in Jest, please report an issue!`,
    );
  }
}
