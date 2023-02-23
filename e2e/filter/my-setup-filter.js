/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const setupData = {
  filterText: 'this will return no tests',
};

module.exports = function (tests) {
  return {
    filtered: tests
      .filter(t => t.indexOf(setupData.filterText) !== -1)
      .map(test => ({test})),
  };
};

module.exports.setup = function () {
  return new Promise(resolve => {
    setTimeout(() => {
      setupData.filterText = 'foo';
      resolve();
    }, 1000);
  });
};
