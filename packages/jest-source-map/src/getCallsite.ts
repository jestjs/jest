/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
import callsites = require('callsites');
import {readFileSync} from 'graceful-fs';
import type {SourceMapRegistry} from './types';

// Copied from https://github.com/rexxars/sourcemap-decorate-callsites/blob/5b9735a156964973a75dc62fd2c7f0c1975458e8/lib/index.js#L113-L158
const addSourceMapConsumer = (
  callsite: callsites.CallSite,
  tracer: TraceMap,
) => {
  const getLineNumber = callsite.getLineNumber.bind(callsite);
  const getColumnNumber = callsite.getColumnNumber.bind(callsite);
  let position: ReturnType<typeof originalPositionFor> | null = null;

  function getPosition() {
    if (!position) {
      position = originalPositionFor(tracer, {
        column: getColumnNumber() ?? -1,
        line: getLineNumber() ?? -1,
      });
    }

    return position;
  }

  Object.defineProperties(callsite, {
    getColumnNumber: {
      value() {
        const value = getPosition().column;
        return value == null || value === 0 ? getColumnNumber() : value;
      },
      writable: false,
    },
    getLineNumber: {
      value() {
        const value = getPosition().line;

        return value == null || value === 0 ? getLineNumber() : value;
      },
      writable: false,
    },
  });
};

export default function getCallsite(
  level: number,
  sourceMaps?: SourceMapRegistry | null,
): callsites.CallSite {
  const levelAfterThisCall = level + 1;
  const stack = callsites()[levelAfterThisCall];
  const sourceMapFileName = sourceMaps?.get(stack.getFileName() ?? '');

  if (sourceMapFileName != null && sourceMapFileName !== '') {
    try {
      const sourceMap = readFileSync(sourceMapFileName, 'utf8');
      addSourceMapConsumer(stack, new TraceMap(sourceMap));
    } catch {
      // ignore
    }
  }

  return stack;
}
