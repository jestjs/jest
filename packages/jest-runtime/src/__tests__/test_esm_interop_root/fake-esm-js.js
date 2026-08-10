/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// A .js file that contains ESM syntax but lives in a directory whose
// package.json has no "type":"module".  Jest cannot detect it as ESM via
// file-extension or package.json, so loadCjsAsEsm must fall back to loading
// it as a native ESM SourceTextModule after the SyntaxError retry.
export const fakeEsmValue = 123;
