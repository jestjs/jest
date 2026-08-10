/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// CJS pattern where module.exports is a function with own-property named exports.
'use strict';

function parse(input) {
  return {input};
}

parse.splitCookiesString = function splitCookiesString(str) {
  return str.split(',');
};

parse.helper = function helper(x) {
  return x * 2;
};

module.exports = parse;
