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
          jsx: tsc.JsxEmit.React,
          module: tsc.ModuleKind.CommonJS,
          sourceMap: true, // if code is transformed, source map is necessary for coverage
        },
        fileName,
      });

      return {code: outputText, map: sourceMapText};
    }
    return {code: sourceText};
  },
};
