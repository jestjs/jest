/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto';
import path from 'path';
import glob from 'glob';
import {Config} from '@jest/types';
import {ValidationError, validate} from 'jest-validate';
import {clearLine, replacePathSepForGlob} from 'jest-util';
import chalk from 'chalk';
import micromatch from 'micromatch';
import {sync as realpath} from 'realpath-native';
import Resolver from 'jest-resolve';
import {replacePathSepForRegex} from 'jest-regex-util';
import getType from 'jest-get-type';
import validatePattern from './validatePattern';
import getMaxWorkers from './getMaxWorkers';
import {
  BULLET,
  DOCUMENTATION_NOTE,
  replaceRootDirInPath,
  _replaceRootDirTags,
  escapeGlobCharacters,
  getTestEnvironment,
  getRunner,
  getWatchPlugin,
  resolve,
  getSequencer,
} from './utils';
import {DEFAULT_JS_PATTERN, DEFAULT_REPORTER_LABEL} from './constants';
import {validateReporters} from './ReporterValidationErrors';
import DEFAULT_CONFIG from './Defaults';
import DEPRECATED_CONFIG from './Deprecated';
import setFromArgv from './setFromArgv';
import VALID_CONFIG from './ValidConfig';
const ERROR = `${BULLET}Validation Error`;
const PRESET_EXTENSIONS = ['.json', '.js'];
const PRESET_NAME = 'jest-preset';

type AllOptions = Config.ProjectConfig & Config.GlobalConfig;
type RequiredInitialOptions = Required<Config.InitialOptions>;

/// needed if dependencyExtractor ,globalSetup ,moduleLoader.. stay as optional and null
type NonNullableInitialOptions = {
  [P in keyof Config.InitialOptions]-?: NonNullable<Config.InitialOptions[P]>
};

const createConfigError = (message: string) =>
  new ValidationError(ERROR, message, DOCUMENTATION_NOTE);

const mergeOptionWithPreset = (
  options: Config.InitialOptions,
  preset: Config.InitialOptions,
  optionName: keyof Pick<
    Config.InitialOptions,
    'moduleNameMapper' | 'transform'
  >,
) => {
  if (options[optionName] && preset[optionName]) {
    options[optionName] = {
      ...options[optionName],
      ...preset[optionName],
      ...options[optionName],
    };
  }
};

const setupPreset = (
  options: Config.InitialOptions,
  optionsPreset: string,
): Config.InitialOptions => {
  let preset: Config.InitialOptions;
  const presetPath = replaceRootDirInPath(options.rootDir, optionsPreset);
  const presetModule = Resolver.findNodeModule(
    presetPath.startsWith('.')
      ? presetPath
      : path.join(presetPath, PRESET_NAME),
    {
      basedir: options.rootDir,
      extensions: PRESET_EXTENSIONS,
    },
  );

  try {
    // Force re-evaluation to support multiple projects
    try {
      if (presetModule) {
        delete require.cache[require.resolve(presetModule)];
      }
    } catch (e) {}

    // @ts-ignore: `presetModule` can be null?
    preset = require(presetModule);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw createConfigError(
        `  Preset ${chalk.bold(presetPath)} is invalid:\n\n  ${
          error.message
        }\n  ${error.stack}`,
      );
    }

    const preset = Resolver.findNodeModule(presetPath, {
      basedir: options.rootDir,
    });

    if (preset) {
      throw createConfigError(
        `  Module ${chalk.bold(
          presetPath,
        )} should have "jest-preset.js" or "jest-preset.json" file at the root.`,
      );
    }

    throw createConfigError(`  Preset ${chalk.bold(presetPath)} not found.`);
  }

  if (options.setupFiles) {
    options.setupFiles = (preset.setupFiles || []).concat(options.setupFiles);
  }
  if (options.modulePathIgnorePatterns && preset.modulePathIgnorePatterns) {
    options.modulePathIgnorePatterns = preset.modulePathIgnorePatterns.concat(
      options.modulePathIgnorePatterns,
    );
  }
  mergeOptionWithPreset(options, preset, 'moduleNameMapper');
  mergeOptionWithPreset(options, preset, 'transform');

  return {...preset, ...options};
};

