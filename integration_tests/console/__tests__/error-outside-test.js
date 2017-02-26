/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

console.log('HEY, I SHOULD BE PRINTED');

throw new Error('will crash before even running tests');

/* eslint-disable no-unreachable */
test(`let's not go there`, () => {});
