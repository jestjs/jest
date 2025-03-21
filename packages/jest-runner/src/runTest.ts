/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {runInContext} from 'node:vm';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import sourcemapSupport = require('source-map-support');
import {
  BufferedConsole,
  CustomConsole,
  type LogMessage,
  type LogType,
  NullConsole,
  getConsoleOutput,
} from '@jest/console';
import type {JestEnvironment} from '@jest/environment';
import type {TestFileEvent, TestResult} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import * as docblock from 'jest-docblock';
import LeakDetector from 'jest-leak-detector';
import {formatExecError} from 'jest-message-util';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import Resolver, {resolveTestEnvironment} from 'jest-resolve';
import type RuntimeClass from 'jest-runtime';
import {ErrorWithStack, interopRequireDefault, setGlobal} from 'jest-util';
import type {TestFramework, TestRunnerContext} from './types';

type RunTestInternalResult = {
  leakDetector: LeakDetector | null;
  result: TestResult;
};

function freezeConsole(
  testConsole: BufferedConsole | CustomConsole | NullConsole,
  config: Config.ProjectConfig,
) {
  // @ts-expect-error: `_log` is `private` - we should figure out some proper API here
  testConsole._log = function fakeConsolePush(
    _type: LogType,
    message: LogMessage,
  ) {
    const error = new ErrorWithStack(
      `${chalk.red(
        `${chalk.bold(
          'Cannot log after tests are done.',
        )} Did you forget to wait for something async in your test?`,
      )}\nAttempted to log "${message}".`,
      fakeConsolePush,
    );

    const formattedError = formatExecError(
      error,
      config,
      {noStackTrace: false},
      undefined,
      true,
    );

    process.stderr.write(`\n${formattedError}\n`);
    process.exitCode = 1;
  };
}

