/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jsonFromNested} from './wraps-nested-json.mjs';
import * as data from './data.json' with {type: 'json'};

export const sameJson = data === jsonFromNested;
