/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Some of the `jest-runtime` tests are very slow and cause
// timeouts on travis
jasmine.DEFAULT_TIMEOUT_INTERVAL = 70000;
