/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  canInstrument: true,
  process(src, filename, config, options) {
    src = `${src};\nglobal.__PREPROCESSED__ = true;`;

    if (options.instrument) {
      src = `${src};\nglobal.__INSTRUMENTED__ = true;`;
    }

    return src;
  },
};
