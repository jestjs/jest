/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
const DEPRECATION_MESSAGE = `

  Jest changed the default configuration for tests.

  ${chalk.bold('Configuration Documentation:')} https://facebook.github.io/jest/docs/configuration.html
  ${chalk.bold('Jest Issue Tracker:')} https://github.com/facebook/jest/issues
`;
const throwConfigurationError = message => {
  throw new Error(chalk.red(message + DEPRECATION_MESSAGE));
};

const logConfigurationWarning = message => {
  console.warn(chalk.yellow(BULLET + message + DEPRECATION_MESSAGE));
};

const resolve = (rootDir, key, filePath) => {
  const module = Resolver.findNodeModule(
    _replaceRootDirTags(rootDir, filePath),
    {
      basedir: rootDir,
    },
  );

  if (!module) {
    throw new Error(
      `Jest: Module "${filePath}" in the "${key}" option was not found.`
    );
  }

  return module;
};

const _replaceRootDirTags = (rootDir, config) => {
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
};

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
      // Don't show deprecation warnings if the setting comes from the preset.
      if (preset.preprocessorIgnorePatterns) {
        preset.transformIgnorePatterns = preset.preprocessorIgnorePatterns;
        delete preset.preprocessorIgnorePatterns;
      }
      config = Object.assign({}, preset, config);
    } else {
      throw new Error(
        `Jest: Preset '${presetPath}' not found.`,
      );
    }
  }

  if (config.scriptPreprocessor && config.transform) {
    throwConfigurationError(
      'Jest: `scriptPreprocessor` and `transform` cannot be used together. ' +
      'Please change your configuration to only use `transform`.',
    );
  }

  if (config.preprocessorIgnorePatterns && config.transformIgnorePatterns) {
    throwConfigurationError(
      'Jest: `preprocessorIgnorePatterns` and `transformIgnorePatterns` ' +
      'cannot be used together. Please change your configuration to only ' +
      'use `transformIgnorePatterns`.',
    );
  }

  if (config.scriptPreprocessor) {
    config.transform = {
      '.*': config.scriptPreprocessor,
    };
  }

  if (config.preprocessorIgnorePatterns) {
    config.transformIgnorePatterns = config.preprocessorIgnorePatterns;
  }

  if (
    config.scriptPreprocessor ||
    config.preprocessorIgnorePatterns
  ) {
    logConfigurationWarning(
      'The settings `scriptPreprocessor` and `preprocessorIgnorePatterns` ' +
      'were replaced by `transform` and `transformIgnorePatterns` ' +
      'which support multiple preprocessors.\n\n' +
      '  Jest now treats your current settings as: \n\n' +
      `    "transform": {".*": "${config.scriptPreprocessor}"}` +
      (config.transformIgnorePatterns
        ? `\n    "transformIgnorePatterns": "${config.transformIgnorePatterns}"`
        : ''
      ) +
      '\n\n  Please update your configuration.',
    );
  }

  delete config.scriptPreprocessor;
  delete config.preprocessorIgnorePatterns;

  if (!config.name) {
    config.name = config.rootDir.replace(/[/\\]|\s/g, '-');
  }

  if (!config.setupFiles) {
    config.setupFiles = [];
  }

  if (argv.testRunner) {
    config.testRunner = argv.testRunner;
  }

  if (argv.collectCoverageFrom) {
    config.collectCoverageFrom = argv.collectCoverageFrom;
  }

  if (argv.collectCoverageOnlyFrom) {
    const collectCoverageOnlyFrom = Object.create(null);
    argv.collectCoverageOnlyFrom.forEach(
      path => collectCoverageOnlyFrom[path] = true
    );
    config.collectCoverageOnlyFrom = collectCoverageOnlyFrom;
  }

  if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('jest-jasmine2');
  } else {
    config.testRunner = resolve(config, 'testRunner', config.testRunner);
  }

  if (argv.env) {
    config.testEnvironment = argv.env;
  }

  if (config.testEnvironment) {
    config.testEnvironment = getTestEnvironment(config);
  }

  let babelJest;
  if (config.transform) {
    const toString = Object.prototype.toString;
    if (toString.call(config.transform) !== '[object Object]') {
      const isString = typeof config.transform === 'string';
      const exampleTransform = isString
        ? config.transform
        : '<rootDir>/node_modules/babel-jest';
      throwConfigurationError(
        `Configuration option \`${chalk.bold('transform')}\` ` +
        'must be an object. Use it like this:\n\n' +
        chalk.bold(
          '  "transform": {\n' +
          `    "^.+\\\\.js$": "${exampleTransform}"\n` +
          '  }'
        )
      );
    }

    const customJSPattern = Object.keys(config.transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });

    if (customJSPattern) {
      const jsTransformer = Resolver.findNodeModule(
        config.transform[customJSPattern], {
          basedir: config.rootDir,
        },
      );
      if (
        jsTransformer &&
        jsTransformer.includes(constants.NODE_MODULES + 'babel-jest')
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
        [constants.DEFAULT_JS_PATTERN]: 'babel-jest',
      };
    }
  }

  let polyfillPath;
  if (babelJest) {
    polyfillPath =
      Resolver.findNodeModule('babel-polyfill', {
        basedir: config.rootDir,
      });
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
        }, Object.create(null));
        break;

      case 'setupFiles':
      case 'snapshotSerializers':
        value = config[key].map(resolve.bind(null, config.rootDir, key));
        break;
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
        value = path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, config[key]),
        );
        break;
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
        value = resolve(config.rootDir, key, config[key]);
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
          resolve(config.rootDir, key, config[key][regex]),
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
      case 'collectCoverage':
      case 'coverageCollector':
      case 'coverageReporters':
      case 'coverageThreshold':
      case 'globals':
      case 'haste':
      case 'logHeapUsage':
      case 'logTransformErrors':
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
      case 'resetMocks':
      case 'resetModules':
      case 'rootDir':
      case 'testEnvironment':
      case 'testRegex':
      case 'testReporter':
      case 'testRunner':
      case 'testURL':
      case 'timers':
      case 'updateSnapshot':
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

  if (polyfillPath) {
    newConfig.setupFiles.unshift(polyfillPath);
  }

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
