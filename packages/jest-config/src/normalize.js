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

const chalk = require('chalk');
const constants = require('./constants');
const path = require('path');
const utils = require('jest-util');

const JSON_EXTENSION = '.json';
const PRESET_NAME = 'jest-preset' + JSON_EXTENSION;

const BULLET = chalk.bold('\u25cf ');
const JEST15_MESSAGE = `

  Jest 15 changed the default configuration for tests and makes Jest easier to
  use and less confusing for beginners. All previous defaults can be restored
  if your project depends on it. A comprehensive explanation of the breaking
  changes and an upgrade guide can be found in the release blog post linked
  below.

  ${chalk.bold('Jest Issue Tracker:')} https://github.com/facebook/jest/issues
  ${chalk.bold('Configuration Documentation:')} https://facebook.github.io/jest/docs/configuration.html
  ${chalk.bold('Release Blog Post:')} https://facebook.github.io/jest/blog/2016/09/01/jest-15.html
`;
const throwConfigurationError = message => {
  throw new Error(chalk.red(message + JEST15_MESSAGE));
};

const logConfigurationWarning = message => {
  console.warn(chalk.yellow(BULLET + message + JEST15_MESSAGE));
};

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
        path.normalize('./' + config.substr('<rootDir>'.length)),
      );
  }
  return config;
}

/**
 * Finds the test environment to use:
 *
 * 1. looks for jest-environment-<name> relative to project.
 * 1. looks for jest-environment-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */
function getTestEnvironment(config) {
  const env = config.testEnvironment;
  let module = Resolver.findNodeModule(`jest-environment-${env}`, {
    basedir: config.rootDir,
  });
  if (module) {
    return module;
  }

  try {
    return require.resolve(`jest-environment-${env}`);
  } catch (e) {}

  module = Resolver.findNodeModule(env, {basedir: config.rootDir});
  if (module) {
    return module;
  }

  try {
    return require.resolve(env);
  } catch (e) {}

  throw new Error(
    `Jest: test environment "${env}" cannot be found. Make sure the ` +
    `"testEnvironment" configuration option points to an existing node module.`,
  );
}

