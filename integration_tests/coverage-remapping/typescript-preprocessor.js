// Copyright 2004-present Facebook. All Rights Reserved.

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
        content: result.outputText,
        sourceMap: JSON.parse(result.sourceMapText),
      };
    }
    return src;
  },
};