const setupBabelJest = (options: Config.InitialOptions) => {
  const transform = options.transform;
  let babelJest;
  if (transform) {
    const customJSPattern = Object.keys(transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });
    const customTSPattern = Object.keys(transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.ts') || regex.test('a.tsx');
    });

    if (customJSPattern) {
      const customJSTransformer = transform[customJSPattern];

      if (customJSTransformer === 'babel-jest') {
        babelJest = require.resolve('babel-jest');
        transform[customJSPattern] = babelJest;
      } else if (customJSTransformer.includes('babel-jest')) {
        babelJest = customJSTransformer;
      }
    }

    if (customTSPattern) {
      const customTSTransformer = transform[customTSPattern];

      if (customTSTransformer === 'babel-jest') {
        babelJest = require.resolve('babel-jest');
        transform[customTSPattern] = babelJest;
      } else if (customTSTransformer.includes('babel-jest')) {
        babelJest = customTSTransformer;
      }
    }
  } else {
    babelJest = require.resolve('babel-jest');
    options.transform = {
      [DEFAULT_JS_PATTERN]: babelJest,
    };
  }
};

//Initial Config has collectCoverageOnlyFrom as keyed object but this also handles string Arrays
const normalizeCollectCoverageOnlyFrom = (
  initialCollectCoverageFrom:
    | RequiredInitialOptions['collectCoverageOnlyFrom']
    | Array<string>,
  rootDir: Config.InitialOptions['rootDir'],
): RequiredInitialOptions['collectCoverageOnlyFrom'] => {
  const collectCoverageOnlyFrom: Array<Config.Glob> = Array.isArray(
    initialCollectCoverageFrom,
  )
    ? initialCollectCoverageFrom // passed from argv
    : Object.keys(initialCollectCoverageFrom); // passed from options
  return collectCoverageOnlyFrom.reduce((map, filePath) => {
    filePath = path.resolve(rootDir, replaceRootDirInPath(rootDir, filePath));
    map[filePath] = true;
    return map;
  }, Object.create(null));
};

//collectCoverageFrom doesnt support type string but we have JSON.parse(initialCollectCoverageFrom) block..
const normalizeCollectCoverageFrom = (
  initialCollectCoverageFrom:
    | RequiredInitialOptions['collectCoverageFrom']
    | string,
) => {
  // const initialCollectCoverageFrom = options[key];
  let value: Array<Config.Glob> | undefined;

  if (!initialCollectCoverageFrom) {
    value = [];
  }

  if (!Array.isArray(initialCollectCoverageFrom)) {
    try {
      value = JSON.parse(initialCollectCoverageFrom);
    } catch (e) {}

    if (initialCollectCoverageFrom && !Array.isArray(value)) {
      value = [initialCollectCoverageFrom];
    }
  } else {
    value = initialCollectCoverageFrom;
  }

  if (value) {
    value = value.map(filePath =>
      filePath.replace(/^(!?)(<rootDir>\/)(.*)/, '$1$3'),
    );
  }

  return value;
};

const normalizeUnmockedModulePathPatterns = (
  value: RequiredInitialOptions[
    | 'coveragePathIgnorePatterns'
    | 'modulePathIgnorePatterns'
    | 'testPathIgnorePatterns'
    | 'transformIgnorePatterns'
    | 'watchPathIgnorePatterns'
    | 'unmockedModulePathPatterns'],
  rootDir: Config.InitialOptions['rootDir'],
) =>
  // _replaceRootDirTags is specifically well-suited for substituting
  // <rootDir> in paths (it deals with properly interpreting relative path
  // separators, etc).
  //
  // For patterns, direct global substitution is far more ideal, so we
  // special case substitutions for patterns here.
  value.map(pattern =>
    replacePathSepForRegex(pattern.replace(/<rootDir>/g, rootDir)),
  );

