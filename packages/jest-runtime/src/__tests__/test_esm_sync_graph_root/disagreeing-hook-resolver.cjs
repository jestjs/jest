/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('node:path');

module.exports = {
  async: async (specifier, options) => {
    if (specifier === 'disagreeing-alias') {
      return path.join(__dirname, 'automock-dep.mjs');
    }
    return options.defaultResolver(specifier, options);
  },
  sync: (specifier, options) => {
    if (specifier === 'disagreeing-alias') {
      return path.join(__dirname, 'automock-manual-dep.mjs');
    }
    return options.defaultResolver(specifier, options);
  },
};
