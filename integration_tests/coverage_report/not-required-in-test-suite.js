/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

throw new Error(
  `this error should not be a problem because` +
    `this file is never required or executed`
);

// Flow annotations to make sure istanbul can instrument non ES6 source
/* eslint-disable no-unreachable */
module.exports = function(j: string, d: string): string {
  if (j) {
    return d;
  } else {
    return j + d;
  }
};
