/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AssertionError} from 'assert';
import type {Config} from '@jest/types';

import expect = require('expect');
import type {default as Spec, SpecResult} from './jasmine/Spec';
import type JsApiReporter from './jasmine/JsApiReporter';
import type Timer from './jasmine/Timer';
import type Env from './jasmine/Env';
import type createSpy from './jasmine/createSpy';
import type ReportDispatcher from './jasmine/ReportDispatcher';
import type SpyRegistry from './jasmine/spyRegistry';
import type {default as Suite, SuiteResult} from './jasmine/Suite';
import type SpyStrategy from './jasmine/SpyStrategy';
import type CallTracker from './jasmine/CallTracker';

export interface AssertionErrorWithStack extends AssertionError {
  stack: string;
}

// TODO Add expect types to @jest/types or leave it here
// Borrowed from "expect"
// -------START-------
export type SyncExpectationResult = {
  pass: boolean;
  message: () => string;
};

export type AsyncExpectationResult = Promise<SyncExpectationResult>;

export type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;

export type RawMatcherFn = (
  expected: any,
  actual: any,
  options?: any,
) => ExpectationResult;
// -------END-------

export type RunDetails = {
  totalSpecsDefined?: number;
  failedExpectations?: SuiteResult['failedExpectations'];
};

export type Reporter = {
  jasmineDone: (runDetails: RunDetails) => void;
  jasmineStarted: (runDetails: RunDetails) => void;
  specDone: (result: SpecResult) => void;
  specStarted: (spec: SpecResult) => void;
  suiteDone: (result: SuiteResult) => void;
  suiteStarted: (result: SuiteResult) => void;
};

export interface Spy extends Record<string, any> {
  (this: Record<string, unknown>, ...args: Array<any>): unknown;
  and: SpyStrategy;
  calls: CallTracker;
  restoreObjectToOriginalState?: () => void;
}

export type Jasmine = {
  _DEFAULT_TIMEOUT_INTERVAL: number;
  DEFAULT_TIMEOUT_INTERVAL: number;
  currentEnv_: ReturnType<typeof Env>['prototype'];
  getEnv: (options?: object) => ReturnType<typeof Env>['prototype'];
  createSpy: typeof createSpy;
  Env: ReturnType<typeof Env>;
  JsApiReporter: typeof JsApiReporter;
  ReportDispatcher: typeof ReportDispatcher;
  Spec: typeof Spec;
  SpyRegistry: typeof SpyRegistry;
  Suite: typeof Suite;
  Timer: typeof Timer;
  version: string;
  testPath: Config.Path;
  addMatchers: Function;
} & typeof expect &
  NodeJS.Global;

declare global {
  module NodeJS {
    interface Global {
      expect: typeof expect;
    }
  }
}
