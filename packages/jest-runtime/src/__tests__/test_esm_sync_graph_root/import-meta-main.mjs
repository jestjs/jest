/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {mainValue} from './meta-main.mjs';
export const depMain = mainValue;
export const ownMain = import.meta.main;
