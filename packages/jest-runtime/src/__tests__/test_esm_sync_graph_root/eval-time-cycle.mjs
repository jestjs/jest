/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';

const require = createRequire(import.meta.url);
let observedCode;
try {
  require('./eval-time-cycle.mjs');
} catch (error) {
  observedCode = error.code;
}
export const observed = observedCode;
