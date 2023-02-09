/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function invalidTeardownWithNamedExport(jestConfig): void {
  console.log(jestConfig.testPathPattern);
}

export {invalidTeardownWithNamedExport};
