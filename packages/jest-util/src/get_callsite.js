import type {SourceMapRegistry} from 'types/SourceMaps';

import fs from 'fs';
import callsites from 'callsites';
import {SourceMapConsumer} from 'source-map';

// Copied from https://github.com/rexxars/sourcemap-decorate-callsites/blob/5b9735a156964973a75dc62fd2c7f0c1975458e8/lib/index.js#L113-L158
const addSourceMapConsumer = (callsite, consumer) => {
  try {
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
  } catch (e) {
    // ignored
  }
};

export default (level: number, sourceMaps: SourceMapRegistry) => {
  const levelAfterThisCall = level + 1;
  const stack = callsites()[levelAfterThisCall];
  const sourceMapFileName = sourceMaps && sourceMaps[stack.getFileName()];

  try {
    if (sourceMapFileName) {
      const sourceMap = fs.readFileSync(sourceMapFileName, 'utf8');
      if (sourceMap) {
        addSourceMapConsumer(stack, new SourceMapConsumer(sourceMap));
      }
    }

    return stack;
  } catch (e) {
    return null;
  }
};
