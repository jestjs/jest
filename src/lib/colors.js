/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const RESET = '\x1B[0m';

exports.BOLD = '\x1B[1m';
exports.GRAY = '\x1B[90m';
exports.GREEN = '\x1B[32m';
exports.GREEN_BG = '\x1B[42m';
exports.MAGENTA_BG = '\x1B[45m';
exports.RED = '\x1B[31m';
exports.RED_BG = '\x1B[41m';
exports.RESET = RESET;
exports.UNDERLINE = '\x1B[4m';
exports.YELLOW = '\x1B[33m';

exports.colorize = function colorize(str, color) {
  return color + str.toString().split(RESET).join(RESET + color) + RESET;
};
