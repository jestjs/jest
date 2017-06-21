/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

export type DoneFn = (reason?: string | Error) => void;
export type BlockFn = () => void;
export type BlockName = string;
export type BlockMode = void | 'skip' | 'only';
export type TestMode = BlockMode;
export type TestName = string;
export type TestFn = (done?: DoneFn) => ?Promise<any>;
export type HookFn = (done?: DoneFn) => ?Promise<any>;
export type AsyncFn = TestFn | HookFn;
export type SharedHookType = 'afterAll' | 'beforeAll';
export type HookType = SharedHookType | 'afterEach' | 'beforeEach';
export type TestContext = Object;
export type Exception = any; // Since in JS anything can be thrown as an error.
export type FormattedError = string; // String representation of error.
export type Hook = {
  fn: HookFn,
  type: HookType,
  parent: DescribeBlock,
  timeout: ?number,
};

export type EventHandler = (event: Event, state: State) => void;

export type Event =
  | {|
      mode: BlockMode,
      name: 'start_describe_definition',
      blockName: BlockName,
    |}
  | {|
      mode: BlockMode,
      name: 'finish_describe_definition',
      blockName: BlockName,
    |}
  | {|
      name: 'add_hook',
      hookType: HookType,
      fn: HookFn,
      timeout: ?number,
    |}
  | {|
      name: 'add_test',
      testName: TestName,
      fn?: TestFn,
      mode?: TestMode,
      timeout: ?number,
    |}
  | {|
      name: 'hook_start',
      hook: Hook,
    |}
  | {|
      name: 'hook_success',
      describeBlock: ?DescribeBlock,
      test: ?TestEntry,
      hook: Hook,
    |}
  | {|
      name: 'hook_failure',
      error: string | Exception,
      describeBlock: ?DescribeBlock,
      test: ?TestEntry,
      hook: Hook,
    |}
  | {|
      name: 'test_fn_start',
      test: TestEntry,
    |}
  | {|
      name: 'test_fn_success',
      test: TestEntry,
    |}
  | {|
      name: 'test_fn_failure',
      error: Exception,
      test: TestEntry,
    |}
  | {|
      // the `test` in this case is all hooks + it/test function, not just the
      // function passed to `it/test`
      name: 'test_start',
      test: TestEntry,
    |}
  | {|
      name: 'test_skip',
      test: TestEntry,
    |}
  | {|
      // test failure is defined by presence of errors in `test.errors`,
      // `test_done` indicates that the test and all its hooks were run,
      // and nothing else will change it's state in the future. (except third
      // party extentions/plugins)
      name: 'test_done',
      test: TestEntry,
    |}
  | {|
      name: 'run_describe_start',
      describeBlock: DescribeBlock,
    |}
  | {|
      name: 'run_describe_finish',
      describeBlock: DescribeBlock,
    |}
  | {|
      name: 'run_start',
    |}
  | {|
      name: 'run_finish',
    |}
  | {|
      // Any unhandled error that happened outside of test/hooks (unless it is
      // an `afterAll` hook)
      name: 'error',
      error: Exception,
    |};

export type TestStatus = 'skip' | 'done';
export type TestResult = {|
  duration: ?number,
  errors: Array<FormattedError>,
  status: TestStatus,
  testPath: Array<BlockName | TestName>,
|};

export type TestResults = Array<TestResult>;

export type State = {|
  currentDescribeBlock: DescribeBlock,
  hasFocusedTests: boolean, // that are defined using test.only
  rootDescribeBlock: DescribeBlock,
  testTimeout: number,
  expand?: boolean, // expand error messages
  unhandledErrors: Array<Exception>,
|};

export type DescribeBlock = {|
  children: Array<DescribeBlock>,
  hooks: Array<Hook>,
  mode: BlockMode,
  name: BlockName,
  parent: ?DescribeBlock,
  tests: Array<TestEntry>,
|};

export type TestEntry = {|
  errors: Array<Exception>,
  fn: ?TestFn,
  mode: TestMode,
  name: TestName,
  parent: DescribeBlock,
  startedAt: ?number,
  duration: ?number,
  status: ?TestStatus, // whether the test has been skipped or run already
  timeout: ?number,
|};
