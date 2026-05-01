/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TLA inside the data: URI body, not in this file.
import {v} from 'data:text/javascript,export const v=await Promise.resolve(1);';

export const value = v;
