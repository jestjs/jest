var colors = require('./lib/colors');
var path = require('path');
var utils = require('./lib/utils');

var FAIL_COLOR = colors.RED_BG;
var PASS_COLOR = colors.GREEN_BG;
var TEST_TITLE_COLOR = colors.BOLD + colors.UNDERLINE;

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
var STACK_TRACE_LINE_IGNORE_RE = new RegExp('^(?:' + [
    path.resolve(__dirname, '..', 'node_modules', 'q'),
    path.resolve(__dirname, '..', 'src', 'vendor', 'jasmine')
].join('|') + ')');

function _printConsoleMessage(msg) {
  switch (msg.type) {
    case 'error':
      // TODO: jstest doesn't print console.error messages.
      //       This is a big WAT, and we should come back to this -- but
      //       right now the goal is jest/jstest feature parity, not test
      //       cleanup.
      break;

      console.error.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colors.colorize(arg, colors.RED);
      }));
      break;
    case 'log':
      console.log.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colors.colorize(arg, colors.GRAY);
      }));
      break;
    case 'warn':
      // TODO: jstest doesn't print console.warn messages.
      //       Turning this on gets pretty noisy...but we should probably
      //       clean this up as warns are likely a sign of clownitude
      break;
      console.warn.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colors.colorize(arg, colors.RED);
      }));
      break;
    default:
      throw new Error('Unknown console message type!: ' + JSON.stringify(msg));
  }
}

function _printTestResultSummary(passed, testPath, runTime) {
  var passFailTag = passed
    ? colors.colorize(' PASS ', PASS_COLOR)
    : colors.colorize(' FAIL ', FAIL_COLOR);

  var summary = passFailTag + ' ' + colors.colorize(testPath, TEST_TITLE_COLOR);

  if (runTime) {
    var runTimeStr = '(' + runTime + 's)';
    if (runTime > 2.5) {
      runTimeStr = colors.colorize(runTimeStr, FAIL_COLOR);
    }
    summary += ' ' + runTimeStr;
  }

  console.log(summary);
}

function defaultTestResultHandler(config, testResult) {
  var pathStr =
    config.rootDir
    ? path.relative(config.rootDir, testResult.testFilePath)
    : testResult.testFilePath;

  if (testResult.testExecError) {
    _printTestResultSummary(false, pathStr);
    console.log(testResult.testExecError);
    return false;
  }

  var filteredResults = utils.filterPassingSuiteResults(testResult);
  var allTestsPassed = filteredResults === null;

  var testRunTime =
    testResult.stats
    ? (testResult.stats.end - testResult.stats.start) / 1000
    : null;

  _printTestResultSummary(allTestsPassed, pathStr, testRunTime);

  testResult.consoleMessages.forEach(_printConsoleMessage);

  if (!allTestsPassed) {
    var descBullet = colors.colorize('\u25cf ', colors.BOLD);
    var msgBullet = '  - ';
    var msgIndent = msgBullet.replace(/./g, ' ');

    var flattenedResults = utils.flattenSuiteResults(filteredResults);

    var testErrors;
    for (var testDesc in flattenedResults.failingTests) {
      testErrors = flattenedResults.failingTests[testDesc];

      console.log(descBullet + testDesc);
      testErrors.forEach(function(errorMsg) {
        // Filter out q and jasmine entries from the stack trace.
        // They're super noisy and unhelpful
        errorMsg = errorMsg.split('\n').filter(function(line) {
          if (/^\s+at .*?/.test(line)) {
            // Extract the file path from the trace line
            var filePath = line.match(/(?:\(|at (?=\/))(.*):[0-9]+:[0-9]+\)?$/);
            if (filePath
                && STACK_TRACE_LINE_IGNORE_RE.test(filePath[1])) {
              return false;
            }
          }
          return true;
        }).join('\n');
        console.log(msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent));
      });
    }
  }

  return allTestsPassed;
}

module.exports = defaultTestResultHandler;
