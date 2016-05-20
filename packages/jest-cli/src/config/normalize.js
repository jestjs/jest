/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const DEFAULT_CONFIG_VALUES = require('./defaults');
const Resolver = require('jest-resolve');

const constants = require('../constants');
const path = require('path');
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
  let module = Resolver.findNodeModule(env, {basedir: config.rootDir});
  if (module) {
    return module;
  }

  module = Resolver.findNodeModule(`jest-environment-${env}`, {
    basedir: config.rootDir,
  });
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

  if (!config.name) {
    config.name = config.rootDir.replace(/[/\\]|\s/g, '-');
  }

  if (config.coverageThreshold) {
    config.collectCoverage = true;
  }

  if (!config.setupFiles) {
    config.setupFiles = [];
  }

  if (config.setupEnvScriptFile) {
    config.setupFiles.push(config.setupEnvScriptFile);
    delete config.setupEnvScriptFile;
  }

  // Deprecated. We'll start warning about this in the future.
  if (config.testDirectoryName || config.testFileExtensions) {
    if (!config.moduleFileExtensions) {
      config.moduleFileExtensions = DEFAULT_CONFIG_VALUES.moduleFileExtensions;
    }
    const extensions = Array.from(
      new Set((config.testFileExtensions || [])
        .concat(config.moduleFileExtensions)
    ));

    config.moduleFileExtensions = extensions;
    config.testRegex =
      path.sep + (config.testDirectoryName || '__tests__') + path.sep +
      '.*\\.(' + extensions.join('|') + ')$';

    delete config.testDirectoryName;
    delete config.testFileExtensions;
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
    babelJest = Resolver.findNodeModule('babel-jest', {
      basedir: config.rootDir,
    });
    if (babelJest) {
      config.scriptPreprocessor = babelJest;
    }
  }

  if (babelJest) {
    const polyfillPath =
      Resolver.findNodeModule('babel-polyfill', {basedir: config.rootDir});
    if (polyfillPath) {
      config.setupFiles.unshift(polyfillPath);
    }
    config.usesBabelJest = true;
  }

  if (!('preprocessorIgnorePatterns' in config)) {
    const isRNProject =
      !!Resolver.findNodeModule('react-native', {basedir: config.rootDir});
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
      case 'scriptPreprocessor':
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
      case 'testRunner':
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

      case 'modulePathIgnorePatterns':
      case 'preprocessorIgnorePatterns':
      case 'testPathIgnorePatterns':
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
      case 'automock':
      case 'bail':
      case 'cache':
      case 'collectCoverage':
      case 'colors':
      case 'coverageCollector':
      case 'coverageReporters':
      case 'coverageThreshold':
      case 'globals':
      case 'haste':
      case 'logHeapUsage':
      case 'mocksPattern':
      case 'moduleDirectories':
      case 'moduleFileExtensions':
      case 'moduleLoader':
      case 'modulePaths':
      case 'name':
      case 'noHighlight':
      case 'noStackTrace':
      case 'persistModuleRegistryBetweenSpecs':
      case 'rootDir':
      case 'testEnvData':
      case 'testEnvironment':
      case 'testPathPattern':
      case 'testRegex':
      case 'testReporter':
      case 'testURL':
      case 'usesBabelJest':
      case 'verbose':
      case 'watchman':
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
