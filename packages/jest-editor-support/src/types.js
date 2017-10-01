/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Location = {
  column: number,
  line: number,
};

import type {ChildProcess} from 'child_process';
import type ProjectWorkspace from './project_workspace';

export type Options = {
  createProcess?: (
    workspace: ProjectWorkspace,
    args: Array<string>,
  ) => ChildProcess,
};

/**
 *  Did the thing pass, fail or was it not run?
 */
export type TestReconciliationState =
  | 'Unknown' // The file has not changed, so the watcher didn't hit it
  | 'KnownFail' // Definitely failed
  | 'KnownSuccess' // Definitely passed
  | 'KnownSkip'; // Definitely skipped

/**
 * The Jest Extension's version of a status for
 * whether the file passed or not
 *
 */
export type TestFileAssertionStatus = {
  file: string,
  message: string,
  status: TestReconciliationState,
  assertions: Array<TestAssertionStatus> | null,
};

/**
 * The Jest Extension's version of a status for
 * individual assertion fails
 *
 */
export type TestAssertionStatus = {
  title: string,
  status: TestReconciliationState,
  message: string,
  shortMessage: ?string,
  terseMessage: ?string,
  line: ?number,
};
