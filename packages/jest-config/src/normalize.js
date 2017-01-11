/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const {NODE_MODULES, DEFAULT_JS_PATTERN} = require('./constants');
const chalk = require('chalk');
const crypto = require('crypto');
const DEFAULT_CONFIG = require('./defaults');
const path = require('path');
const Resolver = require('jest-resolve');
const utils = require('jest-util');
const VALID_CONFIG = require('./validConfig');
const DEPRECATED_CONFIG = require('./deprecated');
const validate = require('jest-validate');

const {
  _replaceRootDirInPath,
  _replaceRootDirTags,
  getTestEnvironment,
  resolve,
} = require('./utils');

const JSON_EXTENSION = '.json';
const PRESET_NAME = 'jest-preset' + JSON_EXTENSION;

const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration Documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;

const throwRuntimeConfigError = message => {
  throw new Error(chalk.red(message + DOCUMENTATION_NOTE));
};

const setupPreset = (config: Object) => {
  const presetPath = _replaceRootDirInPath(config.rootDir, config.preset);
  const presetModule = Resolver.findNodeModule(
    presetPath.endsWith(JSON_EXTENSION)
      ? presetPath
      : path.join(presetPath, PRESET_NAME),
    {
      basedir: config.rootDir,
    },
  );
  if (presetModule) {
    // $FlowFixMe
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
    }
    return Object.assign({}, preset, config);
  } else {
    throw new Error(
      `Jest: Preset '${presetPath}' not found.`,
    );
  }
};

const setupBabelJest = (config: Object) => {
  let babelJest;
  const basedir = config.rootDir;

  if (config.transform) {
    const customJSPattern = Object.keys(config.transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });

    if (customJSPattern) {
      const jsTransformer = Resolver.findNodeModule(
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

const normalizeCollectCoverageOnlyFrom = (config: Object, key: string) => {
  return Object.keys(config[key]).reduce((normObj, filePath) => {
    filePath = path.resolve(
      config.rootDir,
      _replaceRootDirInPath(config.rootDir, filePath),
    );
    normObj[filePath] = true;
    return normObj;
  }, Object.create(null));
};

const normalizeCollectCoverageFrom = (config: Object, key: string) => {
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

const normalizeUnmockedModulePathPatterns = (config: Object, key: string) => {
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

const preprocessorBackwardCompatibility = (config: Object) => {
  if (config.scriptPreprocessor && config.transform) {
    throwRuntimeConfigError(
      'Jest: `scriptPreprocessor` and `transform` cannot be used together. ' +
      'Please change your configuration to only use `transform`.',
    );
  }

  if (config.preprocessorIgnorePatterns && config.transformIgnorePatterns) {
    throwRuntimeConfigError(
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

  delete config.scriptPreprocessor;
  delete config.preprocessorIgnorePatterns;
};

function normalize(config: Object, argv: Object = {}) {
  validate(config, VALID_CONFIG, DEPRECATED_CONFIG);

  const newConfig = Object.assign({}, DEFAULT_CONFIG);

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error(`Jest: 'rootDir' config value must be specified.`);
  }

  config.rootDir = path.normalize(config.rootDir);

  preprocessorBackwardCompatibility(config);

  if (config.preset) {
    config = setupPreset(config);
  }

  if (!config.name) {
    config.name = crypto.createHash('md5').update(config.rootDir).digest('hex');
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
    config.testRunner =
      resolve(config.rootDir, 'testRunner', config.testRunner);
  }

  if (argv.env) {
    config.testEnvironment = argv.env;
  }

  if (config.testEnvironment) {
    config.testEnvironment = getTestEnvironment(config);
  }

  const babelJest = setupBabelJest(config);

  Object.keys(config).reduce((newConfig, key) => {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = normalizeCollectCoverageOnlyFrom(config, key);
        break;
      case 'setupFiles':
      case 'snapshotSerializers':
        value = config[key].map(resolve.bind(null, config.rootDir, key));
        break;
      case 'testPathDirs':
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
          _replaceRootDirInPath(config.rootDir, config[key]),
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

  // If argv.json is set, coverageReporters shouldn't print a text report.
  if (argv.json) {
    newConfig.coverageReporters = (newConfig.coverageReporters || [])
      .filter(reporter => reporter !== 'text');
  }

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
}

module.exports = normalize;
