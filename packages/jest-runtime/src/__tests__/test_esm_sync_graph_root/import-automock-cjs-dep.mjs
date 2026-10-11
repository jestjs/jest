/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cjsDep from './automock-cjs-dep.cjs';

export const runIsMock = cjsDep.run._isMockFunction === true;
export const cjsTag = cjsDep.tag;
