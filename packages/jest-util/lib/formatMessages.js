'use strict';

const chalk = require('chalk');
const path = require('path');

const KEEP_TRACE_LINES = 2;

function cleanStackTrace(stackTrace) {
  // Remove jasmine jonx from the stack trace
  let lines = 0;
  const keepFirstLines = () => (lines++ < KEEP_TRACE_LINES);
  return stackTrace.split('\n').filter(line => (
    keepFirstLines() ||
    !/jest(-cli)?\/(vendor|src|node_modules)\//.test(line)
  )).join('\n');
}

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
const STACK_TRACE_LINE_IGNORE_RE = new RegExp([
  '^timers.js$',
  '^' + path.resolve(__dirname, '..', 'lib', 'moduleMocker.js'),
  '^' + path.resolve(__dirname, '..', '..', 'vendor', 'jasmine'),
].join('|'));

/**
 * Given a test result, return a human readable string representing the
 * failures.
 *
 * @param {Object} testResult
 * @param {Object} config Containing the following keys:
 *   `rootPath` - Root directory (for making stack trace paths relative).
 *   `useColor` - True if message should include color flags.
 * @return {String}
 */
function formatFailureMessage(testResult, config) {
  const rootPath = config.rootPath;
  const useColor = config.useColor;

  const localChalk = new chalk.constructor({enabled: !!useColor});
  const ancestrySeparator = ' \u203A ';
  const descBullet = localChalk.bold('\u25cf ');
  const msgBullet = '  - ';
  const msgIndent = msgBullet.replace(/./g, ' ');

  if (testResult.testExecError) {
    const error = testResult.testExecError;
    return (
      descBullet + localChalk.bold('Runtime Error') + '\n' +
      (error.stack ? cleanStackTrace(error.stack) : error.message)
    );
  }

  return testResult.testResults.filter(function(result) {
    return result.failureMessages.length !== 0;
  }).map(function(result) {
    const failureMessages = result.failureMessages.map(function(errorMsg) {
      errorMsg = errorMsg.split('\n').map(function(line) {
        // Extract the file path from the trace line.
        let matches = line.match(/(^\s+at .*?\()([^()]+)(:[0-9]+:[0-9]+\).*$)/);
        if (!matches) {
          matches = line.match(/(^\s+at )([^()]+)(:[0-9]+:[0-9]+.*$)/);
          if (!matches) {
            return line;
          }
        }
        var filePath = matches[2];
        // Filter out noisy and unhelpful lines from the stack trace.
        if (STACK_TRACE_LINE_IGNORE_RE.test(filePath)) {
          return null;
        }

        return matches[1] +
          path.relative(rootPath, filePath) +
          matches[3];
      }).filter(function(line) {
        return line !== null;
      }).join('\n');

      return msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent);
    }).join('\n');

    const testTitleAncestry = result.ancestorTitles.map(function(title) {
        return localChalk.bold(title);
      }).join(ancestrySeparator) + ancestrySeparator;

    return descBullet + testTitleAncestry + result.title + '\n' +
      failureMessages;
  }).join('\n');
}

exports.cleanStackTrace = cleanStackTrace;
exports.formatFailureMessage = formatFailureMessage;
