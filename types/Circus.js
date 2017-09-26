/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
export type Hook = {fn: HookFn, type: HookType};
export type TestContext = Object;
export type Exception = any; // Since in JS anything can be thrown as an error.
export type FormattedError = string; // String representation of error.

export type EventHandler = (event: Event, state: State) => void;

export type Event =
  | {|
      mode: BlockMode,
      name: 'start_describe_definition',
      blockName: BlockName,
    |}
  | {|
      name: 'finish_describe_definition',
    |}
  | {|
      name: 'add_hook',
      hookType: HookType,
      fn: HookFn,
    |}
  | {|
      name: 'add_test',
      testName: TestName,
      fn?: TestFn,
      mode?: TestMode,
    |}
  | {|
      name: 'hook_start',
      hook: Hook,
    |}
  | {|
      name: 'hook_success',
      hook: Hook,
    |}
  | {|
      name: 'hook_failure',
      error: string | Exception,
      hook: Hook,
    |}
  | {|
      name: 'test_start',
      test: TestEntry,
    |}
  | {|
      name: 'test_success',
      test: TestEntry,
    |}
  | {|
      name: 'test_failure',
      error: Exception,
      test: TestEntry,
    |}
  | {|
      name: 'test_skip',
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
    |};

export type TestStatus = 'pass' | 'fail' | 'skip';
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
  status: ?TestStatus,
|};