function normalize(config, argv) {
  if (!argv) {
    argv = {};
  }
  const newConfig = {};

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error(`Jest: 'rootDir' config value must be specified.`);
  }

  config.rootDir = path.normalize(config.rootDir);

  if (config.preset) {
    const presetPath = _replaceRootDirTags(config.rootDir, config.preset);
    const presetModule = Resolver.findNodeModule(
      presetPath.endsWith(JSON_EXTENSION)
        ? presetPath
        : path.join(presetPath, PRESET_NAME),
      {
        basedir: config.rootDir,
      },
    );
    if (presetModule) {
      const preset = require(presetModule);
      if (config.setupFiles) {
        config.setupFiles = preset.setupFiles.concat(config.setupFiles);
      }
      if (config.modulePathIgnorePatterns) {
        config.modulePathIgnorePatterns = preset.modulePathIgnorePatterns
          .concat(config.modulePathIgnorePatterns);
      }
      if (config.moduleNameMapper) {
        config.moduleNameMapper = Object.assign(
          {},
          preset.moduleNameMapper,
          config.moduleNameMapper,
        );
      }
      config = Object.assign({}, preset, config);
    } else {
      throw new Error(
        `Jest: Preset '${presetPath}' not found.`,
      );
    }
  }

  if (!config.name) {
    config.name = config.rootDir.replace(/[/\\]|\s/g, '-');
  }

  if (!config.setupFiles) {
    config.setupFiles = [];
  }

  // Warn or throw for deprecated or removed configuration options.
  if (config.automock === false) {
    logConfigurationWarning(
      'Automocking was disabled by default in Jest. The setting ' +
      '`"automock": false` can safely be removed from Jest\'s config.',
    );
  }

  if (
    config.unmockedModulePathPatterns &&
    (
      !('automock' in config) ||
      config.automock === false
    )
  ) {
    logConfigurationWarning(
      'The `unmockedModulePathPatterns` setting is defined but automocking ' +
      'is disabled in Jest. Please either remove ' +
      '`unmockedModulePathPatterns` from your configuration or explicitly ' +
      'set `"automock": true` in your configuration if you wish to use ' +
      'automocking.',
    );
  }

  if (config.setupEnvScriptFile) {
    throwConfigurationError(
      'The setting `setupEnvScriptFile` was removed from Jest. Instead, use ' +
      'the `setupFiles` setting:\n\n' +
      '    "setupFiles": [' + JSON.stringify(config.setupEnvScriptFile) + ']',
    );
  }

  if ('persistModuleRegistryBetweenSpecs' in config) {
    throwConfigurationError(
      'The setting `persistModuleRegistryBetweenSpecs` was removed from ' +
      'Jest. ' + (
        config.persistModuleRegistryBetweenSpecs
          ? 'This configuration option can safely be removed.'
          : 'Set `"resetModules": true` in your configuration to retain the ' +
            'previous behavior'
      ),
    );
  }

  if (config.testDirectoryName || config.testFileExtensions) {
    const moduleFileExtensions =
      config.moduleFileExtensions ||
      DEFAULT_CONFIG_VALUES.moduleFileExtensions;
    const extensions = Array.from(
      new Set((config.testFileExtensions || [])
        .concat(moduleFileExtensions),
    ));

    const testRegex =
      '(/' + (config.testDirectoryName || '__tests__') + '/' +
      '.*|\\\\.(test|spec))\\\\.(' + extensions.join('|') + ')$';

    throw throwConfigurationError(
      'The settings `testDirectoryName` and `testFileExtensions` were ' +
      'removed from Jest. Instead, use `testRegex` like this:\n' +
      '    "testRegex": "' + testRegex + '"',
    );
  }

  if (argv.testRunner) {
    config.testRunner = argv.testRunner;
  }

  if (argv.collectCoverageFrom) {
    config.collectCoverageFrom = argv.collectCoverageFrom;
  }

  if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('jest-jasmine2');
  } else {
    try {
      config.testRunner = path.resolve(
        config.testRunner.replace(/<rootDir>/g, config.rootDir),
      );
    } catch (e) {
      throw new Error(
        `Jest: Invalid testRunner path: ${config.testRunner}`,
      );
    }
  }

  if (argv.env) {
    config.testEnvironment = argv.env;
  }

  if (config.testEnvironment) {
    config.testEnvironment = getTestEnvironment(config);
  }

  let babelJest;
  if (config.transform) {
    const customJSPattern = Object.keys(config.transform).find(regex => {
      const pattern = new RegExp(regex);
      return pattern.test('foobar.js') || pattern.test('foobar.jsx');
    });

    if (customJSPattern) {
      const jsTransformer = config.transform[customJSPattern];
      if (
        jsTransformer.includes(
          constants.NODE_MODULES + 'babel-jest',
        ) || jsTransformer.includes('packages/babel-jest')
      ) {
        babelJest = jsTransformer;
      }
    }
  } else {
    babelJest = Resolver.findNodeModule('babel-jest', {
      basedir: config.rootDir,
    });
    if (babelJest) {
      config.transform = {
        [constants.DEFAULT_JS_PATTERN]: babelJest,
      };
    }
  }

  if (babelJest) {
    const polyfillPath =
      Resolver.findNodeModule('babel-polyfill', {
        basedir: config.rootDir,
      });
    if (polyfillPath) {
      config.setupFiles.unshift(polyfillPath);
    }
    config.usesBabelJest = true;
  }

  Object.keys(config).reduce((newConfig, key) => {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = Object.keys(config[key]).reduce((normObj, filePath) => {
          filePath = path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, filePath),
          );
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'setupFiles':
      case 'testPathDirs':
        value = config[key].map(filePath => path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, filePath),
        ));
        break;

      case 'collectCoverageFrom':
        if (!config[key]) {
          value = [];
        }


        if (!Array.isArray(config[key])) {
          try {
            value = JSON.parse(config[key]);
          } catch (e) {}

          Array.isArray(value) || (value = [config[key]]);
        } else {
          value = config[key];
        }

        break;
      case 'cacheDirectory':
      case 'coverageDirectory':
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
      case 'testRunner':
        value = path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, config[key]),
        );
        break;

      case 'moduleNameMapper':
        value = Object.keys(config[key]).map(regex => [
          regex,
          _replaceRootDirTags(config.rootDir, config[key][regex]),
        ]);
        break;
      case 'transform':
        value = Object.keys(config[key]).map(regex => [
          regex,
          path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, config[key][regex]),
          ),
        ]);
        break;

      case 'coveragePathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'transformIgnorePatterns':
      case 'unmockedModulePathPatterns':
        // _replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(pattern =>
          utils.replacePathSepForRegex(
            pattern.replace(/<rootDir>/g, config.rootDir),
          ),
        );
        break;
      case 'automock':
      case 'bail':
      case 'browser':
      case 'cache':
      case 'clearMocks':
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
      case 'noStackTrace':
      case 'notify':
      case 'persistModuleRegistryBetweenSpecs':
      case 'preset':
      case 'replname':
      case 'resetModules':
      case 'rootDir':
      case 'testEnvironment':
      case 'testRegex':
      case 'testReporter':
      case 'testURL':
      case 'timers':
      case 'updateSnapshot':
      case 'usesBabelJest':
      case 'verbose':
      case 'watchman':
        value = config[key];
        break;

      default:
        console.error(
          `Error: Unknown config option "${key}" with value ` +
          `"${config[key]}". This is either a typing error or a user ` +
          `mistake and fixing it will remove this message.`,
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

  // If argv.json is set, coverageReporters shouldn't print a text report.
  if (argv.json) {
    newConfig.coverageReporters = newConfig.coverageReporters
      .filter(reporter => reporter !== 'text');
  }

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
}

module.exports = normalize;
