/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Serialize string (especially empty) without enclosing punctuation.
module.exports = {
  print: val => val,
  test: val => typeof val === 'string',
};
