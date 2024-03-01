/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as Process from 'process';
import type {Circus} from '@jest/types';
import {dispatchSync} from './state';

const uncaughtExceptionListener: NodeJS.UncaughtExceptionListener = (
  error: unknown,
) => {
  dispatchSync({error, name: 'error'});
};

const unhandledRejectionListener: NodeJS.UnhandledRejectionListener = (
  error: unknown,
  promise: Promise<unknown>,
) => {
  dispatchSync({error, name: 'error', promise});
};

const rejectionHandledListener: NodeJS.RejectionHandledListener = (
  promise: Promise<unknown>,
) => {
  dispatchSync({name: 'error_handled', promise});
};

export const injectGlobalErrorHandlers = (
  parentProcess: typeof Process,
): Circus.GlobalErrorHandlers => {
  const uncaughtException = [...process.listeners('uncaughtException')];
  const unhandledRejection = [...process.listeners('unhandledRejection')];
  const rejectionHandled = [...process.listeners('rejectionHandled')];
  parentProcess.removeAllListeners('uncaughtException');
  parentProcess.removeAllListeners('unhandledRejection');
  parentProcess.removeAllListeners('rejectionHandled');
  parentProcess.on('uncaughtException', uncaughtExceptionListener);
  parentProcess.on('unhandledRejection', unhandledRejectionListener);
  parentProcess.on('rejectionHandled', rejectionHandledListener);
  return {rejectionHandled, uncaughtException, unhandledRejection};
};

export const restoreGlobalErrorHandlers = (
  parentProcess: typeof Process,
  originalErrorHandlers: Circus.GlobalErrorHandlers,
): void => {
  parentProcess.removeListener('uncaughtException', uncaughtExceptionListener);
  parentProcess.removeListener(
    'unhandledRejection',
    unhandledRejectionListener,
  );
  parentProcess.removeListener('rejectionHandled', rejectionHandledListener);

  for (const listener of originalErrorHandlers.uncaughtException) {
    parentProcess.on('uncaughtException', listener);
  }
  for (const listener of originalErrorHandlers.unhandledRejection) {
    parentProcess.on('unhandledRejection', listener);
  }
  for (const listener of originalErrorHandlers.rejectionHandled) {
    parentProcess.on('rejectionHandled', listener);
  }
};
