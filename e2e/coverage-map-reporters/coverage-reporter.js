/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {ReportBase} = require('istanbul-lib-report');

module.exports = class extends ReportBase {
  onStart() {
    console.log(JSON.stringify({event: 'coverage report'}));
  }
};
