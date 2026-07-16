/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = {
  process(src, filename) {
    if (/bar.js$/.test(filename)) {
      return {code: `${src};\nmodule.exports = createPlugin('bar');`};
    }
    return {code: src};
  },
};
