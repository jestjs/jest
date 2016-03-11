/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const fs = require('graceful-fs');
const path = require('path');
const resolveNodeModule = require('./resolveNodeModule');

function replacePathSepForRegex(str) {
  if (path.sep === '\\') {
    return str.replace(/(\/|\\)/g, '\\\\');
  }
  return str;
}

const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const DEFAULT_CONFIG_VALUES = {
  automock: true,
  bail: false,
  cacheDirectory: path.resolve(__dirname, '..', '..', '.haste_cache'),
  coverageCollector: require.resolve('../IstanbulCollector'),
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  globals: {},
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleLoader: require.resolve('../HasteModuleLoader/HasteModuleLoader'),
  moduleResolver: require.resolve('../resolvers/HasteResolver'),
  haste: {
    providesModuleNodeModules: [],
  },
  modulePathIgnorePatterns: [],
  moduleNameMapper: [],
  testDirectoryName: '__tests__',
  mocksPattern: '__mocks__',
  testEnvironment: require.resolve('../environments/JSDOMEnvironment'),
  testEnvData: {},
  testFileExtensions: ['js'],
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [replacePathSepForRegex(NODE_MODULES)],
  testReporter: require.resolve('../reporters/IstanbulTestReporter'),
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

function normalizeConfig(config, argv) {
  if (!argv) {
    argv = {};
  }
  const newConfig = {};

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error('No rootDir config value found!');
  }

  config.rootDir = path.normalize(config.rootDir);

  if (!config.setupFiles) {
    config.setupFiles = [];
  }

  if (config.setupEnvScriptFile) {
    config.setupFiles.push(config.setupEnvScriptFile);
    delete config.setupEnvScriptFile;
  }

  if (argv.testRunner) {
    config.testRunner = argv.testRunner;
  }

  if (config.testRunner === 'jasmine1') {
    config.testRunner = require.resolve('../testRunners/jasmine/jasmine1');
  } else if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('../testRunners/jasmine/jasmine2');
  } else {
    try {
      config.testRunner = path.resolve(
        config.testRunner.replace(/<rootDir>/g, config.rootDir)
      );
    } catch (e) {
      throw new Error(
        `Jest: Invalid testRunner path: ${config.testRunner}`
      );
    }
  }

  let babelJest;
  if (config.scriptPreprocessor) {
    config.scriptPreprocessor =
      _replaceRootDirTags(config.rootDir, config.scriptPreprocessor);
    if (config.scriptPreprocessor.includes(NODE_MODULES + 'babel-jest')) {
      babelJest = config.scriptPreprocessor;
    }
  } else {
    babelJest = resolveNodeModule('babel-jest', config.rootDir);
    if (babelJest) {
      config.scriptPreprocessor = babelJest;
    }
  }

  if (babelJest) {
    const polyfillPath = resolveNodeModule('babel-polyfill', config.rootDir);
    if (polyfillPath) {
      config.setupFiles.unshift(polyfillPath);
    }
    config.usesBabelJest = true;
  }

  if (!('preprocessorIgnorePatterns' in config)) {
    const isRNProject = !!resolveNodeModule('react-native', config.rootDir);
    config.preprocessorIgnorePatterns = isRNProject ? [] : [NODE_MODULES];
  } else if (!config.preprocessorIgnorePatterns) {
    config.preprocessorIgnorePatterns = [];
  }

  Object.keys(config).reduce((newConfig, key) => {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = Object.keys(config[key]).reduce((normObj, filePath) => {
          filePath = path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, filePath)
          );
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'setupFiles':
      case 'testPathDirs':
        value = config[key].map(filePath => path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, filePath)
        ));
        break;

      case 'cacheDirectory':
      case 'testRunner':
      case 'scriptPreprocessor':
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
        value = config[key].map(pattern =>
          replacePathSepForRegex(pattern.replace(/<rootDir>/g, config.rootDir))
        );
        break;
      case 'bail':
      case 'preprocessCachingDisabled':
      case 'coverageReporters':
      case 'collectCoverage':
      case 'coverageCollector':
      case 'globals':
      case 'haste':
      case 'mocksPattern':
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
      case 'watchman':
      case 'verbose':
      case 'automock':
      case 'usesBabelJest':
      case 'testEnvironment':
        value = config[key];
        break;

      default:
        console.error(
          `Error: Unknown config option "${key}" with value ` +
          `"${config[key]}". This is either a typing error or another user ` +
          `mistake and fixing it will remove this message.`
        );
    }
    newConfig[key] = value;
    return newConfig;
  }, newConfig);

  // If any config entries weren't specified but have default values, apply the
  // default values
  Object.keys(DEFAULT_CONFIG_VALUES).reduce((newConfig, key) => {
    if (!(key in newConfig)) {
      newConfig[key] = DEFAULT_CONFIG_VALUES[key];
    }
    return newConfig;
  }, newConfig);

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
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

const KEEP_TRACE_LINES = 2;
function cleanStackTrace(stackTrace) {
  // Remove jasmine jonx from the stack trace
  let lines = 0;
  const keepFirstLines = () => (lines++ < KEEP_TRACE_LINES);
  return stackTrace.split('\n').filter(line => (
    keepFirstLines() ||
    !/^\s+at.*?jest(-cli)?\/(vendor|src|node_modules)\//.test(line)
  )).join('\n');
}

function formatFailureMessage(testResult, config) {
  const rootDir = config.rootDir;

  const ancestrySeparator = ' \u203A ';
  const descBullet = config.verbose ? '' : chalk.bold('\u25cf ');
  const msgBullet = '  - ';
  const msgIndent = msgBullet.replace(/./g, ' ');

  if (testResult.testExecError) {
    const error = testResult.testExecError;
    return (
      descBullet +
      (config.verbose ? 'Runtime Error' : chalk.bold('Runtime Error')) + '\n' +
      (error.stack ? cleanStackTrace(error.stack) : error.message)
    );
  }

  return testResult.testResults
    .filter(result => result.failureMessages.length !== 0)
    .map(result => {
      const failureMessages = result.failureMessages.map(errorMsg => {
        errorMsg = errorMsg.split('\n')
          .map(line => {
            // Extract the file path from the trace line.
            let matches =
              line.match(/(^\s+at .*?\()([^()]+)(:[0-9]+:[0-9]+\).*$)/);
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
              path.relative(rootDir, filePath) +
              matches[3]
            );
          })
          .filter(line => line !== null)
          .join('\n');

        return msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent);
      }).join('\n');

      const testTitleAncestry = result.ancestorTitles.map(
        title => chalk.bold(title)
      ).join(ancestrySeparator) + ancestrySeparator;

      return descBullet + testTitleAncestry + result.title + '\n' +
        failureMessages;
    })
    .join('\n');
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
exports.cleanStackTrace = cleanStackTrace;
exports.formatFailureMessage = formatFailureMessage;
