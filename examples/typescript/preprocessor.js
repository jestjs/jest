// Copyright 2004-present Facebook. All Rights Reserved.

const tsc = require('typescript');

module.exports = {
    process(src, path) {
        if (path.endsWith('.ts') || path.endsWith('.tsx')) {
            return tsc.transpile(
                src, {
                    module: tsc.ModuleKind.CommonJS,
                    jsx: tsc.JsxEmit.React,
                },
                path, []
            )
            .replace(/(}\)\()(.*\|\|.*;)/g, '$1/* istanbul ignore next */$2')
            .replace(/(var __extends = \(this && this.__extends\))/g, '$1/* istanbul ignore next */')
            .replace(/(var __assign = \(this && this.__assign\) \|\| Object.assign)/g, '$1 /* istanbul ignore next */');
        }
        return src;
    },
};

