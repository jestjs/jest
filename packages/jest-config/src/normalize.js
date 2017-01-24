/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

import type {InitialConfig} from 'types/Config';

const {
  BULLET,
  DOCUMENTATION_NOTE,
  _replaceRootDirInPath,
  _replaceRootDirTags,
  getTestEnvironment,
  resolve,
} = require('./utils');
const {NODE_MODULES, DEFAULT_JS_PATTERN} = require('./constants');
const {ValidationError, validate} = require('jest-validate');
const chalk = require('chalk');
const crypto = require('crypto');
const DEFAULT_CONFIG = require('./defaults');
const path = require('path');
const Resolver = require('jest-resolve');
const utils = require('jest-util');
const VALID_CONFIG = require('./validConfig');
const DEPRECATED_CONFIG = require('./deprecated');
const JSON_EXTENSION = '.json';
const PRESET_NAME = 'jest-preset' + JSON_EXTENSION;
const ERROR = `${BULLET}Validation Error`;

const createConfigError =
  message => new ValidationError(ERROR, message, DOCUMENTATION_NOTE);

const setupPreset = (config: InitialConfig, configPreset: string) => {
  let preset;
  const presetPath = _replaceRootDirInPath(config.rootDir, configPreset);
  const presetModule = Resolver.findNodeModule(
    presetPath.endsWith(JSON_EXTENSION)
      ? presetPath
      : path.join(presetPath, PRESET_NAME),
    {
      basedir: config.rootDir,
    },
  );

  try {
    // $FlowFixMe
    preset = require(presetModule);
  } catch (error) {
    throw createConfigError(
      `  Preset ${chalk.bold(presetPath)} not found.`
    );
  }

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
  return Object.assign({}, preset, config);
};

const setupBabelJest = (config: InitialConfig) => {
  let babelJest;
  const basedir = config.rootDir;

  if (config.transform) {
    const customJSPattern = Object.keys(config.transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });

    if (customJSPattern) {
      const jsTransformer = Resolver.findNodeModule(
        //$FlowFixMe
        config.transform[customJSPattern],
        {basedir},
      );
      if (
        jsTransformer && jsTransformer.includes(NODE_MODULES + 'babel-jest')
      ) {
        babelJest = jsTransformer;
      }
    }
  } else {
    babelJest = Resolver.findNodeModule('babel-jest', {basedir});
    if (babelJest) {
      config.transform = {
        [DEFAULT_JS_PATTERN]: 'babel-jest',
      };
    }
  }

  return babelJest;
};

const normalizeCollectCoverageOnlyFrom = (
  config: InitialConfig,
  key: string
) => {
  return Object.keys(config[key]).reduce((normObj, filePath) => {
    filePath = path.resolve(
      config.rootDir,
      _replaceRootDirInPath(config.rootDir, filePath),
    );
    normObj[filePath] = true;
    return normObj;
  }, Object.create(null));
};

const normalizeCollectCoverageFrom = (config: InitialConfig, key: string) => {
  let value;
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

  return value;
};

const normalizeUnmockedModulePathPatterns = (
  config: InitialConfig,
  key: string
) => {
  // _replaceRootDirTags is specifically well-suited for substituting
  // <rootDir> in paths (it deals with properly interpreting relative path
  // separators, etc).
  //
  // For patterns, direct global substitution is far more ideal, so we
  // special case substitutions for patterns here.
  return config[key].map(pattern =>
    utils.replacePathSepForRegex(
      pattern.replace(/<rootDir>/g, config.rootDir),
    )
  );
};

const normalizePreprocessor = (config: InitialConfig) => {
  /* eslint-disable max-len */
  if (config.scriptPreprocessor && config.transform) {
    throw createConfigError(
`  Options: ${chalk.bold('scriptPreprocessor')} and ${chalk.bold('transform')} cannot be used together.
  Please change your configuration to only use ${chalk.bold('transform')}.`
    );
  }

  if (config.preprocessorIgnorePatterns && config.transformIgnorePatterns) {
    throw createConfigError(
`  Options ${chalk.bold('preprocessorIgnorePatterns')} and ${chalk.bold('transformIgnorePatterns')} cannot be used together.
  Please change your configuration to only use ${chalk.bold('transformIgnorePatterns')}.`
    );
  }
  /* eslint-enable max-len */

  if (config.scriptPreprocessor) {
    config.transform = {
      '.*': config.scriptPreprocessor,
    };
  }

  if (config.preprocessorIgnorePatterns) {
    config.transformIgnorePatterns = config.preprocessorIgnorePatterns;
  }

  delete config.scriptPreprocessor;
  delete config.preprocessorIgnorePatterns;
};

