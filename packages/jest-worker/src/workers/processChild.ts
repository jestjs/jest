/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isPromise} from 'jest-util';
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_CALL_SETUP,
  CHILD_MESSAGE_END,
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  ChildMessageCall,
  ChildMessageInitialize,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_ERROR,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_SETUP_ERROR,
  ParentMessageMemUsage,
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
const messageListener: NodeJS.MessageListener = (request: any) => {
  switch (request[0]) {
    case CHILD_MESSAGE_INITIALIZE:
      const init: ChildMessageInitialize = request;
      file = init[2];
      setupArgs = init[3];
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
process.on('message', messageListener);

function reportSuccess(result: unknown) {
  if (!process || !process.send) {
    throw new Error('Child can only be used on a forked process');
  }

  process.send([PARENT_MESSAGE_OK, result]);
}

function reportClientError(error: Error) {
  return reportError(error, PARENT_MESSAGE_CLIENT_ERROR);
}

function reportInitializeError(error: Error) {
  return reportError(error, PARENT_MESSAGE_SETUP_ERROR);
}

function reportMemoryUsage() {
  if (!process || !process.send) {
    throw new Error('Child can only be used on a forked process');
  }

  const msg: ParentMessageMemUsage = [
    PARENT_MESSAGE_MEM_USAGE,
    process.memoryUsage().heapUsed,
  ];

  process.send(msg);
}

function reportError(error: Error, type: PARENT_MESSAGE_ERROR) {
  if (!process || !process.send) {
    throw new Error('Child can only be used on a forked process');
  }

  if (error == null) {
    error = new Error('"null" or "undefined" thrown');
  }

  process.send([
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
  // Clean up open handles so the process ideally exits gracefully
  process.removeListener('message', messageListener);
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
  } catch (err: any) {
    onError(err);

    return;
  }

  if (isPromise(result)) {
    result.then(onResult, onError);
  } else {
    onResult(result);
  }
}
