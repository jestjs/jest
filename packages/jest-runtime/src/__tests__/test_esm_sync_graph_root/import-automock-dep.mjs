/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {greet, value} from './automock-dep.mjs';

export {greet} from './automock-dep.mjs';
export const greetIsMock = greet._isMockFunction === true;
export const greetResult = greet();
export const depValue = value;
