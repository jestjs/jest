// Copyright 2004-present Facebook. All Rights Reserved.

const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      const {outputText, sourceMapText} = tsc.transpileModule(src, {
        compilerOptions: tsConfig.compilerOptions,
        fileName: path,
        reportDiagnostics: false,
      });
      // Transformers can return a string with the transformed source text
      // or a {code, map} if source maps are available
      return {code: outputText, map: sourceMapText};
    }
    return src;
  },
};
