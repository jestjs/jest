var fs = require('fs'),
    _ = require('underscore');

var templateFile = require.resolve('cover/templates/instrumentation_header'),
    instrument = require('cover/instrument'),
    storeScriptFile = require.resolve('cover/coverage_store'),
    store = require('cover/coverage_store');

var instrumentedData = {},
    coverageFilesMap = {},
    // A map of file to encoded strings of coverage info, e.g.:
    // {
    //   'path/to/file.js': 'NNCCUUNN',
    //   ...
    // }
    coverageInfo = {};

var template = _.template(fs.readFileSync(templateFile, 'utf8'));

function _transformScript(script, file) {
  // Take use of node-cover's instrument.js module to transform script
  var instrumented = instrument(script);
  instrumentedData[file] = instrumented;
  var transformed = template({
    instrumented: instrumented,
    coverageStorePath: storeScriptFile,
    filename: file,
    source: instrumented.instrumentedSource
  });

  return transformed;
}

/**
 * Translate the coverage info
 *
 * encode info into a string of one char for each line:
 *   N - not executed;
 *   C - covered;
 *   U - uncovered.
 *
 * instrumented is in the following format:
 * {
 *   nodes: {
 *     0: {
 *       loc: {
 *         start: { line: 4, column: 3 },
 *         end: { line: 4, column: 14 }
 *       },
 *       ...
 *     },
 *     1: {
 *       loc: {
 *         start: { line: 5, column: 5 },
 *         end: { line: 5, column: 10 }
 *       },
 *       ...
 *     },
 *     2: {
 *       loc: {
 *         start: { line: 10, column: 3 },
 *         end: { line: 10, column: 14 }
 *       },
 *       ...
 *     },
 *     ...
 *   },
 *   ...
 * }
 *
 * coverage is in the following format:
 * {
 *   nodes: {
 *     0: { index: 0, count: 4 },
 *     2: { index: 4, count: 1 },
 *     ...
 *   },
 *   ...
 * }
 *
 */
function _translateCoverageInfo(coverage, instrumented) {
  var lineNumber = 1;
  var nextLineNumber = -1;
  var nodeIdx = 0;
  var translated = '';
  var nodesCount = Object.keys(instrumented.nodes).length;
  while (nodeIdx < nodesCount) {
    nextLineNumber = instrumented.nodes[nodeIdx].loc.start.line;
    if (nextLineNumber == lineNumber) {
      // If the line number is hit, mark it 'C'(overed) or 'U'(ncovered)
      // and move line number to the next
      if (coverage.nodes[nodeIdx] && coverage.nodes[nodeIdx].count) {
        translated += 'C';
      } else {
        translated += 'U';
      }
      lineNumber++;
      nodeIdx++;
    } else if (nextLineNumber > lineNumber) {
      // If line number has not hit the line of next node, it means
      // there are several lines that are not executable code, mark them
      // 'N'(ot executed) and move line number to the line of next node.
      while (lineNumber < nextLineNumber) {
        translated += 'N';
        lineNumber++;
      }
    } else {
      // If line number has go pass the next node index. This happens in case of
      // nested nodes:
      //
      // return (A) &&
      //        (B);
      //
      // Then there are 3 nodes:
      //   34: {
      //     loc: {
      //       start: { line: 56, column: 1 },
      //       end: { line: 57, column: 10 }
      //     }
      //   },
      //   35: {
      //     loc: {
      //       start: { line: 56, column: 8 },
      //       end: { line: 56, column: 10 }
      //     }
      //   },
      //   36: {
      //     loc: {
      //       start: { line: 57, column: 8 },
      //       end: { line: 57, column: 10 }
      //     }
      //   }
      //
      // nodes[34].loc.start.line == nodes[35].loc.start.line
      nodeIdx++;
    }
  }
  return translated;
}

module.exports = {
  /**
   * Set a list of files which need coverage info
   *
   * @param array of files
   */
  setCoverageFiles: function(files) {
    coverageFilesMap = {};
    coverageInfo = {};
    files.forEach(function(file) {
      coverageFilesMap[file] = true;
    });
  },

  /**
   * Get the list of files which need coverage info
   */
  getCoverageFiles: function() {
    return Object.keys(coverageFilesMap);
  },

  /**
   * Check whether a file needs coverage info
   *
   * @param file path
   */
  needsCoverage: function(file) {
    return !!coverageFilesMap[file];
  },

  /**
   * Parse and transform script to a new one which can be used for code coverage
   * info collection.
   *
   * @param script
   * @param file path
   */
  transformScript: _transformScript,

  /**
   * Collect raw coverage info from coverage_store.js then encode into a string.
   */
  collectCoverageInfo: function() {
    var rawInfo = null;
    var instrumented = null;
    for (var file in coverageFilesMap) {
      // Collect raw data from coverage_store.js
      rawInfo = store.getStore(file);
      instrumented = instrumentedData[file];
      if (rawInfo && rawInfo.nodes && instrumented) {
        // translate raw data to an encoded string
        coverageInfo[file] = _translateCoverageInfo(rawInfo, instrumented);
      }
    }
    return coverageInfo;
  },

  /**
   * Add coverage info and union it to the existing info. This is called when
   * tests finish and incrementally update the coverage info.
   */
  addCoverageInfo: function(info) {
    for (var file in info) {
      // If coverage info was not there, put the new info to the place,
      // otherwise, union the info.
      if (!coverageInfo[file]) {
        coverageInfo[file] = info[file];
      } else {
        var encoded = '';
        for (var i = 0; i < info[file].length; i++) {
          // Only use the new info if the char is 'C'
          if (info[file].substring(i, i + 1) == 'C') {
            encoded += 'C';
          } else {
            encoded += coverageInfo[file].substring(i, i + 1);
          }
        }
        coverageInfo[file] = encoded;
      }
    }
  },

  /**
   * Get coverage info for certain file.
   */
  getCoverageInfo: function(file) {
    return (coverageInfo[file] ? coverageInfo[file] : '');
  }

};