// Keeping the core of "runTest" as a separate function (as "runTestInternal")
// is key to be able to detect memory leaks. Since all variables are local to
// the function, when "runTestInternal" finishes its execution, they can all be
// freed, UNLESS something else is leaking them (and that's why we can detect
// the leak!).
//
// If we had all the code in a single function, we should manually nullify all
// references to verify if there is a leak, which is not maintainable and error
// prone. That's why "runTestInternal" CANNOT be inlined inside "runTest".
async function runTestInternal(
  path: string,
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
  resolver: Resolver,
  context: TestRunnerContext,
  sendMessageToJest?: TestFileEvent,
): Promise<RunTestInternalResult> {
  const testSource = fs.readFileSync(path, 'utf8');
  const docblockPragmas = docblock.parse(docblock.extract(testSource));
  const customEnvironment = docblockPragmas['jest-environment'];

  const loadTestEnvironmentStart = Date.now();
  let testEnvironment = projectConfig.testEnvironment;

  if (customEnvironment) {
    if (Array.isArray(customEnvironment)) {
      throw new TypeError(
        `You can only define a single test environment through docblocks, got "${customEnvironment.join(
          ', ',
        )}"`,
      );
    }
    testEnvironment = resolveTestEnvironment({
      ...projectConfig,
      // we wanna avoid webpack trying to be clever
      requireResolveFunction: module => require.resolve(module),
      testEnvironment: customEnvironment,
    });
  }

  const cacheFS = new Map([[path, testSource]]);
  const transformer = await createScriptTransformer(projectConfig, cacheFS);

  const TestEnvironment: typeof JestEnvironment =
    await transformer.requireAndTranspileModule(testEnvironment);
  const testFramework: TestFramework =
    await transformer.requireAndTranspileModule(
      process.env.JEST_JASMINE === '1'
        ? require.resolve('jest-jasmine2')
        : projectConfig.testRunner,
    );
  const Runtime: typeof RuntimeClass = interopRequireDefault(
    projectConfig.runtime
      ? require(projectConfig.runtime)
      : require('jest-runtime'),
  ).default;

  const consoleOut = globalConfig.useStderr ? process.stderr : process.stdout;
  const consoleFormatter = (type: LogType, message: LogMessage) =>
    getConsoleOutput(
      // 4 = the console call is buried 4 stack frames deep
      BufferedConsole.write([], type, message, 4),
      projectConfig,
      globalConfig,
    );

  let testConsole;

  if (globalConfig.silent) {
    testConsole = new NullConsole(consoleOut, consoleOut, consoleFormatter);
  } else if (globalConfig.verbose) {
    testConsole = new CustomConsole(consoleOut, consoleOut, consoleFormatter);
  } else {
    testConsole = new BufferedConsole();
  }

  let extraTestEnvironmentOptions;

  const docblockEnvironmentOptions =
    docblockPragmas['jest-environment-options'];

  if (typeof docblockEnvironmentOptions === 'string') {
    extraTestEnvironmentOptions = JSON.parse(docblockEnvironmentOptions);
  }

  const environment = new TestEnvironment(
    {
      globalConfig,
      projectConfig: extraTestEnvironmentOptions
        ? {
            ...projectConfig,
            testEnvironmentOptions: {
              ...projectConfig.testEnvironmentOptions,
              ...extraTestEnvironmentOptions,
            },
          }
        : projectConfig,
    },
    {
      console: testConsole,
      docblockPragmas,
      testPath: path,
    },
  );
  const loadTestEnvironmentEnd = Date.now();

  if (typeof environment.getVmContext !== 'function') {
    console.error(
      `Test environment found at "${testEnvironment}" does not export a "getVmContext" method, which is mandatory from Jest 27. This method is a replacement for "runScript".`,
    );
    process.exit(1);
  }

  const leakDetector = projectConfig.detectLeaks
    ? new LeakDetector(environment)
    : null;

  setGlobal(environment.global, 'console', testConsole);

  const runtime = new Runtime(
    projectConfig,
    environment,
    resolver,
    transformer,
    cacheFS,
    {
      changedFiles: context.changedFiles,
      collectCoverage: globalConfig.collectCoverage,
      collectCoverageFrom: globalConfig.collectCoverageFrom,
      coverageProvider: globalConfig.coverageProvider,
      sourcesRelatedToTestsInChangedFiles:
        context.sourcesRelatedToTestsInChangedFiles,
    },
    path,
    globalConfig,
  );

  let isTornDown = false;

  const tearDownEnv = async () => {
    if (!isTornDown) {
      runtime.teardown();

      // source-map-support keeps memory leftovers in `Error.prepareStackTrace`
      runInContext(
        "Error.prepareStackTrace = () => '';",
        environment.getVmContext()!,
      );
      sourcemapSupport.resetRetrieveHandlers();

      await environment.teardown();
      isTornDown = true;
    }
  };

  const start = Date.now();

  const setupFilesStart = Date.now();
  for (const path of projectConfig.setupFiles) {
    const esm = runtime.unstable_shouldLoadAsEsm(path);

    if (esm) {
      await runtime.unstable_importModule(path);
    } else {
      const setupFile = runtime.requireModule(path);
      if (typeof setupFile === 'function') {
        await setupFile();
      }
    }
  }
  const setupFilesEnd = Date.now();

  const sourcemapOptions: sourcemapSupport.Options = {
    environment: 'node',
    handleUncaughtExceptions: false,
    retrieveSourceMap: source => {
      const sourceMapSource = runtime.getSourceMaps()?.get(source);

      if (sourceMapSource) {
        try {
          return {
            map: JSON.parse(fs.readFileSync(sourceMapSource, 'utf8')),
            url: source,
          };
        } catch {}
      }
      return null;
    },
  };

  // For tests
  runtime
    .requireInternalModule<
      typeof import('source-map-support')
    >(require.resolve('source-map-support'))
    .install(sourcemapOptions);

  // For runtime errors
  sourcemapSupport.install(sourcemapOptions);

  if (
    environment.global &&
    environment.global.process &&
    environment.global.process.exit
  ) {
    const realExit = environment.global.process.exit;

    environment.global.process.exit = function exit(...args: Array<any>) {
      const error = new ErrorWithStack(
        `process.exit called with "${args.join(', ')}"`,
        exit,
      );

      const formattedError = formatExecError(
        error,
        projectConfig,
        {noStackTrace: false},
        undefined,
        true,
      );

      process.stderr.write(formattedError);

      return realExit(...args);
    };
  }

  // if we don't have `getVmContext` on the env skip coverage
  const collectV8Coverage =
    globalConfig.collectCoverage &&
    globalConfig.coverageProvider === 'v8' &&
    typeof environment.getVmContext === 'function';

  // Node's error-message stack size is limited at 10, but it's pretty useful
  // to see more than that when a test fails.
  Error.stackTraceLimit = 100;
  try {
    await environment.setup();

    let result: TestResult;

    try {
      if (collectV8Coverage) {
        await runtime.collectV8Coverage();
      }
      result = await testFramework(
        globalConfig,
        projectConfig,
        environment,
        runtime,
        path,
        sendMessageToJest,
      );
    } catch (error: any) {
      // Access all stacks before uninstalling sourcemaps
      let e = error;
      while (typeof e === 'object' && e !== null && 'stack' in e) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        e.stack;
        e = e?.cause;
      }

      throw error;
    } finally {
      if (collectV8Coverage) {
        await runtime.stopCollectingV8Coverage();
      }
    }

    freezeConsole(testConsole, projectConfig);

    const testCount =
      result.numPassingTests +
      result.numFailingTests +
      result.numPendingTests +
      result.numTodoTests;

    const end = Date.now();
    const testRuntime = end - start;
    result.perfStats = {
      ...result.perfStats,
      end,
      loadTestEnvironmentEnd,
      loadTestEnvironmentStart,
      runtime: testRuntime,
      setupFilesEnd,
      setupFilesStart,
      slow: testRuntime / 1000 > projectConfig.slowTestThreshold,
      start,
    };
    result.testFilePath = path;
    result.console = testConsole.getBuffer();
    result.skipped = testCount === result.numPendingTests;
    result.displayName = projectConfig.displayName;

    const coverage = runtime.getAllCoverageInfoCopy();
    if (coverage) {
      const coverageKeys = Object.keys(coverage);
      if (coverageKeys.length > 0) {
        result.coverage = coverage;
      }
    }

    if (collectV8Coverage) {
      const v8Coverage = runtime.getAllV8CoverageInfoCopy();
      if (v8Coverage && v8Coverage.length > 0) {
        result.v8Coverage = v8Coverage;
      }
    }

    if (globalConfig.logHeapUsage) {
      globalThis.gc?.();

      result.memoryUsage = process.memoryUsage().heapUsed;
    }

    await tearDownEnv();

    // Delay the resolution to allow log messages to be output.
    return await new Promise(resolve => {
      setImmediate(() => resolve({leakDetector, result}));
    });
  } finally {
    await tearDownEnv();
  }
}

export default async function runTest(
  path: string,
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  resolver: Resolver,
  context: TestRunnerContext,
  sendMessageToJest?: TestFileEvent,
): Promise<TestResult> {
  const {leakDetector, result} = await runTestInternal(
    path,
    globalConfig,
    config,
    resolver,
    context,
    sendMessageToJest,
  );

  if (leakDetector) {
    // We wanna allow a tiny but time to pass to allow last-minute cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Resolve leak detector, outside the "runTestInternal" closure.
    result.leaks = await leakDetector.isLeaking();
  } else {
    result.leaks = false;
  }

  return result;
}
