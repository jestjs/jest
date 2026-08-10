/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

module.exports = {
  process(src, filename) {
    const code = `
    module.exports = '${path.basename(filename)}';
  `;

    return {code};
  },
};
