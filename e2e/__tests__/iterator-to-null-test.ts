/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/* eslint-disable no-extend-native */
Array.prototype[Symbol.iterator] = null;
String.prototype[Symbol.iterator] = null;
/* eslint-enable */

test('modifying global object does not affect test runner', () => {});
