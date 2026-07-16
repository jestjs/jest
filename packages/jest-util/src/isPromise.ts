/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function isPromise<T = unknown>(
  candidate: unknown,
): candidate is PromiseLike<T> {
  return (
    candidate != null &&
    (typeof candidate === 'object' || typeof candidate === 'function') &&
    typeof (candidate as any).then === 'function'
  );
}
