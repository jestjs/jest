/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Used as type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import expect from 'expect';
import {Global} from '@jest/types';

type Process = NodeJS.Process;

export type DoneFn = Global.DoneFn;
export type BlockFn = Global.BlockFn;
export type BlockName = Global.BlockName;
export type BlockMode = void | 'skip' | 'only' | 'todo';
export type TestMode = BlockMode;
export type TestName = Global.TestName;
export type TestFn = Global.TestFn;
export type HookFn = (done?: DoneFn) => Promise<any> | null | undefined;
export type AsyncFn = TestFn | HookFn;
export type SharedHookType = 'afterAll' | 'beforeAll';
export type HookType = SharedHookType | 'afterEach' | 'beforeEach';
export type TestContext = Object;
export type Exception = any; // Since in JS anything can be thrown as an error.
export type FormattedError = string; // String representation of error.
export type Hook = {
  asyncError: Exception;
  fn: HookFn;
  type: HookType;
  parent: DescribeBlock;
  timeout: number | undefined | null;
};

export type EventHandler = (event: Event, state: State) => void;

export type Event =
  | {
      name: 'include_test_location_in_result';
    }
  | {
      asyncError: Exception;
      mode: BlockMode;
      name: 'start_describe_definition';
      blockName: BlockName;
    }
  | {
      mode: BlockMode;
      name: 'finish_describe_definition';
      blockName: BlockName;
    }
  | {
      asyncError: Exception;
      name: 'add_hook';
      hookType: HookType;
      fn: HookFn;
      timeout: number | undefined;
    }
  | {
      asyncError: Exception;
      name: 'add_test';
      testName: TestName;
      fn?: TestFn;
      mode?: TestMode;
      timeout: number | undefined;
    }
  | {
      name: 'hook_start';
      hook: Hook;
    }
  | {
      name: 'hook_success';
      describeBlock: DescribeBlock | undefined | null;
      test: TestEntry | undefined | null;
      hook: Hook;
    }
  | {
      name: 'hook_failure';
      error: string | Exception;
      describeBlock: DescribeBlock | undefined | null;
      test: TestEntry | undefined | null;
      hook: Hook;
    }
  | {
      name: 'test_fn_start';
      test: TestEntry;
    }
  | {
      name: 'test_fn_success';
      test: TestEntry;
    }
  | {
      name: 'test_fn_failure';
      error: Exception;
      test: TestEntry;
    }
  | {
      name: 'test_retry';
      test: TestEntry;
    }
  | {
      // the `test` in this case is all hooks + it/test function, not just the
      // function passed to `it/test`
      name: 'test_start';
      test: TestEntry;
    }
  | {
      name: 'test_skip';
      test: TestEntry;
    }
  | {
      name: 'test_todo';
      test: TestEntry;
    }
  | {
      // test failure is defined by presence of errors in `test.errors`,
      // `test_done` indicates that the test and all its hooks were run,
      // and nothing else will change it's state in the future. (except third
      // party extentions/plugins)
      name: 'test_done';
      test: TestEntry;
    }
  | {
      name: 'run_describe_start';
      describeBlock: DescribeBlock;
    }
  | {
      name: 'run_describe_finish';
      describeBlock: DescribeBlock;
    }
  | {
      name: 'run_start';
    }
  | {
      name: 'run_finish';
    }
  | {
      // Any unhandled error that happened outside of test/hooks (unless it is
      // an `afterAll` hook)
      name: 'error';
      error: Exception;
    }
  | {
      // first action to dispatch. Good time to initialize all settings
      name: 'setup';
      testNamePattern?: string;
      parentProcess: Process;
    }
  | {
      // Action dispatched after everything is finished and we're about to wrap
      // things up and return test results to the parent process (caller).
      name: 'teardown';
    };

export type TestStatus = 'skip' | 'done' | 'todo';
export type TestResult = {
  duration: number | null | undefined;
  errors: Array<FormattedError>;
  invocations: number;
  status: TestStatus;
  location: {column: number; line: number} | null | undefined;
  testPath: Array<TestName | BlockName>;
};

export type RunResult = {
  unhandledErrors: Array<FormattedError>;
  testResults: TestResults;
};

export type TestResults = Array<TestResult>;

export type GlobalErrorHandlers = {
  uncaughtException: Array<(exception: Exception) => void>;
  unhandledRejection: Array<
    (exception: Exception, promise: Promise<any>) => void
  >;
};

export type State = {
  currentDescribeBlock: DescribeBlock;
  currentlyRunningTest: TestEntry | undefined | null; // including when hooks are being executed
  expand?: boolean; // expand error messages
  hasFocusedTests: boolean; // that are defined using test.only
  // Store process error handlers. During the run we inject our own
  // handlers (so we could fail tests on unhandled errors) and later restore
  // the original ones.
  originalGlobalErrorHandlers?: GlobalErrorHandlers;
  parentProcess: Process | null; // process object from the outer scope
  rootDescribeBlock: DescribeBlock;
  testNamePattern: RegExp | undefined | null;
  testTimeout: number;
  unhandledErrors: Array<Exception>;
  includeTestLocationInResult: boolean;
};

export type DescribeBlock = {
  children: Array<DescribeBlock>;
  hooks: Array<Hook>;
  mode: BlockMode;
  name: BlockName;
  parent: DescribeBlock | undefined | null;
  tests: Array<TestEntry>;
};

export type TestError = Exception | Array<[Exception | undefined, Exception]>; // the error from the test, as well as a backup error for async

export type TestEntry = {
  asyncError: Exception; // Used if the test failure contains no usable stack trace
  errors: TestError;
  fn: TestFn | undefined | null;
  invocations: number;
  mode: TestMode;
  name: TestName;
  parent: DescribeBlock;
  startedAt: number | undefined | null;
  duration: number | undefined | null;
  status: TestStatus | undefined | null; // whether the test has been skipped or run already
  timeout: number | undefined | null;
};

export const STATE_SYM = (Symbol(
  'JEST_STATE_SYMBOL',
) as unknown) as 'STATE_SYM_SYMBOL';
export const RETRY_TIMES = (Symbol.for(
  'RETRY_TIMES',
) as unknown) as 'RETRY_TIMES_SYMBOL';
// To pass this value from Runtime object to state we need to use global[sym]
export const TEST_TIMEOUT_SYMBOL = (Symbol.for(
  'TEST_TIMEOUT_SYMBOL',
) as unknown) as 'TEST_TIMEOUT_SYMBOL';

declare global {
  module NodeJS {
    interface Global {
      STATE_SYM_SYMBOL: State;
      RETRY_TIMES_SYMBOL: string;
      TEST_TIMEOUT_SYMBOL: number;
      expect: typeof expect;
    }
  }
}
