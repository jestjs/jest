/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const tsc = require('typescript');

module.exports = {
  process(sourceText, fileName) {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      const {outputText, sourceMapText} = tsc.transpileModule(sourceText, {
        compilerOptions: {
          inlineSourceMap: true,
          module: tsc.ModuleKind.CommonJS,
          target: 'es5',
        },
        fileName,
      });

      return {code: outputText, map: sourceMapText};
    }
    return {code: sourceText};
  },
};
