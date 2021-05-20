/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class ErrorWithStack extends Error {
  constructor(
    message: string | undefined,
    callsite: (...args: Array<any>) => unknown,
  ) {
    // Ensure we have a large stack length so we get full details.
    const stackLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = Math.max(100, stackLimit || 10);

    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, callsite);
    }

    Error.stackTraceLimit = stackLimit;
  }
}