const normalizePreprocessor = (
  options: Config.InitialOptions,
): Config.InitialOptions => {
  if (options.scriptPreprocessor && options.transform) {
    throw createConfigError(
      `  Options: ${chalk.bold('scriptPreprocessor')} and ${chalk.bold(
        'transform',
      )} cannot be used together.
  Please change your configuration to only use ${chalk.bold('transform')}.`,
    );
  }

  if (options.preprocessorIgnorePatterns && options.transformIgnorePatterns) {
    throw createConfigError(
      `  Options ${chalk.bold('preprocessorIgnorePatterns')} and ${chalk.bold(
        'transformIgnorePatterns',
      )} cannot be used together.
  Please change your configuration to only use ${chalk.bold(
    'transformIgnorePatterns',
  )}.`,
    );
  }

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
  return options;
};

const normalizeMissingOptions = (
  options: Config.InitialOptions,
  configPath: Config.Path | null | undefined,
  projectIndex: number,
): Config.InitialOptions => {
  if (!options.name) {
    options.name = crypto
      .createHash('md5')
      .update(options.rootDir)
      // In case we load config from some path that has the same root dir
      .update(configPath || '')
      .update(String(projectIndex))
      .digest('hex');
  }

  if (!options.setupFiles) {
    options.setupFiles = [];
  }

  return options;
};

const normalizeRootDir = (
  options: Config.InitialOptions,
): Config.InitialOptions => {
  // Assert that there *is* a rootDir
  if (!options.hasOwnProperty('rootDir')) {
    throw createConfigError(
      `  Configuration option ${chalk.bold('rootDir')} must be specified.`,
    );
  }
  options.rootDir = path.normalize(options.rootDir);

  try {
    // try to resolve windows short paths, ignoring errors (permission errors, mostly)
    options.rootDir = realpath(options.rootDir);
  } catch (e) {
    // ignored
  }

  return options;
};

