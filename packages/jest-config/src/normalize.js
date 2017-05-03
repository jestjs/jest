/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {InitialOptions, ReporterConfig} from 'types/Config';

const {
  BULLET,
  DOCUMENTATION_NOTE,
  _replaceRootDirInObject,
  _replaceRootDirInPath,
  _replaceRootDirTags,
  getTestEnvironment,
  resolve,
} = require('./utils');
const {
  NODE_MODULES,
  DEFAULT_JS_PATTERN,
  DEFAULT_REPORTER_LABEL,
} = require('./constants');
const {validateReporters} = require('./reporterValidationErrors');
const {ValidationError, validate} = require('jest-validate');
const chalk = require('chalk');
const crypto = require('crypto');
const DEFAULT_CONFIG = require('./defaults');
const DEPRECATED_CONFIG = require('./deprecated');
const ERROR = `${BULLET}Validation Error`;
const glob = require('glob');
const JSON_EXTENSION = '.json';
const path = require('path');
const PRESET_NAME = 'jest-preset' + JSON_EXTENSION;
const Resolver = require('jest-resolve');
const setFromArgv = require('./setFromArgv');
const utils = require('jest-regex-util');
const VALID_CONFIG = require('./validConfig');

const createConfigError = message =>
  new ValidationError(ERROR, message, DOCUMENTATION_NOTE);

const setupPreset = (options: Object, optionsPreset: string) => {
  let preset;
  const presetPath = _replaceRootDirInPath(options.rootDir, optionsPreset);
  const presetModule = Resolver.findNodeModule(
    presetPath.endsWith(JSON_EXTENSION)
      ? presetPath
      : path.join(presetPath, PRESET_NAME),
    {
      basedir: options.rootDir,
    },
  );

  try {
    // $FlowFixMe
    preset = require(presetModule);
  } catch (error) {
    throw createConfigError(`  Preset ${chalk.bold(presetPath)} not found.`);
  }

  if (options.setupFiles) {
    options.setupFiles = (preset.setupFiles || []).concat(options.setupFiles);
  }
  if (options.modulePathIgnorePatterns) {
    options.modulePathIgnorePatterns = preset.modulePathIgnorePatterns.concat(
      options.modulePathIgnorePatterns,
    );
  }
  if (options.moduleNameMapper) {
    options.moduleNameMapper = Object.assign(
      {},
      preset.moduleNameMapper,
      options.moduleNameMapper,
    );
  }
  return Object.assign({}, preset, options);
};

const setupBabelJest = (options: Object) => {
  let babelJest;
  const basedir = options.rootDir;

  if (options.transform) {
    const customJSPattern = Object.keys(options.transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });

    if (customJSPattern) {
      const jsTransformer = Resolver.findNodeModule(
        options.transform[customJSPattern],
        {basedir},
      );
      if (
        jsTransformer &&
        jsTransformer.includes(NODE_MODULES + 'babel-jest')
      ) {
        babelJest = jsTransformer;
      }
    }
  } else {
    babelJest = Resolver.findNodeModule('babel-jest', {basedir});
    if (babelJest) {
      options.transform = {
        [DEFAULT_JS_PATTERN]: 'babel-jest',
      };
    }
  }

  return babelJest;
};

const normalizeCollectCoverageOnlyFrom = (
  options: InitialOptions,
  key: string,
) => {
  const collectCoverageOnlyFrom = Array.isArray(options[key])
    ? options[key] // passed from argv
    : Object.keys(options[key]); // passed from options
  return collectCoverageOnlyFrom.reduce((map, filePath) => {
    filePath = path.resolve(
      options.rootDir,
      _replaceRootDirInPath(options.rootDir, filePath),
    );
    map[filePath] = true;
    return map;
  }, Object.create(null));
};

const normalizeCollectCoverageFrom = (options: InitialOptions, key: string) => {
  let value;
  if (!options[key]) {
    value = [];
  }

  if (!Array.isArray(options[key])) {
    try {
      value = JSON.parse(options[key]);
    } catch (e) {}

    Array.isArray(value) || (value = [options[key]]);
  } else {
    value = options[key];
  }

  return value;
};

