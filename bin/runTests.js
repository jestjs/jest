#!/usr/bin/env node --harmony
/* jshint node: true */
"use strict";

var optimist = require('optimist');
var path = require('path');
var TestRunner = require('../src/TestRunner');
var utils = require('../src/lib/utils');

function _onRunComplete(completionData) {
  if (completionData.numTotalTests > 0 && completionData.numFailedTests > 0) {
    process.exit(1);
  }
}

/**
 * Takes a description string, puts it on the next line, indents it, and makes
 * sure it wraps without exceeding 80chars
 */
function _wrapDesc(desc) {
  var indent = '\n      ';
  return indent + desc.split(' ').reduce(function(wrappedDesc, word) {
    var lastLineIdx = wrappedDesc.length - 1;
    var lastLine = wrappedDesc[lastLineIdx];

    var appendedLastLine = lastLine === '' ? word : (lastLine + ' ' + word);

    if (appendedLastLine.length > 80) {
      wrappedDesc.push(word);
    } else {
      wrappedDesc[lastLineIdx] = appendedLastLine;
    }

    return wrappedDesc;
  }, ['']).join(indent);
}

var argv = optimist
  .usage('Usage: $0 --config=<pathToConfigFile> [TestPathRegExp]')
  .options({
    config: {
      alias: 'c',
      demand: true,
      description: _wrapDesc(
        'The path to a jest config file specifying how to find and execute ' +
        'tests.'
      ),
      type: 'string'
    },
    runInBand: {
      alias: 'i',
      description: _wrapDesc(
        'Run all tests serially in the current process (rather than creating ' +
        'a worker pool of child processes that run tests). This is sometimes ' +
        'useful for debugging, but such use cases are pretty rare.'
      ),
      type: 'boolean'
    }
  })
  .argv

utils.loadConfigFromFile(argv.config).done(function(config) {
  var pathPattern =
    argv._.length === 0
    ? /.*/
    : new RegExp(argv._.join('|'));

  var testRunner = new TestRunner(config);

  if (argv.runInBand) {
    console.log('Running tests serially in the current node process...');
    testRunner.runAllInBand(pathPattern).done(_onRunComplete);
  } else {
    testRunner.runAllParallel(pathPattern).done(_onRunComplete);
  }
});
