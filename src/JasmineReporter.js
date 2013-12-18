var colors = require('./lib/colors');
var diff = require('diff');
var jasmine = require('./vendor/jasmine/jasmine-1.3.0').jasmine;
var Q = require('q');

var colorize = colors.colorize;

var ERROR_TITLE_COLOR = colors.RED + colors.BOLD + colors.UNDERLINE;
var DIFFABLE_MATCHERS = {
  toBe: true,
  toNotBe: true,
  toEqual: true,
  toNotEqual: true
};

function _highlightDifferences(a, b) {
  var changes = diff.diffChars(a, b);

  var ret = {a: '', b: ''};
  var change;
  for (var i = 0, il = changes.length; i < il; i++) {
    change = changes[i];
    if (change.added) {
      ret.b += colorize(change.value, colors.RED_BG);
    } else if (change.removed) {
      ret.a += colorize(change.value, colors.RED_BG);
    } else {
      ret.a += change.value;
      ret.b += change.value;
    }
  }
  return ret;
}

function _prettyPrint(obj, indent) {
  if (!indent) {
    indent = '';
  }

  if (typeof obj === 'object' && obj !== null) {
    if (jasmine.isDomNode(obj)) {
      var attrStr = '';
      Array.prototype.forEach.call(obj.attributes, function(attr) {
        var attrName = attr.nodeName.trim();
        var attrValue = attr.nodeValue.trim();
        attrStr += ' ' + attrName + '="' + attrValue + '"';
      });
      return 'HTMLNode(' +
        '<' + obj.tagName + attrStr + '>[...]</' + obj.tagName + '>' +
      ')';
    }

    if (obj.__jstest_pp_cycle__) {
      return '<circular reference>';
    }
    obj.__jstest_pp_cycle__ = true;

    var orderedKeys = Object.keys(obj).sort();
    var value;
    var keysOutput = [];
    var keyIndent = colorize('|', colors.GRAY) + ' ';
    for (var i = 0; i < orderedKeys.length; i++) {
      if (orderedKeys[i] === '__jstest_pp_cycle__') {
        continue;
      }
      value = obj[orderedKeys[i]];
      keysOutput.push(
        indent + keyIndent + orderedKeys[i] + ': ' +
        _prettyPrint(value, indent + keyIndent)
      );
    }
    delete obj.__jstest_pp_cycle__;
    return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
  } else {
    return jasmine.pp(obj);
  }
}

function _extractSuiteResults(container, suite) {
  var suiteResults = {};
  suite.suites().forEach(_extractSuiteResults.bind(null, suiteResults));

  var specResults = {};
  suite.specs().forEach(_extractSpecResults.bind(null, specResults));

  container[suite.description] = {
    suites: suiteResults,
    tests: specResults
  };
};

function _extractSpecResults(container, spec) {
  var failureMessages = [];
  var logMessages = [];
  var numPassingTests = 0;

  spec.results().getItems().forEach(function(result) {
    switch (result.type) {
      case 'log':
        logMessages.push(result.toString());
        break;
      case 'expect':
        if (result.passed()) {
          numPassingTests++;
        } else if (!result.matcherName && result.trace.stack) { // exception thrown
          // jasmine doesn't give us access to the actual Error object, so we
          // have to regexp out the message from the stack string in order to
          // colorize the `message` value
          result.trace.stack = result.trace.stack.replace(
            /(^.*$(?=\n\s*at))/m,
            colorize('$1', ERROR_TITLE_COLOR)
          );

          failureMessages.push(result.trace.stack);
        } else {
          var message;
          if (DIFFABLE_MATCHERS[result.matcherName]) {
            var ppActual = _prettyPrint(result.actual);
            var ppExpected = _prettyPrint(result.expected);
            var colorDiff = _highlightDifferences(ppActual, ppExpected);

            message =
              colorize('Expected:', ERROR_TITLE_COLOR) +
                ' ' + colorDiff.a +
                ' ' + colorize(result.matcherName + ':', ERROR_TITLE_COLOR) +
                ' ' + colorDiff.b;
          } else {
            message = colorize(result.message, ERROR_TITLE_COLOR);
          }

          if (result.trace.stack) {
            // Replace the error message with a colorized version of the error
            message = result.trace.stack.replace(result.trace.message, message);

            // Remove the 'Error: ' prefix from the stack trace
            message = message.replace(/^.*Error:\s*/, '');

            // Remove jasmine jonx from the stack trace
            message = message.split('\n').filter(function(line) {
              return !/vendor\/jasmine\//.test(line);
            }).join('\n');
          }

          failureMessages.push(message);
        }
        break;
      default:
        throw new Error('Unexpected spec result type: ', result.type);
    }
  });

  container[spec.description] = {
    failureMessages: failureMessages,
    logMessages: logMessages,
    numPassingTests: numPassingTests
  };
}

function JasmineReporter(testName) {
  jasmine.Reporter.call(this);
  this._logs = [];
  this._resultsDeferred = Q.defer();
}
JasmineReporter.prototype = Object.create(jasmine.Reporter.prototype);

// All describe() suites have finished
JasmineReporter.prototype.reportRunnerResults = function(runner) {
  var suites = {};
  runner.suites().forEach(function(suite) {
    if (suite.parentSuite === null) {
      _extractSuiteResults(suites, suite);
    }
  });

  this._resultsDeferred.resolve({
    suites: suites,
    tests: {}
  });
};

JasmineReporter.prototype.getResults = function() {
  return this._resultsDeferred.promise;
};

JasmineReporter.prototype.log = function(str) {
  console.log('logging: ', str);
};

module.exports = JasmineReporter
