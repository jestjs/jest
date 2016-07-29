/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const shouldBeCovered = require('jest-config').shouldBeCovered;

module.exports = {
  INSTRUMENTS: true,
  process(src, filename, config) {
    src = `${src};\nglobal.__PREPROCESSED__ = true;`;

    if (shouldBeCovered(filename, config)) {
      src = `${src};\nglobal.__INSTRUMENTED__ = true;`;
    }

    return src;
  },
};
