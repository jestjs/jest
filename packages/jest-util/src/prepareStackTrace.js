/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

// eslint-disable-next-line max-len
const FILTER_NOISE = /(\/|\\)jest(-.*?)?(\/|\\)(vendor|build|node_modules|packages)(\/|\\)/;

const filterNoise = (
  filename: ?string = '',
  index: number,
  patterns: Array<RegExp>,
) => index !== 0 && patterns.map(pattern => pattern.test(filename || ''));

const getCallSiteData = (callsite: CallSite) => {
  return {
    columnNumber: callsite.getColumnNumber() || '0',
    evalOrigin: callsite.getEvalOrigin(),
    fileName: callsite.getFileName() || '',
    function: callsite.getFunction(),
    functionName: callsite.getFunctionName() || '<anonymous>',
    isConstructor: callsite.isConstructor(),
    isEval: callsite.isEval(),
    isNative: callsite.isNative(),
    isToplevel: callsite.isToplevel(),
    lineNumber: callsite.getLineNumber() || '0',
    methodName: callsite.getMethodName(),
    this: callsite.getThis(),
    typeName: callsite.getTypeName(),
  };
};

const prepareStackTrace = (
  filterStackTracePattern?: RegExp,
  expand?: boolean,
) => {
  const patterns = [FILTER_NOISE];

  if (filterStackTracePattern) {
    patterns.push(filterStackTracePattern);
  }

  return (error: Error, structuredStackTrace: Array<CallSite>) => {
    let data;
    const filteredStackTrace = structuredStackTrace
      .filter(
        (callsite, index) =>
          !filterNoise(callsite.getFileName(), index, patterns),
      )
      .map(callsite => {
        data = getCallSiteData(callsite);
        return `at ${data.functionName} ` +
          `(${data.fileName}:${data.lineNumber}:${data.columnNumber})`;
      });

    return `${error.name}: ` +
      `${error.message}\n${filteredStackTrace.join('\n')}`;
  };
};

module.exports = prepareStackTrace;
