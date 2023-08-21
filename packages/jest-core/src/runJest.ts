/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {performance} from 'perf_hooks';
import chalk = require('chalk');
import exit = require('exit');
import * as fs from 'graceful-fs';
import {CustomConsole} from '@jest/console';
import {
  AggregatedResult,
  Test,
  TestContext,
  TestResultsProcessor,
  formatTestResults,
  makeEmptyAggregatedTestResult,
} from '@jest/test-result';
import type TestSequencer from '@jest/test-sequencer';
import type {Config} from '@jest/types';
import type {ChangedFiles, ChangedFilesPromise} from 'jest-changed-files';
import Resolver from 'jest-resolve';
import {requireOrImportModule, tryRealpath} from 'jest-util';
import {JestHook, JestHookEmitter, TestWatcher} from 'jest-watcher';
import type FailedTestsCache from './FailedTestsCache';
import SearchSource from './SearchSource';
import {TestSchedulerContext, createTestScheduler} from './TestScheduler';
import collectNodeHandles, {HandleCollectionResult} from './collectHandles';
import getNoTestsFoundMessage from './getNoTestsFoundMessage';
import runGlobalHook from './runGlobalHook';
import type {Filter, TestRunData} from './types';

const getTestPaths = async (
  globalConfig: Config.GlobalConfig,
  source: SearchSource,
  outputStream: NodeJS.WriteStream,
  changedFiles: ChangedFiles | undefined,
  jestHooks: JestHookEmitter,
  filter?: Filter,
) => {
  const data = await source.getTestPaths(globalConfig, changedFiles, filter);

  if (!data.tests.length && globalConfig.onlyChanged && data.noSCM) {
    new CustomConsole(outputStream, outputStream).log(
      'Jest can only find uncommitted changed files in a git or hg ' +
        'repository. If you make your project a git or hg ' +
        'repository (`git init` or `hg init`), Jest will be able ' +
        'to only run tests related to files changed since the last ' +
        'commit.',
    );
  }

  const shouldTestArray = await Promise.all(
    data.tests.map(test =>
      jestHooks.shouldRunTestSuite({
        config: test.context.config,
        duration: test.duration,
        testPath: test.path,
      }),
    ),
  );

  const filteredTests = data.tests.filter((_test, i) => shouldTestArray[i]);

  return {...data, allTests: filteredTests.length, tests: filteredTests};
};

type ProcessResultOptions = Pick<
  Config.GlobalConfig,
  'json' | 'outputFile' | 'testResultsProcessor'
> & {
  collectHandles?: HandleCollectionResult;
  onComplete?: (result: AggregatedResult) => void;
  outputStream: NodeJS.WriteStream;
};

const processResults = async (
  runResults: AggregatedResult,
  options: ProcessResultOptions,
) => {
  const {
    outputFile,
    json: isJSON,
    onComplete,
    outputStream,
    testResultsProcessor,
    collectHandles,
  } = options;

  if (collectHandles) {
    runResults.openHandles = await collectHandles();
  } else {
    runResults.openHandles = [];
  }

  if (testResultsProcessor) {
    const processor = await requireOrImportModule<TestResultsProcessor>(
      testResultsProcessor,
    );
    runResults = await processor(runResults);
  }
  if (isJSON) {
    if (outputFile) {
      const cwd = tryRealpath(process.cwd());
      const filePath = path.resolve(cwd, outputFile);

      fs.writeFileSync(
        filePath,
        `${JSON.stringify(formatTestResults(runResults))}\n`,
      );
      outputStream.write(
        `Test results written to: ${path.relative(cwd, filePath)}\n`,
      );
    } else {
      process.stdout.write(
        `${JSON.stringify(formatTestResults(runResults))}\n`,
      );
    }
  }

  onComplete?.(runResults);
};

const testSchedulerContext: TestSchedulerContext = {
  firstRun: true,
  previousSuccess: true,
};

