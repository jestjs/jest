/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const fs = require('graceful-fs');
const path = require('path');

function replacePathSepForRegex(str) {
  if (path.sep === '\\') {
    return str.replace(/(\/|\\)/g, '\\\\');
  }
  return str;
}

const DEFAULT_CONFIG_VALUES = {
  bail: false,
  cacheDirectory: path.resolve(__dirname, '..', '..', '.haste_cache'),
  coverageCollector: require.resolve('../IstanbulCollector'),
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  globals: {},
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleLoader: require.resolve('../HasteModuleLoader/HasteModuleLoader'),
  preprocessorIgnorePatterns: [],
  modulePathIgnorePatterns: [],
  moduleNameMapper: [],
  testDirectoryName: '__tests__',
  testEnvironment: require.resolve('../environments/JSDOMEnvironment'),
  testEnvData: {},
  testFileExtensions: ['js'],
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [replacePathSepForRegex('/node_modules/')],
  testReporter: require.resolve('../IstanbulTestReporter'),
  testRunner: require.resolve('../testRunners/jasmine/jasmine1'),
  testURL: 'about:blank',
  noHighlight: false,
  noStackTrace: false,
  preprocessCachingDisabled: false,
  verbose: false,
  useStderr: false,
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
        const newConfig = {};
        for (const configKey in config) {
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
        path.normalize('./' + config.substr('<rootDir>'.length))
      );
  }
  return config;
}

function escapeStrForRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function normalizeConfig(config) {
  const newConfig = {};

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error('No rootDir config value found!');
  }

  config.rootDir = path.normalize(config.rootDir);

  // Normalize user-supplied config options
  Object.keys(config).reduce(function(newConfig, key) {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = Object.keys(config[key]).reduce(function(normObj, filePath) {
          filePath = path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, filePath)
          );
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'testPathDirs':
        value = config[key].map(function(scanDir) {
          return path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, scanDir)
          );
        });
        break;

      case 'cacheDirectory':
      case 'testRunner':
      case 'scriptPreprocessor':
      case 'setupEnvScriptFile':
      case 'setupTestFrameworkScriptFile':
        value = path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, config[key])
        );
        break;

      case 'moduleNameMapper':
        value = Object.keys(config[key]).map(regex => [
          regex,
          _replaceRootDirTags(config.rootDir, config[key][regex]),
        ]);
        break;

      case 'preprocessorIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        // _replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(function(pattern) {
          return replacePathSepForRegex(
            pattern.replace(/<rootDir>/g, config.rootDir)
          );
        });
        break;
      case 'testEnvironment_EXPERIMENTAL':
        newConfig.testEnvironment = config[key];
        return newConfig;
      case 'bail':
      case 'preprocessCachingDisabled':
      case 'coverageReporters':
      case 'collectCoverage':
      case 'coverageCollector':
      case 'globals':
      case 'moduleLoader':
      case 'name':
      case 'persistModuleRegistryBetweenSpecs':
      case 'rootDir':
      case 'setupJSLoaderOptions':
      case 'setupJSTestLoaderOptions':
      case 'setupJSMockLoaderOptions':
      case 'testDirectoryName':
      case 'testEnvData':
      case 'testFileExtensions':
      case 'testPathPattern':
      case 'testReporter':
      case 'testURL':
      case 'moduleFileExtensions':
      case 'noHighlight':
      case 'noStackTrace':
      case 'logHeapUsage':
      case 'cache':
      case 'verbose':
        value = config[key];
        break;

      default:
        throw new Error('Unknown config option: ' + key);
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

  // Fill in some default values for node-haste config
  newConfig.setupJSLoaderOptions = newConfig.setupJSLoaderOptions || {};
  newConfig.setupJSTestLoaderOptions = newConfig.setupJSTestLoaderOptions || {};
  newConfig.setupJSMockLoaderOptions = newConfig.setupJSMockLoaderOptions || {};

  if (!newConfig.setupJSTestLoaderOptions.extensions) {
    newConfig.setupJSTestLoaderOptions.extensions =
      newConfig.testFileExtensions.map(_addDot);
  }

  if (!newConfig.setupJSLoaderOptions.extensions) {
    newConfig.setupJSLoaderOptions.extensions = uniqueStrings(
      newConfig.moduleFileExtensions.map(_addDot).concat(
        newConfig.setupJSTestLoaderOptions.extensions
      )
    );
  }

  if (!newConfig.setupJSMockLoaderOptions.extensions) {
    newConfig.setupJSMockLoaderOptions.extensions =
      newConfig.setupJSLoaderOptions.extensions;
  }

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
}

function _addDot(ext) {
  return '.' + ext;
}

function uniqueStrings(set) {
  const newSet = [];
  const has = {};
  set.forEach(function(item) {
    if (!has[item]) {
      has[item] = true;
      newSet.push(item);
    }
  });
  return newSet;
}

function readFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf8', function(err, data) {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

function loadConfigFromFile(filePath) {
  return readFile(filePath).then(function(fileData) {
    const config = JSON.parse(fileData);
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = process.cwd();
    } else {
      config.rootDir = path.resolve(path.dirname(filePath), config.rootDir);
    }
    return normalizeConfig(config);
  });
}

function loadConfigFromPackageJson(filePath) {
  const pkgJsonDir = path.dirname(filePath);
  return readFile(filePath).then(function(fileData) {
    const packageJsonData = JSON.parse(fileData);
    const config = packageJsonData.jest;
    config.name = packageJsonData.name;
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = pkgJsonDir;
    } else {
      config.rootDir = path.resolve(pkgJsonDir, config.rootDir);
    }
    return normalizeConfig(config);
  });
}

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
    const text = testResult.testExecError;
    return descBullet + localChalk.bold('Runtime Error') + '\n' + text;
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
        return (
          matches[1] +
          path.relative(rootPath, filePath) +
          matches[3]
        );
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

function deepCopy(obj) {
  const newObj = {};
  let value;
  for (const key in obj) {
    value = obj[key];
    if (typeof value === 'object' && value !== null) {
      value = deepCopy(value);
    }
    newObj[key] = value;
  }
  return newObj;
}

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
const STACK_TRACE_LINE_IGNORE_RE = new RegExp([
  '^timers.js$',
  '^' + path.resolve(__dirname, '..', 'lib', 'moduleMocker.js'),
  '^' + path.resolve(__dirname, '..', '..', 'vendor', 'jasmine'),
].join('|'));

exports.deepCopy = deepCopy;
exports.escapeStrForRegex = escapeStrForRegex;
exports.loadConfigFromFile = loadConfigFromFile;
exports.loadConfigFromPackageJson = loadConfigFromPackageJson;
exports.normalizeConfig = normalizeConfig;
exports.formatFailureMessage = formatFailureMessage;
