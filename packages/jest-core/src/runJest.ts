/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import {CustomConsole} from '@jest/console';
import {interopRequireDefault, tryRealpath} from 'jest-util';
import exit = require('exit');
import * as fs from 'graceful-fs';
import {JestHook, JestHookEmitter} from 'jest-watcher';
import type {Context} from 'jest-runtime';
import type {Test} from 'jest-runner';
import type {Config} from '@jest/types';
import {
  AggregatedResult,
  formatTestResults,
  makeEmptyAggregatedTestResult,
} from '@jest/test-result';
import type TestSequencer from '@jest/test-sequencer';
import type {ChangedFiles, ChangedFilesPromise} from 'jest-changed-files';
import getNoTestsFoundMessage from './getNoTestsFoundMessage';
import runGlobalHook from './runGlobalHook';
import SearchSource from './SearchSource';
import TestScheduler, {TestSchedulerContext} from './TestScheduler';
import type FailedTestsCache from './FailedTestsCache';
import collectNodeHandles from './collectHandles';
import type TestWatcher from './TestWatcher';
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
  collectHandles?: () => Array<Error>;
  onComplete?: (result: AggregatedResult) => void;
  outputStream: NodeJS.WriteStream;
};

const processResults = (
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
    runResults.openHandles = collectHandles();
  } else {
    runResults.openHandles = [];
  }

  if (testResultsProcessor) {
    runResults = require(testResultsProcessor)(runResults);
  }
  if (isJSON) {
    if (outputFile) {
      const cwd = tryRealpath(process.cwd());
      const filePath = path.resolve(cwd, outputFile);

      fs.writeFileSync(filePath, JSON.stringify(formatTestResults(runResults)));
      outputStream.write(
        `Test results written to: ${path.relative(cwd, filePath)}\n`,
      );
    } else {
      process.stdout.write(JSON.stringify(formatTestResults(runResults)));
    }
  }

  return onComplete && onComplete(runResults);
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
  contexts: Array<Context>;
  outputStream: NodeJS.WriteStream;
  testWatcher: TestWatcher;
  jestHooks?: JestHookEmitter;
  startRun: (globalConfig: Config.GlobalConfig) => void;
  changedFilesPromise?: ChangedFilesPromise;
  onComplete: (testResults: AggregatedResult) => void;
  failedTestsCache?: FailedTestsCache;
  filter?: Filter;
}): Promise<void> {
  const Sequencer: typeof TestSequencer = interopRequireDefault(
    require(globalConfig.testSequencer),
  ).default;
  const sequencer = new Sequencer();
  let allTests: Array<Test> = [];

  if (changedFilesPromise && globalConfig.watch) {
    const {repos} = await changedFilesPromise;

    const noSCM = (Object.keys(repos) as Array<
      keyof ChangedFiles['repos']
    >).every(scm => repos[scm].size === 0);
    if (noSCM) {
      process.stderr.write(
        '\n' +
          chalk.bold('--watch') +
          ' is not supported without git/hg, please use --watchAll ' +
          '\n',
      );
      exit(1);
    }
  }

  const searchSources = contexts.map(context => new SearchSource(context));

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

  allTests = await sequencer.sort(allTests);

  if (globalConfig.listTests) {
    const testsPaths = Array.from(new Set(allTests.map(test => test.path)));
    if (globalConfig.json) {
      console.log(JSON.stringify(testsPaths));
    } else {
      console.log(testsPaths.join('\n'));
    }

    onComplete && onComplete(makeEmptyAggregatedTestResult());
    return;
  }

  if (globalConfig.onlyFailures && failedTestsCache) {
    allTests = failedTestsCache.filterTests(allTests);
    globalConfig = failedTestsCache.updateConfig(globalConfig);
  }

  const hasTests = allTests.length > 0;

  if (!hasTests) {
    const noTestsFoundMessage = getNoTestsFoundMessage(
      testRunData,
      globalConfig,
    );

    if (
      globalConfig.passWithNoTests ||
      globalConfig.findRelatedTests ||
      globalConfig.lastCommit ||
      globalConfig.onlyChanged
    ) {
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
    await runGlobalHook({allTests, globalConfig, moduleName: 'globalSetup'});
  }

  if (changedFilesPromise) {
    const changedFilesInfo = await changedFilesPromise;
    if (changedFilesInfo.changedFiles) {
      testSchedulerContext.changedFiles = changedFilesInfo.changedFiles;
      const sourcesRelatedToTestsInChangedFilesArray = contexts
        .map((_, index) => {
          const searchSource = searchSources[index];
          const relatedSourceFromTestsInChangedFiles = searchSource.findRelatedSourcesFromTestsInChangedFiles(
            changedFilesInfo,
          );
          return relatedSourceFromTestsInChangedFiles;
        })
        .reduce((total, paths) => total.concat(paths), []);
      testSchedulerContext.sourcesRelatedToTestsInChangedFiles = new Set(
        sourcesRelatedToTestsInChangedFilesArray,
      );
    }
  }

  const results = await new TestScheduler(
    globalConfig,
    {startRun},
    testSchedulerContext,
  ).scheduleTests(allTests, testWatcher);

  sequencer.cacheResults(allTests, results);

  if (hasTests) {
    await runGlobalHook({allTests, globalConfig, moduleName: 'globalTeardown'});
  }

  await processResults(results, {
    collectHandles,
    json: globalConfig.json,
    onComplete,
    outputFile: globalConfig.outputFile,
    outputStream,
    testResultsProcessor: globalConfig.testResultsProcessor,
  });
}
