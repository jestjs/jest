/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Importing a TLA dep makes the whole graph async — exercises the
// `hasAsyncGraph()` fallback in the v24.9+ sync core.
export {value} from './with-tla.mjs';
export const wrapper = 'wrapper';
