/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  process(src, filename, options) {
    const code = `${src};\nglobalThis.__PREPROCESSED__ = true;`;

    return {code};
  },
};
