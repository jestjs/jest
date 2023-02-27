/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  process(code, path) {
    if (path.includes('common')) {
      console.log(path);
    }

    return {code};
  },
};
