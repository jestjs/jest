/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SourceTextModule, SyntheticModule} from 'node:vm';

export const runtimeSupportsVmModules = typeof SyntheticModule === 'function';

export const supportsSyncEvaluate =
  // @ts-expect-error - `hasAsyncGraph` is in Node v24.9+, not yet typed in @types/node@18
  typeof SourceTextModule?.prototype.hasAsyncGraph === 'function';

export const supportsNodeColonModulePrefixInRequire = (() => {
  try {
    require('node:fs');
    return true;
  } catch {
    return false;
  }
})();
