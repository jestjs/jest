/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-extend-native */

'use strict';

Array.prototype[Symbol.iterator] = null;
String.prototype[Symbol.iterator] = null;

test('modifying global object does not affect test runner', () => {});
