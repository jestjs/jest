/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable sort-keys */

import {type Static, Type} from '@sinclair/typebox';

export const RawSnapshotFormat = Type.Partial(
  Type.Object({
    callToJSON: Type.Boolean(),
    compareKeys: Type.Null(),
    escapeRegex: Type.Boolean(),
    escapeString: Type.Boolean(),
    highlight: Type.Boolean(),
    indent: Type.Integer({minimum: 0}),
    maxDepth: Type.Integer({minimum: 0}),
    maxWidth: Type.Integer({minimum: 0}),
    min: Type.Boolean(),
    printBasicPrototype: Type.Boolean(),
    printFunctionName: Type.Boolean(),
    theme: Type.Partial(
      Type.Object({
        comment: Type.String(),
        content: Type.String(),
        prop: Type.String(),
        tag: Type.String(),
        value: Type.String(),
      }),
    ),
  }),
);

const RawCoverageProvider = Type.Union([
  Type.Literal('babel'),
  Type.Literal('v8'),
]);

const RawCoverageThresholdValue = Type.Partial(
  Type.Object({
    branches: Type.Number({minimum: 0, maximum: 100}),
    functions: Type.Number({minimum: 0, maximum: 100}),
    lines: Type.Number({minimum: 0, maximum: 100}),
    statements: Type.Number({minimum: 0, maximum: 100}),
  }),
);

const RawCoverageThresholdBase = Type.Object(
  {global: RawCoverageThresholdValue},
  {additionalProperties: RawCoverageThresholdValue},
);

const RawCoverageThreshold = Type.Unsafe<{
  global: Static<typeof RawCoverageThresholdValue>;
  [path: string]: Static<typeof RawCoverageThresholdValue>;
}>(RawCoverageThresholdBase);

// TODO: add type test that these are all the colors available in chalk.ForegroundColor
export const ChalkForegroundColors = Type.Union([
  Type.Literal('black'),
  Type.Literal('red'),
  Type.Literal('green'),
  Type.Literal('yellow'),
  Type.Literal('blue'),
  Type.Literal('magenta'),
  Type.Literal('cyan'),
  Type.Literal('white'),
  Type.Literal('gray'),
  Type.Literal('grey'),
  Type.Literal('blackBright'),
  Type.Literal('redBright'),
  Type.Literal('greenBright'),
  Type.Literal('yellowBright'),
  Type.Literal('blueBright'),
  Type.Literal('magentaBright'),
  Type.Literal('cyanBright'),
  Type.Literal('whiteBright'),
]);

const RawDisplayName = Type.Object({
  name: Type.String(),
  color: ChalkForegroundColors,
});

// TODO: verify these are the names of istanbulReport.ReportOptions
export const RawCoverageReporterNames = Type.Union([
  Type.Literal('clover'),
  Type.Literal('cobertura'),
  Type.Literal('html-spa'),
  Type.Literal('html'),
  Type.Literal('json'),
  Type.Literal('json-summary'),
  Type.Literal('lcov'),
  Type.Literal('lcovonly'),
  Type.Literal('none'),
  Type.Literal('teamcity'),
  Type.Literal('text'),
  Type.Literal('text-lcov'),
  Type.Literal('text-summary'),
]);

const RawCoverageReporters = Type.Array(
  Type.Union([
    RawCoverageReporterNames,
    Type.Tuple([
      RawCoverageReporterNames,
      Type.Record(Type.String(), Type.Unknown()),
    ]),
  ]),
);

const RawGlobalFakeTimersConfig = Type.Partial(
  Type.Object({
    enableGlobally: Type.Boolean({
      description:
        'Whether fake timers should be enabled globally for all test files.',
      default: false,
    }),
  }),
);

const RawFakeableAPI = Type.Union([
  Type.Literal('Date'),
  Type.Literal('hrtime'),
  Type.Literal('nextTick'),
  Type.Literal('performance'),
  Type.Literal('queueMicrotask'),
  Type.Literal('requestAnimationFrame'),
  Type.Literal('cancelAnimationFrame'),
  Type.Literal('requestIdleCallback'),
  Type.Literal('cancelIdleCallback'),
  Type.Literal('setImmediate'),
  Type.Literal('clearImmediate'),
  Type.Literal('setInterval'),
  Type.Literal('clearInterval'),
  Type.Literal('setTimeout'),
  Type.Literal('clearTimeout'),
]);

