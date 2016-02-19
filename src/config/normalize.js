'use strict';

const path = require('path');
const utils = require('jest-util');
const DEFAULT_CONFIG_VALUES = require('./defaults');

function replaceRootDirTags(rootDir, config) {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      }

      if (Array.isArray(config)) {
        return config.map(function(item) {
          return replaceRootDirTags(rootDir, item);
        });
      }

      if (config !== null) {
        const newConfig = {};
        for (const configKey in config) {
          newConfig[configKey] =
            configKey === 'rootDir'
              ? config[configKey]
              : replaceRootDirTags(rootDir, config[configKey]);
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

function normalize(config) {
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
            replaceRootDirTags(config.rootDir, filePath)
          );
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'testPathDirs':
        value = config[key].map(function(scanDir) {
          return path.resolve(
            config.rootDir,
            replaceRootDirTags(config.rootDir, scanDir)
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
          replaceRootDirTags(config.rootDir, config[key])
        );
        break;

      case 'moduleNameMapper':
        value = Object.keys(config[key]).map(regex => [
          regex,
          replaceRootDirTags(config.rootDir, config[key][regex]),
        ]);
        break;

      case 'preprocessorIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        // replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(function(pattern) {
          return utils.replacePathSepForRegex(
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

  return replaceRootDirTags(newConfig.rootDir, newConfig);
}

module.exports = normalize;
