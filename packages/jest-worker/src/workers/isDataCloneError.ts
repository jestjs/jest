/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// https://webidl.spec.whatwg.org/#datacloneerror
const DATA_CLONE_ERROR_CODE = 25;

/**
 * Unfortunately, [`util.types.isNativeError(value)`](https://nodejs.org/api/util.html#utiltypesisnativeerrorvalue)
 * return `false` for `DataCloneError` error.
 * For this reason, try to detect it in this way
 */
export function isDataCloneError(error: unknown): error is DOMException {
  return (
    error != null &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'DataCloneError' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'code' in error &&
    error.code === DATA_CLONE_ERROR_CODE
  );
}
