/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isMainThread, parentPort} from 'worker_threads';
import {isPromise} from 'jest-util';
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_CALL_SETUP,
  CHILD_MESSAGE_END,
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  type ChildMessageCall,
  type ChildMessageInitialize,
  PARENT_MESSAGE_CLIENT_ERROR,
  type PARENT_MESSAGE_ERROR,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_SETUP_ERROR,
  type ParentMessageMemUsage,
} from '../types';

type UnknownFunction = (...args: Array<unknown>) => unknown | Promise<unknown>;

let file: string | null = null;
let setupArgs: Array<unknown> = [];
let initialized = false;

/**
 * This file is a small bootstrapper for workers. It sets up the communication
 * between the worker and the parent process, interpreting parent messages and
 * sending results back.
 *
 * The file loaded will be lazily initialized the first time any of the workers
 * is called. This is done for optimal performance: if the farm is initialized,
 * but no call is made to it, child Node processes will be consuming the least
 * possible amount of memory.
 *
 * If an invalid message is detected, the child will exit (by throwing) with a
 * non-zero exit code.
 */
const messageListener = (request: any) => {
  switch (request[0]) {
    case CHILD_MESSAGE_INITIALIZE:
      const init: ChildMessageInitialize = request;
      file = init[2];
      setupArgs = init[3];
      process.env.JEST_WORKER_ID = init[4];
      break;

    case CHILD_MESSAGE_CALL:
      const call: ChildMessageCall = request;
      execMethod(call[2], call[3]);
      break;

    case CHILD_MESSAGE_END:
      end();
      break;

    case CHILD_MESSAGE_MEM_USAGE:
      reportMemoryUsage();
      break;

    case CHILD_MESSAGE_CALL_SETUP:
      if (initialized) {
        reportSuccess(void 0);
      } else {
        const main = require(file!);

        initialized = true;

        if (main.setup) {
          execFunction(
            main.setup,
            main,
            setupArgs,
            reportSuccess,
            reportInitializeError,
          );
        } else {
          reportSuccess(void 0);
        }
      }
      break;

    default:
      throw new TypeError(
        `Unexpected request from parent process: ${request[0]}`,
      );
  }
};
parentPort!.on('message', messageListener);

function reportMemoryUsage() {
  if (isMainThread) {
    throw new Error('Child can only be used on a forked process');
  }

  const msg: ParentMessageMemUsage = [
    PARENT_MESSAGE_MEM_USAGE,
    process.memoryUsage().heapUsed,
  ];

  parentPort!.postMessage(msg);
}

function reportSuccess(result: unknown) {
  if (isMainThread) {
    throw new Error('Child can only be used on a forked process');
  }

  try {
    parentPort!.postMessage([PARENT_MESSAGE_OK, result]);
  } catch (error: any) {
    // Handling it here to avoid unhandled `DataCloneError` rejection
    // which is hard to distinguish on the parent side
    // (such error doesn't have any message or stack trace)
    reportClientError(error);
  }
}

function reportClientError(error: Error) {
  return reportError(error, PARENT_MESSAGE_CLIENT_ERROR);
}

function reportInitializeError(error: Error) {
  return reportError(error, PARENT_MESSAGE_SETUP_ERROR);
}

function reportError(error: Error, type: PARENT_MESSAGE_ERROR) {
  if (isMainThread) {
    throw new Error('Child can only be used on a forked process');
  }

  if (error == null) {
    error = new Error('"null" or "undefined" thrown');
  }

  parentPort!.postMessage([
    type,
    error.constructor && error.constructor.name,
    error.message,
    error.stack,
    typeof error === 'object' ? {...error} : error,
  ]);
}

function end(): void {
  const main = require(file!);

  if (!main.teardown) {
    exitProcess();

    return;
  }

  execFunction(main.teardown, main, [], exitProcess, exitProcess);
}

function exitProcess(): void {
  // Clean up open handles so the worker ideally exits gracefully
  parentPort!.removeListener('message', messageListener);
}

function execMethod(method: string, args: Array<unknown>): void {
  const main = require(file!);

  let fn: UnknownFunction;

  if (method === 'default') {
    fn = main.__esModule ? main.default : main;
  } else {
    fn = main[method];
  }

  function execHelper() {
    execFunction(fn, main, args, reportSuccess, reportClientError);
  }

  if (initialized || !main.setup) {
    execHelper();

    return;
  }

  initialized = true;

  execFunction(main.setup, main, setupArgs, execHelper, reportInitializeError);
}

function execFunction(
  fn: UnknownFunction,
  ctx: unknown,
  args: Array<unknown>,
  onResult: (result: unknown) => void,
  onError: (error: Error) => void,
): void {
  let result: unknown;

  try {
    result = fn.apply(ctx, args);
  } catch (error: any) {
    onError(error);

    return;
  }

  if (isPromise(result)) {
    result.then(onResult, onError);
  } else {
    onResult(result);
  }
}