const normalizeUnmockedModulePathPatterns = (
  options: InitialOptions,
  key: string,
) => {
  // _replaceRootDirTags is specifically well-suited for substituting
  // <rootDir> in paths (it deals with properly interpreting relative path
  // separators, etc).
  //
  // For patterns, direct global substitution is far more ideal, so we
  // special case substitutions for patterns here.
  return options[key].map(pattern =>
    utils.replacePathSepForRegex(
      pattern.replace(/<rootDir>/g, options.rootDir),
    ),
  );
};

const normalizePreprocessor = (options: Object) => {
  /* eslint-disable max-len */
  if (options.scriptPreprocessor && options.transform) {
    throw createConfigError(`  Options: ${chalk.bold('scriptPreprocessor')} and ${chalk.bold('transform')} cannot be used together.
  Please change your configuration to only use ${chalk.bold('transform')}.`);
  }

  if (options.preprocessorIgnorePatterns && options.transformIgnorePatterns) {
    throw createConfigError(`  Options ${chalk.bold('preprocessorIgnorePatterns')} and ${chalk.bold('transformIgnorePatterns')} cannot be used together.
  Please change your configuration to only use ${chalk.bold('transformIgnorePatterns')}.`);
  }
  /* eslint-enable max-len */

  if (options.scriptPreprocessor) {
    options.transform = {
      '.*': options.scriptPreprocessor,
    };
  }

  if (options.preprocessorIgnorePatterns) {
    options.transformIgnorePatterns = options.preprocessorIgnorePatterns;
  }

  delete options.scriptPreprocessor;
  delete options.preprocessorIgnorePatterns;
};

const normalizeMissingOptions = (options: Object) => {
  if (!options.name) {
    options.name = crypto
      .createHash('md5')
      .update(options.rootDir)
      .digest('hex');
  }

  if (!options.setupFiles) {
    options.setupFiles = [];
  }

  if (!options.testRunner || options.testRunner === 'jasmine2') {
    options.testRunner = require.resolve('jest-jasmine2');
  } else {
    options.testRunner = resolve(
      options.rootDir,
      'testRunner',
      options.testRunner,
    );
  }

  return options;
};

const normalizeRootDir = (options: Object) => {
  // Assert that there *is* a rootDir
  if (!options.hasOwnProperty('rootDir')) {
    throw createConfigError(`  Configuration option ${chalk.bold('rootDir')} must be specified.`);
  }
  options.rootDir = path.normalize(options.rootDir);
};

const normalizeReporters = (options: InitialOptions, basedir) => {
  const reporters = options.reporters;
  if (!reporters || !Array.isArray(reporters)) {
    return options;
  }

  validateReporters(reporters);
  options.reporters = reporters.map(reporterConfig => {
    const normalizedReporterConfig: ReporterConfig = typeof reporterConfig ===
      'string'
      ? // if reporter config is a string, we wrap it in an array
        // and pass an empty object for options argument, to normalize
        // the shape.
        [reporterConfig, {}]
      : reporterConfig;

    const reporterPath = _replaceRootDirInPath(
      options.rootDir,
      normalizedReporterConfig[0],
    );

    if (reporterPath !== DEFAULT_REPORTER_LABEL) {
      const reporter = Resolver.findNodeModule(reporterPath, {
        basedir: options.rootDir,
      });
      if (!reporter) {
        throw new Error(
          `Could not resolve a module for a custom reporter.\n` +
            `  Module name: ${reporterPath}`,
        );
      }
      normalizedReporterConfig[0] = reporter;
    }
    return normalizedReporterConfig;
  });

  return options;
};

