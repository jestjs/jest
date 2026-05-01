/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The data: URI body uses top-level await; require()-ing this file must
// surface ERR_REQUIRE_ASYNC_MODULE rather than silently bailing.
import {v} from 'data:text/javascript,export const v=await Promise.resolve(1);';

export const value = v;
