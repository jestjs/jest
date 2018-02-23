/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SourceMapRegistry} from 'types/SourceMaps';

import fs from 'graceful-fs';
import callsites from 'callsites';
import {SourceMapConsumer} from 'source-map';

// Copied from https://github.com/rexxars/sourcemap-decorate-callsites/blob/5b9735a156964973a75dc62fd2c7f0c1975458e8/lib/index.js#L113-L158
const addSourceMapConsumer = (callsite, consumer) => {
  const getLineNumber = callsite.getLineNumber;
  const getColumnNumber = callsite.getColumnNumber;
  let position = null;

  function getPosition() {
    if (!position) {
      position = consumer.originalPositionFor({
        column: getColumnNumber.call(callsite),
        line: getLineNumber.call(callsite),
      });
    }

    return position;
  }

  Object.defineProperties(callsite, {
    getColumnNumber: {
      value() {
        return getPosition().column || getColumnNumber.call(callsite);
      },
      writable: false,
    },
    getLineNumber: {
      value() {
        return getPosition().line || getLineNumber.call(callsite);
      },
      writable: false,
    },
  });
};

export default (level: number, sourceMaps: ?SourceMapRegistry) => {
  const levelAfterThisCall = level + 1;
  const stack = callsites()[levelAfterThisCall];
  const sourceMapFileName = sourceMaps && sourceMaps[stack.getFileName()];

  if (sourceMapFileName) {
    try {
      const sourceMap = fs.readFileSync(sourceMapFileName, 'utf8');
      addSourceMapConsumer(stack, new SourceMapConsumer(sourceMap));
    } catch (e) {
      // ignore
    }
  }

  return stack;
};
