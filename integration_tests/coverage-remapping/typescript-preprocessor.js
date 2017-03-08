/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const tsc = require('typescript');

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      const result = tsc.transpileModule(
        src,
        {
          compilerOptions: {
            module: tsc.ModuleKind.CommonJS,
            sourceMap: true,
          },
          fileName: path,
        }
      );
      return {
        code: result.outputText,
        map: JSON.parse(result.sourceMapText),
      };
    }
    return src;
  },
};
