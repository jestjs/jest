// Copyright 2004-present Facebook. All Rights Reserved.

const tsc = require('typescript');

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      let code = tsc.transpile(
        src,
        {
          module: tsc.ModuleKind.CommonJS,
          jsx: tsc.JsxEmit.React,
        },
        path,
        []
      );
      code = code.replace(/(}\)\()(.*\|\|.*;)/g, '$1/* istanbul ignore next */$2');
      code = code.replace(/(var __extends = \(this && this.__extends\))/g, '$1/* istanbul ignore next */');
      return code;
    }
    return src;
  },
};
