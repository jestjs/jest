/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

// Because of the dynamic nature of a worker communication process, all messages
// coming from any of the other processes cannot be typed. Thus, many types
// include "any" as a flow type, which is (unfortunately) correct here.

/* eslint-disable no-unclear-flowtypes */

export const CHILD_MESSAGE_INITIALIZE: 0 = 0;
export const CHILD_MESSAGE_CALL: 1 = 1;
export const CHILD_MESSAGE_END: 2 = 2;

export const PARENT_MESSAGE_OK: 0 = 0;
export const PARENT_MESSAGE_ERROR: 1 = 1;

// Option objects.

export type ForkOptions = {
  cwd?: string,
  env?: Object,
  execPath?: string,
  execArgv?: Array<string>,
  silent?: boolean,
  stdio?: Array<any>,
  uid?: number,
  gid?: number,
};

export type FarmOptions = {
  computeWorkerKey?: (string, ...Array<any>) => ?string,
  exposedMethods?: $ReadOnlyArray<string>,
  forkOptions?: ForkOptions,
  maxRetries?: number,
  numWorkers?: number,
};

export type WorkerOptions = {|
  forkOptions: ForkOptions,
  maxRetries: number,
  workerPath: string,
|};

// Messages passed from the parent to the children.

export type ChildMessageInitialize = [
  typeof CHILD_MESSAGE_INITIALIZE, // type
  boolean, // processed
  string, // file
];

export type ChildMessageCall = [
  typeof CHILD_MESSAGE_CALL, // type
  boolean, // processed
  string, // method
  $ReadOnlyArray<any>, // args
];

export type ChildMessageEnd = [
  typeof CHILD_MESSAGE_END, // type
  boolean, // processed
];

export type ChildMessage =
  | ChildMessageInitialize
  | ChildMessageCall
  | ChildMessageEnd;

// Messages passed from the children to the parent.

export type ParentMessageOk = [
  typeof PARENT_MESSAGE_OK, // type
  any, // result
];

export type ParentMessageError = [
  typeof PARENT_MESSAGE_ERROR, // type
  string, // constructor
  string, // message
  string, // stack
  any, // extra
];

export type ParentMessage = ParentMessageOk | ParentMessageError;

// Queue types.

export type QueueCallback = (?Error, ?any) => void;

export type QueueChildMessage = {|
  request: ChildMessage,
  callback: QueueCallback,
|};