const normalizeReporters = (options: Config.InitialOptions) => {
  const reporters = options.reporters;
  if (!reporters || !Array.isArray(reporters)) {
    return options;
  }

  validateReporters(reporters);
  options.reporters = reporters.map(reporterConfig => {
    const normalizedReporterConfig: Config.ReporterConfig =
      typeof reporterConfig === 'string'
        ? // if reporter config is a string, we wrap it in an array
          // and pass an empty object for options argument, to normalize
          // the shape.
          [reporterConfig, {}]
        : reporterConfig;

    const reporterPath = replaceRootDirInPath(
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

const buildTestPathPattern = (argv: Config.Argv): string => {
  const patterns = [];

  if (argv._) {
    patterns.push(...argv._);
  }
  if (argv.testPathPattern) {
    patterns.push(...argv.testPathPattern);
  }

  const replacePosixSep = (pattern: string) => {
    if (path.sep === '/') {
      return pattern;
    }
    return pattern.replace(/\//g, '\\\\');
  };

  const testPathPattern = patterns.map(replacePosixSep).join('|');
  if (validatePattern(testPathPattern)) {
    return testPathPattern;
  } else {
    showTestPathPatternError(testPathPattern);
    return '';
  }
};

const showTestPathPatternError = (testPathPattern: string) => {
  clearLine(process.stdout);

  console.log(
    chalk.red(
      `  Invalid testPattern ${testPathPattern} supplied. ` +
        `Running all tests instead.`,
    ),
  );
};

export default function normalize(
  options: Config.InitialOptions,
  argv: Config.Argv,
  configPath?: Config.Path | null,
  projectIndex: number = Infinity,
): {
  hasDeprecationWarnings: boolean;
  options: AllOptions;
} {
  const {hasDeprecationWarnings} = validate(options, {
    comment: DOCUMENTATION_NOTE,
    deprecatedConfig: DEPRECATED_CONFIG,
    exampleConfig: VALID_CONFIG,
    recursiveBlacklist: [
      'collectCoverageOnlyFrom',
      // 'coverageThreshold' allows to use 'global' and glob strings on the same
      // level, there's currently no way we can deal with such config
      'coverageThreshold',
      'globals',
      'moduleNameMapper',
      'testEnvironmentOptions',
      'transform',
    ],
  });

  options = normalizePreprocessor(
    normalizeReporters(
      normalizeMissingOptions(
        normalizeRootDir(setFromArgv(options, argv)),
        configPath,
        projectIndex,
      ),
    ),
  );

  if (options.preset) {
    options = setupPreset(options, options.preset);
  }

  if (!options.setupFilesAfterEnv) {
    options.setupFilesAfterEnv = [];
  }

  if (
    options.setupTestFrameworkScriptFile &&
    options.setupFilesAfterEnv.length > 0
  ) {
    throw createConfigError(`  Options: ${chalk.bold(
      'setupTestFrameworkScriptFile',
    )} and ${chalk.bold('setupFilesAfterEnv')} cannot be used together.
  Please change your configuration to only use ${chalk.bold(
    'setupFilesAfterEnv',
  )}.`);
  }

  if (options.setupTestFrameworkScriptFile) {
    options.setupFilesAfterEnv.push(options.setupTestFrameworkScriptFile);
  }

  options.testEnvironment = getTestEnvironment({
    rootDir: options.rootDir,
    testEnvironment: options.testEnvironment || DEFAULT_CONFIG.testEnvironment,
  });

  if (!options.roots && options.testPathDirs) {
    options.roots = options.testPathDirs;
    delete options.testPathDirs;
  }

  if (!options.roots) {
    options.roots = [options.rootDir];
  }

  if (!options.testRunner || options.testRunner === 'jasmine2') {
    options.testRunner = require.resolve('jest-jasmine2');
  }

  if (!options.coverageDirectory) {
    options.coverageDirectory = path.resolve(options.rootDir, 'coverage');
  }

  setupBabelJest(options);
  // TODO: Type this properly
  const newOptions = ({
    ...DEFAULT_CONFIG,
  } as unknown) as AllOptions;

  if (options.resolver) {
    newOptions.resolver = resolve(null, {
      filePath: options.resolver,
      key: 'resolver',
      rootDir: options.rootDir,
    });
  }

  const optionKeys = Object.keys(options) as Array<keyof Config.InitialOptions>;

  // This is cheating, because it claims that all keys of InitialOptions are Required.
  // We only really know it's Required for oldOptions[key], not for oldOptions.someOtherKey,
  // so oldOptions[key] is the only way it should be used.
  const oldOptions = options as NonNullableInitialOptions;

  for (const key of optionKeys) {
    // First skip all null & undefined ( this allows casting oldOptions as NonNullableInitialOptions )
    if (oldOptions[key] == null) break;

    switch (key) {
      default:
        /// Handle depreciated keys and Manual Skips to handle correct types
        // Check which keys arent in switch
        // const KeysMissingInSwitchBlock = key;
        // keys that are in InitialOptions but not AllOptions
        //type diffKeys=Exclude< keyof Config.InitialOptions,keyof AllOptions>;
        //"mapCoverage" | "preprocessorIgnorePatterns" | "preset" | "scriptPreprocessor" | "setupTestFrameworkScriptFile" | "testPathDirs"

        ///key should be never, left here to confirm no type errors, but do we want to leave this here?
        newOptions[key] = oldOptions[key];

        break;
      /// Use this first block to handle manual skips, to ensure default above has no error TODO: Ask about these keys
      case 'resolver': // handled above
      case 'mapCoverage': // Deprecated
      case 'scriptPreprocessor': // handled above
      case 'json': // argv handled above
      case 'preprocessorIgnorePatterns': // handled above
      case 'preset': // handled above
      case 'setupTestFrameworkScriptFile': // handled above
      case 'testPathDirs':
      case 'testSequencer': // handled above
      case 'updateSnapshot': /// handled in argv
        break;
      case 'collectCoverageOnlyFrom':
        newOptions[key] = normalizeCollectCoverageOnlyFrom(
          oldOptions[key],
          oldOptions['rootDir'],
        );

        break;
      case 'setupFiles':
      case 'setupFilesAfterEnv':
      case 'snapshotSerializers':
        newOptions[key] = oldOptions[key].map(filePath =>
          resolve(newOptions.resolver, {
            filePath,
            key,
            rootDir: options.rootDir,
          }),
        );

        break;
      case 'modulePaths':
      case 'roots':
        newOptions[key] = oldOptions[key].map(filePath =>
          path.resolve(
            options.rootDir,
            replaceRootDirInPath(options.rootDir, filePath),
          ),
        );

        break;
      case 'collectCoverageFrom':
        const result = normalizeCollectCoverageFrom(oldOptions[key]);
        if (result) {
          newOptions[key] = result;
        }

        break;
      case 'cacheDirectory':
      case 'coverageDirectory':
        newOptions[key] = path.resolve(
          options.rootDir,
          replaceRootDirInPath(options.rootDir, oldOptions[key]),
        );

        break;
      case 'dependencyExtractor':
      case 'globalSetup':
      case 'globalTeardown':
      case 'moduleLoader':
      case 'snapshotResolver':
      case 'testResultsProcessor':
      case 'testRunner':
      case 'filter':
        newOptions[key] = resolve(newOptions.resolver, {
          filePath: oldOptions[key],
          key,
          rootDir: options.rootDir,
        });

        break;
      case 'runner':
        {
          const option = oldOptions[key];

          newOptions[key] = getRunner(newOptions.resolver, {
            filePath: option,
            rootDir: options.rootDir,
          });
        }

        break;
      case 'prettierPath':
        {
          // We only want this to throw if "prettierPath" is explicitly passed
          // from config or CLI, and the requested path isn't found. Otherwise we
          // set it to null and throw an error lazily when it is used.

          const option = oldOptions[key];

          newOptions[key] = resolve(newOptions.resolver, {
            filePath: option,
            key,
            optional: option === DEFAULT_CONFIG[key],
            rootDir: options.rootDir,
          });
        }
        break;
      case 'moduleNameMapper':
        const moduleNameMapper = oldOptions[key];

        newOptions[key] = Object.keys(moduleNameMapper).map<[string, string]>(
          regex => {
            const item = moduleNameMapper[regex];
            return [regex, _replaceRootDirTags(options.rootDir, item)];
          },
        );

        break;
      case 'transform':
        {
          const transform = oldOptions[key];

          newOptions[key] = Object.keys(transform).map(regex => [
            regex,
            resolve(newOptions.resolver, {
              filePath: transform[regex],
              key,
              rootDir: options.rootDir,
            }),
          ]);
        }
        break;
      case 'coveragePathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'transformIgnorePatterns':
      case 'watchPathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        newOptions[key] = normalizeUnmockedModulePathPatterns(
          oldOptions[key],
          options.rootDir,
        );

        break;
      case 'haste':
        {
          const hasteOption = oldOptions[key];

          if (hasteOption.hasteImplModulePath != null) {
            const resolvedHasteImpl = resolve(newOptions.resolver, {
              filePath: replaceRootDirInPath(
                options.rootDir,
                hasteOption.hasteImplModulePath,
              ),
              key: 'haste.hasteImplModulePath',
              rootDir: options.rootDir,
            });

            hasteOption.hasteImplModulePath = resolvedHasteImpl || undefined;
          }
          newOptions[key] = hasteOption;
        }
        break;
      case 'projects':
        newOptions[key] = oldOptions[key].reduce(
          (projects, project) => {
            // Project can be specified as globs. If a glob matches any files,
            // We expand it to these paths. If not, we keep the original path
            // for the future resolution.
            const globMatches =
              typeof project === 'string'
                ? glob.sync(_replaceRootDirTags(options.rootDir, project))
                : [];
            return projects.concat(globMatches.length ? globMatches : project);
          },
          <Array<string>>[],
        );

        break;
      case 'moduleDirectories':
      case 'testMatch':
        {
          const option = oldOptions[key];
          if (!option) break;

          const replacedRootDirTags = _replaceRootDirTags(
            escapeGlobCharacters(options.rootDir),
            option,
          );

          if (replacedRootDirTags) {
            newOptions[key] = Array.isArray(replacedRootDirTags)
              ? replacedRootDirTags.map(replacePathSepForGlob)
              : [replacePathSepForGlob(replacedRootDirTags)];
          } else {
            newOptions[key] = replacedRootDirTags;
          }
        }
        break;
      case 'testRegex':
        {
          const option = oldOptions[key];
          newOptions[key] = option
            ? (Array.isArray(option) ? option : [option]).map(
                replacePathSepForRegex,
              )
            : [];
        }
        break;
      case 'moduleFileExtensions': {
        const value = oldOptions[key];

        if (
          Array.isArray(value) && // If it's the wrong type, it can throw at a later time
          (options.runner === undefined ||
            options.runner === DEFAULT_CONFIG.runner) && // Only require 'js' for the default jest-runner
          !value.includes('js')
        ) {
          const errorMessage =
            `  moduleFileExtensions must include 'js':\n` +
            `  but instead received:\n` +
            `    ${chalk.bold.red(JSON.stringify(value))}`;

          // If `js` is not included, any dependency Jest itself injects into
          // the environment, like jasmine or sourcemap-support, will need to
          // `require` its modules with a file extension. This is not plausible
          // in the long run, so it's way easier to just fail hard early.
          // We might consider throwing if `json` is missing as well, as it's a
          // fair assumption from modules that they can do
          // `require('some-package/package') without the trailing `.json` as it
          // works in Node normally.
          throw createConfigError(
            errorMessage +
              "\n  Please change your configuration to include 'js'.",
          );
        }
        if (value) {
          newOptions[key] = value;
        }
        break;
      }
      case 'bail': {
        const bail = oldOptions[key];
        if (typeof bail === 'boolean') {
          newOptions[key] = bail ? 1 : 0;
        } else if (typeof bail === 'string') {
          newOptions[key] = 1;
          // If Jest is invoked as `jest --bail someTestPattern` then need to
          // move the pattern from the `bail` configuration and into `argv._`
          // to be processed as an extra parameter
          argv._.push(bail);
        } else {
          newOptions[key] = bail;
        }
        break;
      }
      case 'displayName': {
        const displayName = oldOptions[key];
        if (typeof displayName === 'string') {
          newOptions[key] = displayName;
          break;
        }
        /**
         * Ensuring that displayName shape is correct here so that the
         * reporters can trust the shape of the data
         * TODO: Normalize "displayName" such that given a config option
         * {
         *  "displayName": "Test"
         * }
         * becomes
         * {
         *   displayName: {
         *     name: "Test",
         *     color: "white"
         *   }
         * }
         *
         * This can't be done now since this will be a breaking change
         * for custom reporters
         */
        if (getType(displayName) === 'object') {
          const errorMessage =
            `  Option "${chalk.bold('displayName')}" must be of type:\n\n` +
            '  {\n' +
            '    name: string;\n' +
            '    color: string;\n' +
            '  }\n';
          const {name, color} = displayName;
          if (
            !name ||
            !color ||
            typeof name !== 'string' ||
            typeof color !== 'string'
          ) {
            throw createConfigError(errorMessage);
          }
        }
        newOptions[key] = oldOptions[key];
        break;
      }
      case 'automock':
      case 'browser':
      case 'cache':
      case 'changedSince':
      case 'changedFilesWithAncestor':
      case 'clearMocks':
      case 'collectCoverage':
      case 'coverageReporters':
      case 'coverageThreshold':
      case 'detectLeaks':
      case 'detectOpenHandles':
      case 'errorOnDeprecated':
      case 'expand':
      case 'extraGlobals':
      case 'globals':
      case 'findRelatedTests':
      case 'forceCoverageMatch':
      case 'forceExit':
      case 'lastCommit':
      case 'listTests':
      case 'logHeapUsage':
      case 'maxConcurrency':
      case 'name':
      case 'noStackTrace':
      case 'notify':
      case 'notifyMode':
      case 'onlyChanged':
      case 'outputFile':
      case 'passWithNoTests':
      case 'replname':
      case 'reporters':
      case 'resetMocks':
      case 'resetModules':
      case 'restoreMocks':
      case 'rootDir':
      case 'runTestsByPath':
      case 'silent':
      case 'skipFilter':
      case 'skipNodeResolution':
      case 'testEnvironment':
      case 'testEnvironmentOptions':
      case 'testFailureExitCode':
      case 'testLocationInResults':
      case 'testNamePattern':
      case 'testURL':
      case 'timers':
      case 'useStderr':
      case 'verbose':
      case 'watch':
      case 'watchAll':
      case 'watchman':
        newOptions[key] = oldOptions[key];

        break;
      case 'watchPlugins':
        newOptions[key] = oldOptions[key].map(watchPlugin => {
          if (typeof watchPlugin === 'string') {
            return {
              config: {},
              path: getWatchPlugin(newOptions.resolver, {
                filePath: watchPlugin,
                rootDir: options.rootDir,
              }),
            };
          } else {
            return {
              config: watchPlugin[1] || {},
              path: getWatchPlugin(newOptions.resolver, {
                filePath: watchPlugin[0],
                rootDir: options.rootDir,
              }),
            };
          }
        });
        break;
    }
    // Nothing should be done here for type sakes
  }

  try {
    // try to resolve windows short paths, ignoring errors (permission errors, mostly)
    newOptions.cwd = realpath(process.cwd());
  } catch (e) {
    // ignored
  }

  newOptions.testSequencer = getSequencer(newOptions.resolver, {
    filePath: options.testSequencer || DEFAULT_CONFIG.testSequencer,
    rootDir: options.rootDir,
  });

  newOptions.nonFlagArgs = argv._;
  newOptions.testPathPattern = buildTestPathPattern(argv);
  newOptions.json = !!argv.json;

  newOptions.testFailureExitCode = parseInt(
    (newOptions.testFailureExitCode as unknown) as string,
    10,
  );

  if (
    newOptions.lastCommit ||
    newOptions.changedFilesWithAncestor ||
    newOptions.changedSince
  ) {
    newOptions.onlyChanged = true;
  }

  if (argv.all) {
    newOptions.onlyChanged = false;
  } else if (newOptions.testPathPattern) {
    // When passing a test path pattern we don't want to only monitor changed
    // files unless `--watch` is also passed.
    newOptions.onlyChanged = newOptions.watch;
  }

  newOptions.updateSnapshot =
    argv.ci && !argv.updateSnapshot
      ? 'none'
      : argv.updateSnapshot
      ? 'all'
      : 'new';

  newOptions.maxConcurrency = parseInt(
    (newOptions.maxConcurrency as unknown) as string,
    10,
  );
  newOptions.maxWorkers = getMaxWorkers(argv);

  if (newOptions.testRegex!.length && options.testMatch) {
    throw createConfigError(
      `  Configuration options ${chalk.bold('testMatch')} and` +
        ` ${chalk.bold('testRegex')} cannot be used together.`,
    );
  }

  if (newOptions.testRegex!.length && !options.testMatch) {
    // Prevent the default testMatch conflicting with any explicitly
    // configured `testRegex` value
    newOptions.testMatch = [];
  }

  // If argv.json is set, coverageReporters shouldn't print a text report.
  if (argv.json) {
    newOptions.coverageReporters = (newOptions.coverageReporters || []).filter(
      reporter => reporter !== 'text',
    );
  }

  // If collectCoverage is enabled while using --findRelatedTests we need to
  // avoid having false negatives in the generated coverage report.
  // The following: `--findRelatedTests '/rootDir/file1.js' --coverage`
  // Is transformed to: `--findRelatedTests '/rootDir/file1.js' --coverage --collectCoverageFrom 'file1.js'`
  // where arguments to `--collectCoverageFrom` should be globs (or relative
  // paths to the rootDir)
  if (newOptions.collectCoverage && argv.findRelatedTests) {
    let collectCoverageFrom = argv._.map(filename => {
      filename = replaceRootDirInPath(options.rootDir, filename);
      return path.isAbsolute(filename)
        ? path.relative(options.rootDir, filename)
        : filename;
    });

    // Don't override existing collectCoverageFrom options
    if (newOptions.collectCoverageFrom) {
      collectCoverageFrom = collectCoverageFrom.reduce((patterns, filename) => {
        if (
          !micromatch.some(
            replacePathSepForGlob(path.relative(options.rootDir, filename)),
            newOptions.collectCoverageFrom!,
          )
        ) {
          return patterns;
        }
        return [...patterns, filename];
      }, newOptions.collectCoverageFrom);
    }

    newOptions.collectCoverageFrom = collectCoverageFrom;
  }

  return {
    hasDeprecationWarnings,
    options: newOptions,
  };
}
