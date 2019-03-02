/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AssertionError} from 'assert';
import {Config} from '@jest/types';
import expect from 'expect';
import Spec from './jasmine/Spec';
import JsApiReporter from './jasmine/JsApiReporter';
import Jasmine2Reporter from './reporter';
import Timer from './jasmine/Timer';
import Env from './jasmine/Env';
import createSpy from './jasmine/createSpy';
import ReportDispatcher from './jasmine/ReportDispatcher';
import SpyRegistry from './jasmine/spyRegistry';
import Suite from './jasmine/Suite';
import SpyStrategy from './jasmine/SpyStrategy';
import CallTracker from './jasmine/CallTracker';

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

export type Reporter = JsApiReporter | Jasmine2Reporter;

export interface Spy extends Record<string, any> {
  (...args: Array<any>): unknown;
  and: SpyStrategy;
  calls: CallTracker;
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

declare module '@jest/types' {
  namespace Global {
    interface Global {
      jasmine: Jasmine;
      [key: string]: any;
    }
  }
}

declare global {
  module NodeJS {
    interface Global {
      jasmine: Jasmine;
    }
  }
}
