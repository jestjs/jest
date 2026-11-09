/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SourceTextModule, SyntheticModule} from 'node:vm';

export const runtimeSupportsVmModules = typeof SyntheticModule === 'function';

// Node 22 (V8 12.4) is the first release where `vm.compileFunction` uses V8's
// isolate compilation cache (https://chromium-review.googlesource.com/c/v8/v8/+/4962094).
// Before that, every test file would recompile each module it loads.
// `vm.Script` uses the cache on every version.
export const compileFunctionUsesIsolateCache =
  Number(process.versions.v8.split('.')[0]) >= 12;

export const supportsSyncEvaluate =
  // @ts-expect-error - `hasAsyncGraph` is in Node v24.9+, not yet typed in @types/node@18
  typeof SourceTextModule?.prototype.hasAsyncGraph === 'function';
