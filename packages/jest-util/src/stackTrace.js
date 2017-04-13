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

const implementPrepareStackTrace = (
  Error: Class<Error>,
  filterStackTracePattern: RegExp,
) => {
  const patterns = [FILTER_NOISE, filterStackTracePattern];

  Error.prepareStackTrace = (error, structuredStackTrace) => {
    const filteredStackTrace = structuredStackTrace
      .filter(
        (callsite, index) =>
          !filterNoise(callsite.getFileName(), index, patterns),
      )
      .map(callsite => {
        const functionName = callsite.getFunctionName() || '<anonymous>';
        const filename = callsite.getFileName() || '';
        const line = callsite.getLineNumber() || '0';
        const column = callsite.getColumnNumber() || '0';
        return `at ${functionName} (${filename}:${line}:${column})`;
      });

    return `${error.name}: ` +
      `${error.message}\n${filteredStackTrace.join('\n')}`;
  };
};

module.exports = {
  implementPrepareStackTrace,
};