function normalize(options: InitialOptions, argv: Object = {}) {
  const {hasDeprecationWarnings} = validate(options, {
    comment: DOCUMENTATION_NOTE,
    deprecatedConfig: DEPRECATED_CONFIG,
    exampleConfig: VALID_CONFIG,
  });

  options = setFromArgv(options, argv);
  normalizeReporters(options);
  normalizePreprocessor(options);
  normalizeRootDir(options);
  normalizeMissingOptions(options);

  if (options.preset) {
    options = setupPreset(options, options.preset);
  }
  if (options.testEnvironment) {
    options.testEnvironment = getTestEnvironment(options);
  }
  if (!options.roots && options.testPathDirs) {
    options.roots = options.testPathDirs;
  }

  const babelJest = setupBabelJest(options);
  const newOptions = Object.assign({}, DEFAULT_CONFIG);

  Object.keys(options).reduce((newOptions, key) => {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = normalizeCollectCoverageOnlyFrom(options, key);
        break;
      case 'setupFiles':
      case 'snapshotSerializers':
        value = options[key].map(resolve.bind(null, options.rootDir, key));
        break;
      case 'roots':
        value = options[key].map(filePath =>
          path.resolve(
            options.rootDir,
            _replaceRootDirInPath(options.rootDir, filePath),
          ),
        );
        break;
      case 'collectCoverageFrom':
        value = normalizeCollectCoverageFrom(options, key);
        break;
      case 'cacheDirectory':
      case 'coverageDirectory':
        value = path.resolve(
          options.rootDir,
          _replaceRootDirInPath(options.rootDir, options[key]),
        );
        break;
      case 'setupTestFrameworkScriptFile':
      case 'testResultsProcessor':
      case 'resolver':
        value = resolve(options.rootDir, key, options[key]);
        break;
      case 'moduleNameMapper':
        value = Object.keys(options[key]).map(regex => [
          regex,
          _replaceRootDirTags(options.rootDir, options[key][regex]),
        ]);
        break;
      case 'transform':
        value = Object.keys(options[key]).map(regex => [
          regex,
          resolve(options.rootDir, key, options[key][regex]),
        ]);
        break;
      case 'coveragePathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'transformIgnorePatterns':
      case 'unmockedModulePathPatterns':
        value = normalizeUnmockedModulePathPatterns(options, key);
        break;
      case 'haste':
        value = Object.assign({}, options[key]);
        if (value.hasteImplModulePath != null) {
          value.hasteImplModulePath = resolve(
            options.rootDir,
            'haste.hasteImplModulePath',
            value.hasteImplModulePath,
          );
        }
        break;
      case 'projects':
        let list = [];
        options[key].forEach(
          filePath =>
            (list = list.concat(
              glob.sync(_replaceRootDirInPath(options.rootDir, filePath)),
            )),
        );
        value = list;
        break;
      case 'automock':
      case 'bail':
      case 'browser':
      case 'cache':
      case 'clearMocks':
      case 'collectCoverage':
      case 'coverageReporters':
      case 'coverageThreshold':
      case 'expand':
      case 'globals':
      case 'logHeapUsage':
      case 'mapCoverage':
      case 'moduleDirectories':
      case 'moduleFileExtensions':
      case 'moduleLoader':
      case 'modulePaths':
      case 'name':
      case 'noStackTrace':
      case 'notify':
      case 'preset':
      case 'replname':
      case 'reporters':
      case 'resetMocks':
      case 'resetModules':
      case 'rootDir':
      case 'silent':
      case 'testMatch':
      case 'testEnvironment':
      case 'testNamePattern':
      case 'testRegex':
      case 'testRunner':
      case 'testURL':
      case 'timers':
      case 'updateSnapshot':
      case 'useStderr':
      case 'verbose':
      case 'watchman':
        value = options[key];
        break;
    }
    newOptions[key] = value;
    return newOptions;
  }, newOptions);

  if (babelJest) {
    const regeneratorRuntimePath = Resolver.findNodeModule(
      'regenerator-runtime/runtime',
      {basedir: options.rootDir},
    );

    if (regeneratorRuntimePath) {
      newOptions.setupFiles.unshift(regeneratorRuntimePath);
    }
  }

  if (options.testRegex && options.testMatch) {
    throw createConfigError(
      `  Configuration options ${chalk.bold('testMatch')} and` +
        ` ${chalk.bold('testRegex')} cannot be used together.`,
    );
  }

  if (options.testRegex && !options.testMatch) {
    // Prevent the default testMatch conflicting with any explicitly
    // configured `testRegex` value
    newOptions.testMatch = [];
  }

  // If argv.json is set, coverageReporters shouldn't print a text report.
  if (argv.json) {
    newOptions.coverageReporters = (newOptions.coverageReporters || [])
      .filter(reporter => reporter !== 'text');
  }

  return {
    hasDeprecationWarnings,
    options: _replaceRootDirInObject(newOptions.rootDir, newOptions),
  };
}

module.exports = normalize;
