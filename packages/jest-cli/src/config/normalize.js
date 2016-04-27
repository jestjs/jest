/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const DEFAULT_CONFIG_VALUES = require('./defaults');

const constants = require('../constants');
const path = require('path');
const resolveNodeModule = require('./../lib/resolveNodeModule');
const utils = require('jest-util');

function _replaceRootDirTags(rootDir, config) {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      }

      if (Array.isArray(config)) {
        return config.map(item => _replaceRootDirTags(rootDir, item));
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

function getTestEnvironment(config) {
  const env = config.testEnvironment;
  let module = resolveNodeModule(env, config.rootDir);
  if (module) {
    return module;
  }

  module = resolveNodeModule(`jest-environment-${env}`, config.rootDir);
  if (module) {
    return module;
  }

  try {
    return require.resolve(env);
  } catch (e) {}

  try {
    return require.resolve(`jest-environment-${env}`);
  } catch (e) {}

  throw new Error(
    `Jest: test environment "${env}" cannot be found. Make sure the ` +
    `"testEnvironment" configuration option points to an existing node module.`
  );
}

function normalize(config, argv) {
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
    config.testRunner = require.resolve('jest-jasmine1');
  } else if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('jest-jasmine2');
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

  if (config.testEnvironment) {
    config.testEnvironment = getTestEnvironment(config);
  }

  let babelJest;
  if (config.scriptPreprocessor) {
    config.scriptPreprocessor =
      _replaceRootDirTags(config.rootDir, config.scriptPreprocessor);
    if (config.scriptPreprocessor.includes(
      constants.NODE_MODULES + 'babel-jest'
    )) {
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
    config.preprocessorIgnorePatterns =
      isRNProject ? [] : [constants.NODE_MODULES];
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
      case 'coverageDirectory':
      case 'testRunner':
      case 'scriptPreprocessor':
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
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
          utils.replacePathSepForRegex(
            pattern.replace(/<rootDir>/g, config.rootDir)
          )
        );
        break;
      case 'bail':
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
      case 'colors':
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

module.exports = normalize;
