/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class ErrorWithStack extends Error {
  constructor(
    message: string | undefined,
    callsite: (...args: Array<any>) => unknown,
    stackLimit?: number,
  ) {
    // Ensure we have a large stack length so we get full details.
    const originalStackLimit = Error.stackTraceLimit;
    if (stackLimit) {
      Error.stackTraceLimit = Math.max(stackLimit, originalStackLimit || 10);
    }

    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, callsite);
    }

    Error.stackTraceLimit = originalStackLimit;
  }
}
