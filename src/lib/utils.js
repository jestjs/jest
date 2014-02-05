var colors = require('./colors');
var fs = require('fs');
var path = require('path');
var Q = require('q');

function _replaceRootDirTags(rootDir, config) {
  var objValue;
  switch (typeof config) {
    case 'object':
      if (Array.isArray(config)) {
        return config.map(function(item) {
          return _replaceRootDirTags(rootDir, item);
        });
      } else if (config !== null) {
        for (var configKey in config) {
          config[configKey] = _replaceRootDirTags(rootDir, config[configKey]);
        }
        return config;
      }
      break;
    case 'string':
      return config.replace(/<rootDir>/g, rootDir);
  }
  return config;
}

function filterPassingSuiteResults(suite) {
  var suites = {};
  var tests = {};

  var hasFailingTests = false;

  for (var testName in suite.tests) {
    if (suite.tests[testName].failureMessages.length > 0) {
      tests[testName] = suite.tests[testName];
      hasFailingTests = true;
    }
  }

  for (var suiteName in suite.suites) {
    if (filterPassingSuiteResults(suite.suites[suiteName]) !== null) {
      suites[suiteName] = suite.suites[suiteName];
      hasFailingTests = true;
    }
  }

  if (!hasFailingTests) {
    return null;
  } else {
    return {
      suites: suites,
      tests: tests
    };
  }
}

function flattenSuiteResults(suite) {
  var failingTests = {};
  var numPassingTests = 0;

  var testResults;
  for (var testName in suite.tests) {
    testResults = suite.tests[testName];

    if (testResults.failureMessages.length > 0) {
      failingTests['it ' + testName] = testResults.failureMessages;
    }
    numPassingTests += testResults.numPassingTests;
  }

  var suiteResults;
  for (var suiteName in suite.suites) {
    suiteResults = flattenSuiteResults(suite.suites[suiteName]);

    if (Object.keys(suiteResults.failingTests).length > 0) {
      var newTestName;
      for (var testName in suiteResults.failingTests) {
        newTestName =
          colors.colorize(suiteName, colors.BOLD) + ' \u203A ' + testName;
        failingTests[newTestName] = suiteResults.failingTests[testName];
      }
    }
    numPassingTests += suiteResults.numPassingTests;
  }

  return {
    failingTests: failingTests,
    numPassingTests: numPassingTests
  }
}

function loadConfigFromFile(filePath) {
  return Q.nfcall(fs.readFile, filePath, 'utf8').then(function(fileData) {
    var config = JSON.parse(fileData);
    var rootDir = path.resolve(path.dirname(filePath), config.rootDir);
    config.rootDir = rootDir;
    return _replaceRootDirTags(rootDir, config);
  });
}

var contentCache = {};
function readAndPreprocessFileContent(filePath, config) {
  if (contentCache.hasOwnProperty(filePath)) {
    return contentCache[filePath];
  }

  var fileData = fs.readFileSync(filePath, 'utf8');
  if (config.scriptPreprocessor) {
    fileData = require(config.scriptPreprocessor).process(fileData, filePath);
  }
  return contentCache[filePath] = fileData;
}

function runContentWithLocalBindings(contextRunner, scriptContent, scriptPath,
                                     bindings) {
  var boundIdents = Object.keys(bindings);
  try {
    var wrapperFunc = contextRunner(
      '(function(' + boundIdents.join(',') + '){' +
      scriptContent +
      '\n})',
      scriptPath
    );
  } catch (e) {
    e.message = scriptPath + ': ' + e.message;
    throw e;
  }

  var bindingValues = boundIdents.map(function(ident) {
    return bindings[ident];
  });

  try {
    wrapperFunc.apply(null, bindingValues);
  } catch (e) {
    e.message = scriptPath + ': ' + e.message;
    throw e;
  }
}

function serializeConsoleArgValue(arg) {
  switch (typeof arg) {
    case 'function':
      return JSON.stringify({
        type: 'function',
        value: arg.toString()
      });

    case 'object':
      if (arg === null) {
        return JSON.stringify({
          type: 'null',
          value: 'null'
        });
      }

      var retValue = {};
      for (var key in arg) {
        retValue[key] = serializeConsoleArgValue(arg[key]);
      }
      return JSON.stringify({
        type: 'object',
        value: retValue
      });

    case 'undefined':
      return JSON.stringify({
        type: 'undefined',
        value: 'undefined'
      });

    case 'boolean':
    case 'number':
    case 'string':
      return JSON.stringify({
        type: 'json',
        value: arg
      });
      break;

    default:
      throw new Error('Unexpected console.XXX arg type!', typeof arg);
  }
}

function stringifySerializedConsoleArgValue(arg) {
  var metadata = JSON.parse(arg);
  switch (metadata.type) {
    case 'null':
      return 'null';
    case 'object':
      var ret = {};
      for (var key in metadata.value) {
        ret[key] = stringifySerializedConsoleArgValue(metadata.value[key]);
      }
      return JSON.stringify(ret);
    case 'undefined':
      return 'undefined';
    case 'function':
    case 'json':
      return metadata.value;
    default:
      throw new Error('Unexpected serialized console.XXX type!', metadata);
  }
}

exports.filterPassingSuiteResults = filterPassingSuiteResults;
exports.flattenSuiteResults = flattenSuiteResults;
exports.loadConfigFromFile = loadConfigFromFile;
exports.readAndPreprocessFileContent = readAndPreprocessFileContent;
exports.runContentWithLocalBindings = runContentWithLocalBindings;
exports.serializeConsoleArgValue = serializeConsoleArgValue;
exports.stringifySerializedConsoleArgValue = stringifySerializedConsoleArgValue;
