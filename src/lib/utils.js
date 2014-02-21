var colors = require('./colors');
var fs = require('fs');
var path = require('path');
var Q = require('q');

var DEFAULT_CONFIG_VALUES = {
  environmentBuilder: require.resolve('../jsdomEnvironmentBuilder'),
  moduleLoader: require.resolve('../HasteModuleLoader/HasteModuleLoader'),
  testRunner: require.resolve('../jasmineTestRunner/jasmineTestRunner')
};

function _replaceRootDirTags(rootDir, config) {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      } else if (Array.isArray(config)) {
        return config.map(function(item) {
          return _replaceRootDirTags(rootDir, item);
        });
      } else if (config !== null) {
        var newConfig = {};
        for (var configKey in config) {
          newConfig[configKey] = 
            configKey === 'rootDir'
            ? config[configKey]
            : _replaceRootDirTags(rootDir, config[configKey]);
        }
        return newConfig;
      }
      break;
    case 'string':
      if (!/^<rootDir>/.test(config)) {
        return config;
      }

      return path.resolve(
        rootDir, 
        './' + path.normalize(config.substr('<rootDir>'.length))
      );
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

function normalizeConfig(config, relativeTo) {
  var newConfig = {};

  // Normalize rootDir into an absolute path
  if (config.rootDir) {
    newConfig.rootDir =
      relativeTo
      ? path.resolve(relativeTo, config.rootDir)
      : config.rootDir;
  }

  Object.keys(config).reduce(function(newConfig, key) {
    var value;
    switch (key) {
      case 'rootDir':
        // Skip because we've already copied it above
        return newConfig;

      case 'testPathDirs':
        value = config[key].map(function(scanDir) {
          return (
            /^\./.test(scanDir) 
            ? path.resolve(relativeTo, scanDir)
            : scanDir
          );
        });
        break;

      case 'testPathIgnores':
      case 'moduleLoaderPathIgnores':
        // _replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(function(pattern) {
          return pattern.replace(/<rootDir>/g, newConfig.rootDir);
        });
        value = new RegExp('(?:' + value.join('|') + ')');
        break;

      default:
        value = config[key];
        break;
    }
    newConfig[key] = value;
    return newConfig;
  }, newConfig);

  // If any config entries weren't specified but have default values, apply the
  // default values
  Object.keys(DEFAULT_CONFIG_VALUES).reduce(function(newConfig, key) {
    if (!newConfig[key]) {
      newConfig[key] = DEFAULT_CONFIG_VALUES[key];
    }
    return newConfig;
  }, newConfig);

  return _replaceRootDirTags(newConfig.rootDir || '', newConfig);
}

function loadConfigFromFile(filePath, relativeTo) {
  relativeTo = relativeTo || path.dirname(filePath);
  return Q.nfcall(fs.readFile, filePath, 'utf8').then(function(fileData) {
    var config = JSON.parse(fileData);
    return normalizeConfig(config, relativeTo);
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
        value: '[Function: ' + arg.name + ']'
      });

    case 'object':
      if (arg === null) {
        return JSON.stringify({
          type: 'null',
          value: 'null'
        });
      }

      if (Array.isArray(arg)) {
        return JSON.stringify({
          type: 'array',
          value: arg.map(serializeConsoleArgValue)
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
    case 'array':
      return metadata.value.map(stringifySerializedConsoleArgValue);
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
exports.normalizeConfig = normalizeConfig;
exports.readAndPreprocessFileContent = readAndPreprocessFileContent;
exports.runContentWithLocalBindings = runContentWithLocalBindings;
exports.serializeConsoleArgValue = serializeConsoleArgValue;
exports.stringifySerializedConsoleArgValue = stringifySerializedConsoleArgValue;