const RawFakeTimersConfig = Type.Partial(
  Type.Object({
    advanceTimers: Type.Union([Type.Boolean(), Type.Number({minimum: 0})], {
      description:
        'If set to `true` all timers will be advanced automatically by 20 milliseconds every 20 milliseconds. A custom ' +
        'time delta may be provided by passing a number.',
      default: false,
    }),
    doNotFake: Type.Array(RawFakeableAPI, {
      description:
        'List of names of APIs (e.g. `Date`, `nextTick()`, `setImmediate()`, `setTimeout()`) that should not be faked.' +
        '\n\nThe default is `[]`, meaning all APIs are faked.',
      default: [],
    }),
    now: Type.Integer({
      minimum: 0,
      description:
        'Sets current system time to be used by fake timers.\n\nThe default is `Date.now()`.',
    }),
    timerLimit: Type.Number({
      description:
        'The maximum number of recursive timers that will be run when calling `jest.runAllTimers()`.',
      default: 100_000,
      minimum: 0,
    }),
    legacyFakeTimers: Type.Literal(false, {
      description:
        'Use the old fake timers implementation instead of one backed by `@sinonjs/fake-timers`.',
      default: false,
    }),
  }),
);

const RawLegacyFakeTimersConfig = Type.Partial(
  Type.Object({
    legacyFakeTimers: Type.Literal(true, {
      description:
        'Use the old fake timers implementation instead of one backed by `@sinonjs/fake-timers`.',
      default: true,
    }),
  }),
);

export const RawFakeTimers = Type.Intersect([
  RawGlobalFakeTimersConfig,
  Type.Union([RawFakeTimersConfig, RawLegacyFakeTimersConfig]),
]);

const RawHasteConfig = Type.Partial(
  Type.Object({
    computeSha1: Type.Boolean({
      description: 'Whether to hash files using SHA-1.',
    }),
    defaultPlatform: Type.Union([Type.String(), Type.Null()], {
      description: 'The platform to use as the default, e.g. `ios`.',
    }),
    forceNodeFilesystemAPI: Type.Boolean({
      description:
        "Whether to force the use of Node's `fs` API when reading files rather than shelling out to `find`.",
    }),
    enableSymlinks: Type.Boolean({
      description:
        'Whether to follow symlinks when crawling for files.' +
        '\n\tThis options cannot be used in projects which use watchman.' +
        '\n\tProjects with `watchman` set to true will error if this option is set to true.',
    }),
    hasteImplModulePath: Type.String({
      description: 'Path to a custom implementation of Haste.',
    }),
    platforms: Type.Array(Type.String(), {
      description: "All platforms to target, e.g ['ios', 'android'].",
    }),
    throwOnModuleCollision: Type.Boolean({
      description: 'Whether to throw on error on module collision.',
    }),
    hasteMapModulePath: Type.String({
      description: 'Custom HasteMap module',
    }),
    retainAllFiles: Type.Boolean({
      description:
        'Whether to retain all files, allowing e.g. search for tests in `node_modules`.',
    }),
  }),
);

