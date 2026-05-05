/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ESM file that imports babel-style __esModule CJS so loadCjsAsEsm is exercised.
export * from './babel-esmodule.cjs';
export {default} from './babel-esmodule.cjs';