const normalizeMissingOptions = (config: InitialConfig) => {
  if (!config.name) {
    config.name = crypto.createHash('md5').update(config.rootDir).digest('hex');
  }

  if (!config.setupFiles) {
    config.setupFiles = [];
  }

  if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('jest-jasmine2');
  } else {
    config.testRunner =
      resolve(config.rootDir, 'testRunner', config.testRunner);
  }

  return config;
};

const normalizeRootDir = (config: InitialConfig) => {
  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw createConfigError(
      `  Configuration option ${chalk.bold('rootDir')} must be specified.`
    );
  }
  config.rootDir = path.normalize(config.rootDir);
};

const normalizeArgv = (config: InitialConfig, argv: Object) => {
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

  if (argv.env) {
    config.testEnvironment = argv.env;
  }
};

function normalize(config: InitialConfig, argv: Object = {}) {
  validate(config, {
    comment: DOCUMENTATION_NOTE,
    deprecatedConfig: DEPRECATED_CONFIG,
    exampleConfig: VALID_CONFIG,
  });

  normalizePreprocessor(config);
  normalizeRootDir(config);
  normalizeMissingOptions(config);
  normalizeArgv(config, argv);

  if (config.preset) {
    config = setupPreset(config, config.preset);
  }
  if (config.testEnvironment) {
    config.testEnvironment = getTestEnvironment(config);
  }

  const babelJest = setupBabelJest(config);
  const newConfig = Object.assign({}, DEFAULT_CONFIG);

  Object.keys(config).reduce((newConfig, key) => {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = normalizeCollectCoverageOnlyFrom(config, key);
        break;
      case 'setupFiles':
      case 'snapshotSerializers':
        //$FlowFixMe
        value = config[key].map(resolve.bind(null, config.rootDir, key));
        break;
      case 'testPathDirs':
        //$FlowFixMe
        value = config[key].map(filePath => path.resolve(
          config.rootDir,
          _replaceRootDirInPath(config.rootDir, filePath),
        ));
        break;
      case 'collectCoverageFrom':
        value = normalizeCollectCoverageFrom(config, key);
        break;
      case 'cacheDirectory':
      case 'coverageDirectory':
        value = path.resolve(
          config.rootDir,
          //$FlowFixMe
          _replaceRootDirInPath(config.rootDir, config[key]),
        );
        break;
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
        //$FlowFixMe
        value = resolve(config.rootDir, key, config[key]);
        break;
      case 'moduleNameMapper':
        //$FlowFixMe
        value = Object.keys(config[key]).map(regex => [
          regex,
          //$FlowFixMe
          _replaceRootDirTags(config.rootDir, config[key][regex]),
        ]);
        break;
      case 'transform':
        //$FlowFixMe
        value = Object.keys(config[key]).map(regex => [
          regex,
          //$FlowFixMe
          resolve(config.rootDir, key, config[key][regex]),
        ]);
        break;
      case 'coveragePathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'transformIgnorePatterns':
      case 'unmockedModulePathPatterns':
        value = normalizeUnmockedModulePathPatterns(config, key);
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
      case 'testMatch':
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
    }
    newConfig[key] = value;
    return newConfig;
  }, newConfig);

  if (babelJest) {
    const polyfillPath = Resolver.findNodeModule('babel-polyfill', {
      basedir: config.rootDir,
    });

    if (polyfillPath) {
      newConfig.setupFiles.unshift(polyfillPath);
    }
  }

  if (config.testRegex && config.testMatch) {
    throw createConfigError(
      `  Configuration options ${chalk.bold('testMatch')} and` +
      ` ${chalk.bold('testRegex')} cannot be used together.`
    );
  }

  if (config.testRegex && (!config.testMatch)) {
    // Prevent the default testMatch conflicting with any explicitly
    // configured `testRegex` value
    newConfig.testMatch = [];
  }

  // If argv.json is set, coverageReporters shouldn't print a text report.
  if (argv.json) {
    newConfig.coverageReporters = (newConfig.coverageReporters || [])
      .filter(reporter => reporter !== 'text');
  }

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
}

module.exports = normalize;