export default async function runJest({
  contexts,
  globalConfig,
  outputStream,
  testWatcher,
  jestHooks = new JestHook().getEmitter(),
  startRun,
  changedFilesPromise,
  onComplete,
  failedTestsCache,
  filter,
}: {
  globalConfig: Config.GlobalConfig;
  contexts: Array<TestContext>;
  outputStream: NodeJS.WriteStream;
  testWatcher: TestWatcher;
  jestHooks?: JestHookEmitter;
  startRun: (globalConfig: Config.GlobalConfig) => void;
  changedFilesPromise?: ChangedFilesPromise;
  onComplete: (testResults: AggregatedResult) => void;
  failedTestsCache?: FailedTestsCache;
  filter?: Filter;
}): Promise<void> {
  // Clear cache for required modules - there might be different resolutions
  // from Jest's config loading to running the tests
  Resolver.clearDefaultResolverCache();

  const Sequencer: typeof TestSequencer = await requireOrImportModule(
    globalConfig.testSequencer,
  );
  const sequencer = new Sequencer();
  let allTests: Array<Test> = [];

  if (changedFilesPromise && globalConfig.watch) {
    const {repos} = await changedFilesPromise;

    const noSCM = (
      Object.keys(repos) as Array<keyof ChangedFiles['repos']>
    ).every(scm => repos[scm].size === 0);
    if (noSCM) {
      process.stderr.write(
        `\n${chalk.bold(
          '--watch',
        )} is not supported without git/hg, please use --watchAll\n`,
      );
      exit(1);
    }
  }

  const searchSources = contexts.map(context => new SearchSource(context));

  performance.mark('jest/getTestPaths:start');
  const testRunData: TestRunData = await Promise.all(
    contexts.map(async (context, index) => {
      const searchSource = searchSources[index];
      const matches = await getTestPaths(
        globalConfig,
        searchSource,
        outputStream,
        changedFilesPromise && (await changedFilesPromise),
        jestHooks,
        filter,
      );
      allTests = allTests.concat(matches.tests);

      return {context, matches};
    }),
  );
  performance.mark('jest/getTestPaths:end');

  if (globalConfig.shard) {
    if (typeof sequencer.shard !== 'function') {
      throw new Error(
        `Shard ${globalConfig.shard.shardIndex}/${globalConfig.shard.shardCount} requested, but test sequencer ${Sequencer.name} in ${globalConfig.testSequencer} has no shard method.`,
      );
    }
    allTests = await sequencer.shard(allTests, globalConfig.shard);
  }

  allTests = await sequencer.sort(allTests);

  if (globalConfig.listTests) {
    const testsPaths = Array.from(new Set(allTests.map(test => test.path)));
    /* eslint-disable no-console */
    if (globalConfig.json) {
      console.log(JSON.stringify(testsPaths));
    } else {
      console.log(testsPaths.join('\n'));
    }
    /* eslint-enable */

    onComplete && onComplete(makeEmptyAggregatedTestResult());
    return;
  }

  if (globalConfig.onlyFailures) {
    if (failedTestsCache) {
      allTests = failedTestsCache.filterTests(allTests);
    } else {
      allTests = await sequencer.allFailedTests(allTests);
    }
  }

  const hasTests = allTests.length > 0;

  if (!hasTests) {
    const {exitWith0, message: noTestsFoundMessage} = getNoTestsFoundMessage(
      testRunData,
      globalConfig,
    );

    if (exitWith0) {
      new CustomConsole(outputStream, outputStream).log(noTestsFoundMessage);
    } else {
      new CustomConsole(outputStream, outputStream).error(noTestsFoundMessage);

      exit(1);
    }
  } else if (
    allTests.length === 1 &&
    globalConfig.silent !== true &&
    globalConfig.verbose !== false
  ) {
    const newConfig: Config.GlobalConfig = {...globalConfig, verbose: true};
    globalConfig = Object.freeze(newConfig);
  }

  let collectHandles;

  if (globalConfig.detectOpenHandles) {
    collectHandles = collectNodeHandles();
  }

  if (hasTests) {
    performance.mark('jest/globalSetup:start');
    await runGlobalHook({allTests, globalConfig, moduleName: 'globalSetup'});
    performance.mark('jest/globalSetup:end');
  }

  if (changedFilesPromise) {
    const changedFilesInfo = await changedFilesPromise;
    if (changedFilesInfo.changedFiles) {
      testSchedulerContext.changedFiles = changedFilesInfo.changedFiles;
      const sourcesRelatedToTestsInChangedFilesArray = (
        await Promise.all(
          contexts.map(async (_, index) => {
            const searchSource = searchSources[index];

            return searchSource.findRelatedSourcesFromTestsInChangedFiles(
              changedFilesInfo,
            );
          }),
        )
      ).reduce((total, paths) => total.concat(paths), []);
      testSchedulerContext.sourcesRelatedToTestsInChangedFiles = new Set(
        sourcesRelatedToTestsInChangedFilesArray,
      );
    }
  }

  const scheduler = await createTestScheduler(globalConfig, {
    startRun,
    ...testSchedulerContext,
  });

  // @ts-expect-error - second arg is unsupported (but harmless) in Node 14
  performance.mark('jest/scheduleAndRun:start', {
    detail: {numTests: allTests.length},
  });
  const results = await scheduler.scheduleTests(allTests, testWatcher);
  performance.mark('jest/scheduleAndRun:end');

  performance.mark('jest/cacheResults:start');
  sequencer.cacheResults(allTests, results);
  performance.mark('jest/cacheResults:end');

  if (hasTests) {
    performance.mark('jest/globalTeardown:start');
    await runGlobalHook({allTests, globalConfig, moduleName: 'globalTeardown'});
    performance.mark('jest/globalTeardown:end');
  }

  performance.mark('jest/processResults:start');
  await processResults(results, {
    collectHandles,
    json: globalConfig.json,
    onComplete,
    outputFile: globalConfig.outputFile,
    outputStream,
    testResultsProcessor: globalConfig.testResultsProcessor,
  });
  performance.mark('jest/processResults:end');
}