export const RawInitialOptions = Type.Partial(
  Type.Object(
    {
      automock: Type.Boolean(),
      bail: Type.Union([Type.Boolean(), Type.Number()]),
      cache: Type.Boolean(),
      cacheDirectory: Type.String(),
      ci: Type.Boolean(),
      clearMocks: Type.Boolean(),
      changedFilesWithAncestor: Type.Boolean(),
      changedSince: Type.String(),
      collectCoverage: Type.Boolean(),
      collectCoverageFrom: Type.Array(Type.String()),
      coverageDirectory: Type.String(),
      coveragePathIgnorePatterns: Type.Array(Type.String()),
      coverageProvider: RawCoverageProvider,
      coverageReporters: RawCoverageReporters,
      coverageThreshold: RawCoverageThreshold,
      dependencyExtractor: Type.String(),
      detectLeaks: Type.Boolean(),
      detectOpenHandles: Type.Boolean(),
      displayName: Type.Union([Type.String(), RawDisplayName]),
      expand: Type.Boolean(),
      extensionsToTreatAsEsm: Type.Array(Type.String()),
      fakeTimers: RawFakeTimers,
      filter: Type.String(),
      findRelatedTests: Type.Boolean(),
      forceCoverageMatch: Type.Array(Type.String()),
      forceExit: Type.Boolean(),
      json: Type.Boolean(),
      globals: Type.Record(Type.String(), Type.Unknown()),
      globalSetup: Type.Union([Type.String(), Type.Null()]),
      globalTeardown: Type.Union([Type.String(), Type.Null()]),
      haste: RawHasteConfig,
      id: Type.String(),
      injectGlobals: Type.Boolean(),
      reporters: Type.Array(
        Type.Union([
          Type.String(),
          Type.Tuple([
            Type.String(),
            Type.Record(Type.String(), Type.Unknown()),
          ]),
        ]),
      ),
      logHeapUsage: Type.Boolean(),
      lastCommit: Type.Boolean(),
      listTests: Type.Boolean(),
      maxConcurrency: Type.Integer(),
      maxWorkers: Type.Union([Type.String(), Type.Integer()]),
      moduleDirectories: Type.Array(Type.String()),
      moduleFileExtensions: Type.Array(Type.String()),
      moduleNameMapper: Type.Record(
        Type.String(),
        Type.Union([Type.String(), Type.Array(Type.String())]),
      ),
      modulePathIgnorePatterns: Type.Array(Type.String()),
      modulePaths: Type.Array(Type.String()),
      noStackTrace: Type.Boolean(),
      notify: Type.Boolean(),
      notifyMode: Type.String(),
      onlyChanged: Type.Boolean(),
      onlyFailures: Type.Boolean(),
      openHandlesTimeout: Type.Number(),
      outputFile: Type.String(),
      passWithNoTests: Type.Boolean(),
      preset: Type.Union([Type.String(), Type.Null()]),
      prettierPath: Type.Union([Type.String(), Type.Null()]),
      projects: Type.Array(
        Type.Union([
          Type.String(),
          // TODO: Make sure to type these correctly
          Type.Record(Type.String(), Type.Unknown()),
        ]),
      ),
      randomize: Type.Boolean(),
      replname: Type.Union([Type.String(), Type.Null()]),
      resetMocks: Type.Boolean(),
      resetModules: Type.Boolean(),
      resolver: Type.Union([Type.String(), Type.Null()]),
      restoreMocks: Type.Boolean(),
      rootDir: Type.String(),
      roots: Type.Array(Type.String()),
      runner: Type.String(),
      runTestsByPath: Type.Boolean(),
      runtime: Type.String(),
      sandboxInjectedGlobals: Type.Array(Type.String()),
      setupFiles: Type.Array(Type.String()),
      setupFilesAfterEnv: Type.Array(Type.String()),
      showSeed: Type.Boolean(),
      silent: Type.Boolean(),
      skipFilter: Type.Boolean(),
      skipNodeResolution: Type.Boolean(),
      slowTestThreshold: Type.Number(),
      snapshotResolver: Type.String(),
      snapshotSerializers: Type.Array(Type.String()),
      snapshotFormat: RawSnapshotFormat,
      errorOnDeprecated: Type.Boolean(),
      testEnvironment: Type.String(),
      testEnvironmentOptions: Type.Record(Type.String(), Type.Unknown()),
      testFailureExitCode: Type.Union([Type.String(), Type.Integer()]),
      testLocationInResults: Type.Boolean(),
      testMatch: Type.Array(Type.String()),
      testNamePattern: Type.String(),
      testPathIgnorePatterns: Type.Array(Type.String()),
      testRegex: Type.Union([Type.String(), Type.Array(Type.String())]),
      testResultsProcessor: Type.String(),
      testRunner: Type.String(),
      testSequencer: Type.String(),
      testTimeout: Type.Number(),
      transform: Type.Record(
        Type.String(),
        Type.Union([
          Type.String(),
          Type.Tuple([Type.String(), Type.Unknown()]),
        ]),
      ),
      transformIgnorePatterns: Type.Array(Type.String()),
      watchPathIgnorePatterns: Type.Array(Type.String()),
      unmockedModulePathPatterns: Type.Array(Type.String()),
      updateSnapshot: Type.Boolean(),
      useStderr: Type.Boolean(),
      verbose: Type.Boolean(),
      waitNextEventLoopTurnForUnhandledRejectionEvents: Type.Boolean(),
      watch: Type.Boolean(),
      watchAll: Type.Boolean(),
      watchman: Type.Boolean(),
      watchPlugins: Type.Array(
        Type.Union([
          Type.String(),
          Type.Tuple([Type.String(), Type.Unknown()]),
        ]),
      ),
      workerIdleMemoryLimit: Type.Union([Type.Number(), Type.String()]),
      workerThreads: Type.Boolean(),
    },
    {
      title: 'Jest Initial Options',
      description: "All of Jest's available configuration options",
      $schema: 'http://json-schema.org/draft-07/schema',
    },
  ),
);
