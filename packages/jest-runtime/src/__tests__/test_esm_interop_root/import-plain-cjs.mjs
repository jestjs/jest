/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ESM file that imports a plain CJS module (no __esModule flag) so loadCjsAsEsm is exercised.
export * from './plain-cjs.cjs';
export {default} from './plain-cjs.cjs';
