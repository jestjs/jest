/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

// Allow people to use `jest-circus/runner` as a runner.
const runner = require('./build/legacy_code_todo_rewrite/jest_adapter');
module.exports = runner;
