'use strict';

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
      }

      if (Array.isArray(config)) {
        return config.map(function(item) {
          return _replaceRootDirTags(rootDir, item);
        });
      }

      if (config !== null) {
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

/**
 * Given the coverage info for a single file (as output by
 * CoverageCollector.js), return an array whose entries are bools indicating
 * whether anything on the line could have been covered and was, or null if the
 * line wasn't measurable (like empty lines, declaration keywords, etc).
 *
 * For example, for the following coverage info:
 *
 * COVERED:     var a = [];
 * NO CODE:
 * COVERED:     for (var i = 0; i < a.length; i++)
 * NOT COVERED:   console.log('hai!');
 *
 * You'd get an array that looks like this:
 *
 * [true, null, true, false]
 */
function getLineCoverageFromCoverageInfo(coverageInfo) {
  var coveredLines = {};
  coverageInfo.coveredSpans.forEach(function(coveredSpan) {
    var startLine = coveredSpan.start.line;
    var endLine = coveredSpan.end.line;
    for (var i = startLine - 1; i < endLine; i++) {
      coveredLines[i] = true;
    }
  });

  var uncoveredLines = {};
  coverageInfo.uncoveredSpans.forEach(function(uncoveredSpan) {
    var startLine = uncoveredSpan.start.line;
    var endLine = uncoveredSpan.end.line;
    for (var i = startLine - 1; i < endLine; i++) {
      uncoveredLines[i] = true;
    }
  });

  var sourceLines = coverageInfo.sourceText.trim().split('\n');

  return sourceLines.map(function(line, lineIndex) {
    if (uncoveredLines[lineIndex] === true) {
      return false;
    } else if (coveredLines[lineIndex] === true) {
      return true;
    } else {
      return null;
    }
  });
}

/**
 * Given the coverage info for a single file (as output by
 * CoverageCollector.js), return the decimal percentage of lines in the file
 * that had any coverage info.
 *
 * For example, for the following coverage info:
 *
 * COVERED:     var a = [];
 * NO CODE:
 * COVERED:     for (var i = 0; i < a.length; i++)
 * NOT COVERED:   console.log('hai');
 *
 * You'd get: 2/3 = 0.666666
 */
function getLinePercentCoverageFromCoverageInfo(coverageInfo) {
  var lineCoverage = getLineCoverageFromCoverageInfo(coverageInfo);
  var numMeasuredLines = 0;
  var numCoveredLines = lineCoverage.reduce(function(counter, lineIsCovered) {
    if (lineIsCovered !== null) {
      numMeasuredLines++;
      if (lineIsCovered === true) {
        counter++;
      }
    }
    return counter;
  }, 0);

  return numCoveredLines / numMeasuredLines;
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

var _contentCache = {};
function readAndPreprocessFileContent(filePath, config) {
  if (_contentCache.hasOwnProperty(filePath)) {
    return _contentCache[filePath];
  }

  var fileData = fs.readFileSync(filePath, 'utf8');
  if (config.scriptPreprocessor) {
    try {
      fileData = require(config.scriptPreprocessor).process(fileData, filePath);
    } catch (e) {
      e.message = config.scriptPreprocessor + ': ' + e.message;
      throw e;
    }
  }
  return _contentCache[filePath] = fileData;
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

function serializeConsoleArgValue(arg, objWeakMap) {
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

      if (!objWeakMap) {
        // Node 0.8 doesn't have WeakSet
        if (typeof WeakMap !== 'function') {
          throw new Error('Please run node with the --harmony flag!');
        }
        objWeakMap = new WeakMap();
      }

      if (Array.isArray(arg)) {
        // WeakMap in Node 0.8 doesn't have a .has() method
        if (objWeakMap.get(arg) === true) {
          return JSON.stringify({
            type: 'cycle',
            value: 'Array'
          });
        }
        objWeakMap.set(arg, true);

        return JSON.stringify({
          type: 'array',
          value: arg.map(function(subValue) {
            return serializeConsoleArgValue(subValue, objWeakMap);
          })
        });
      }

      // WeakMap in Node 0.8 doesn't have a .has() method
      if (objWeakMap.get(arg) === true) {
        return JSON.stringify({
          type: 'cycle',
          value: 'Object'
        });
      }
      objWeakMap.set(arg, true);

      var retValue = {};
      for (var key in arg) {
        retValue[key] = serializeConsoleArgValue(arg[key], objWeakMap);
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

    default:
      throw new Error('Unexpected console.XXX arg type!', typeof arg);
  }
}

function stringifySerializedConsoleArgValue(arg) {
  var metadata = JSON.parse(arg);
  switch (metadata.type) {
    case 'cycle':
      return '[CyclicRef (' + metadata.value + ')]';
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

exports.getLineCoverageFromCoverageInfo = getLineCoverageFromCoverageInfo;
exports.getLinePercentCoverageFromCoverageInfo =
  getLinePercentCoverageFromCoverageInfo;
exports.loadConfigFromFile = loadConfigFromFile;
exports.normalizeConfig = normalizeConfig;
exports.readAndPreprocessFileContent = readAndPreprocessFileContent;
exports.runContentWithLocalBindings = runContentWithLocalBindings;
exports.serializeConsoleArgValue = serializeConsoleArgValue;
exports.stringifySerializedConsoleArgValue = stringifySerializedConsoleArgValue;
