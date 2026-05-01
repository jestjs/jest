/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ESM module that pulls in a CJS dependency — exercises the
// CJS-as-ESM branch from inside the sync graph walker.
import {cjsValue} from './cjs-dep.cjs';

export {cjsValue};
