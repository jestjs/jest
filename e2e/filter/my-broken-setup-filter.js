/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = function (tests) {
  return {
    filtered: tests.filter(t => t.indexOf('foo') !== -1).map(test => ({test})),
  };
};

module.exports.setup = function () {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('My broken setup filter error.'));
    }, 0);
  });
};
