/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Module} from '@jest/environment';

// Shared cell for `require.main`: the executor writes it when the test file
// loads, the require-builder reads it when attaching `module.require`.
export class TestMainModule {
  current: Module | null = null;

  reset(): void {
    this.current = null;
  }
}
