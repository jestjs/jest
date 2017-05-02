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

import type {Context} from './Context';
import type {Environment} from 'types/Environment';
import type {GlobalConfig, Path, ProjectConfig} from './Config';
import type {ReporterOnStartOptions} from 'types/Reporters';
import type {TestResult, AggregatedResult} from 'types/TestResult';
import type Runtime from 'jest-runtime';

export type Test = {|
  context: Context,
  path: Path,
  duration: ?number,
|};

export type Reporter = {
  +onTestResult: (
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ) => void,
  +onRunStart: (
    results: AggregatedResult,
    options: ReporterOnStartOptions,
  ) => void,
  +onTestStart: (test: Test) => void,
  +onRunComplete: (
    contexts: Set<Context>,
    results: AggregatedResult,
  ) => ?Promise<void>,
  +getLastError: () => ?Error,
};

export type TestFramework = (
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  environment: Environment,
  runtime: Runtime,
  testPath: string,
) => Promise<TestResult>;
