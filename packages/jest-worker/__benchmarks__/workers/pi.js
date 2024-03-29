/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = function () {
  const points = 10_000;
  let inside = 0;

  for (let i = 0; i < points; i++) {
    if (Math.pow(Math.random(), 2) + Math.pow(Math.random(), 2) <= 1) {
      inside++;
    }
  }

  return (4 * inside) / points;
};
