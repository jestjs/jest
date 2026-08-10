/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  canInstrument: true,
  process(src, filename, options) {
    let code = `${src};\nglobalThis.__PREPROCESSED__ = true;`;

    if (options.instrument) {
      code = `${src};\nglobalThis.__INSTRUMENTED__ = true;`;
    }

    return {code};
  },
};
