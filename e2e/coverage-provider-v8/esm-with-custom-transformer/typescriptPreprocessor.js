/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ts from 'typescript';

export default {
  process(sourceText, fileName) {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      const {outputText, sourceMapText} = ts.transpileModule(sourceText, {
        compilerOptions: {
          module: ts.ModuleKind.ES2020,
          sourceMap: true, // if code is transformed, source map is necessary for coverage
          target: ts.ScriptTarget.ES2020,
        },
        fileName,
      });

      return {code: outputText, map: sourceMapText};
    }
    return {code: sourceText};
  },
};
