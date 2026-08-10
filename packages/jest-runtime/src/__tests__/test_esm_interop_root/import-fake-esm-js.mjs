/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ESM entry that imports a .js file with ESM syntax but no type:module marker.
// Exercises the SyntaxError-fallback path in loadCjsAsEsm.
export {fakeEsmValue} from './fake-esm-js.js';
