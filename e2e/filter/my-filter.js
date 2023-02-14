/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = function (tests) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        filtered: tests
          .filter(t => t.indexOf('foo') !== -1)
          .map(test => ({message: 'some message', test})),
      });
    }, 100);
  });
};
