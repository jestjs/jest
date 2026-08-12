/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
// TODO: replace with `util.getCallSites()`, whose `columnNumber` landed in
// Node 22.14 — the floor is still 18.
import callsites from 'callsites';
import {getSourceMapCache} from './getSourceMapCache';
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
    // The needle is zero-based while V8 counts columns from one, so looking up
    // V8's number directly finds the segment one column to the right.
    position ??= originalPositionFor(tracer, {
      column: (getColumnNumber() ?? 1) - 1,
      line: getLineNumber() ?? -1,
    });

    return position;
  }

  Object.defineProperties(callsite, {
    getColumnNumber: {
      value() {
        // TODO: return `column + 1` in Jest 31, so this matches V8 and
        // jest-circus. Reported zero-based until then, which is what
        // `--testLocationInResults` documents for jest-jasmine2, and changing
        // it breaks anyone reading that field. An unmapped position falls back
        // to V8's one-based column, as it always has — the Jest 31 change
        // turns that fallback consistent instead of one off.
        const {column} = getPosition();

        return column ?? getColumnNumber();
      },
      writable: false,
    },
    getLineNumber: {
      value() {
        const {line} = getPosition();

        return line ?? getLineNumber();
      },
      writable: false,
    },
  });
};

/**
 * One remapped `CallSite`, `level` frames above the caller. Shares its parsed
 * maps with `installSourceMaps`.
 */
export default function getCallsite(
  level: number,
  sourceMaps?: SourceMapRegistry | null,
): callsites.CallSite {
  const levelAfterThisCall = level + 1;
  const stack = callsites()[levelAfterThisCall];
  const sourceMap = getSourceMapCache(sourceMaps).get(
    stack.getFileName() ?? '',
  );

  if (sourceMap != null) {
    addSourceMapConsumer(stack, sourceMap);
  }

  return stack;
}
