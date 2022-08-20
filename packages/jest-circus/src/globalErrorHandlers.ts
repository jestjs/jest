/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import {dispatchSync} from './state';

const uncaught =
  (
    type: string,
  ): NodeJS.UncaughtExceptionListener & NodeJS.UnhandledRejectionListener =>
  (error: unknown) => {
    error.message = `[${type}] ${error?.message}`;
    dispatchSync({error, name: 'error'});
  };

const exception = uncaught('uncaughtException');
const rejection = uncaught('unhandledRejection');

export const injectGlobalErrorHandlers = (
  parentProcess: NodeJS.Process,
): Circus.GlobalErrorHandlers => {
  const uncaughtException = process.listeners('uncaughtException').slice();
  const unhandledRejection = process.listeners('unhandledRejection').slice();
  parentProcess.removeAllListeners('uncaughtException');
  parentProcess.removeAllListeners('unhandledRejection');
  parentProcess.on('uncaughtException', exception);
  parentProcess.on('unhandledRejection', rejection);
  return {uncaughtException, unhandledRejection};
};

export const restoreGlobalErrorHandlers = (
  parentProcess: NodeJS.Process,
  originalErrorHandlers: Circus.GlobalErrorHandlers,
): void => {
  parentProcess.removeListener('uncaughtException', exception);
  parentProcess.removeListener('unhandledRejection', rejection);

  for (const listener of originalErrorHandlers.uncaughtException) {
    parentProcess.on('uncaughtException', listener);
  }
  for (const listener of originalErrorHandlers.unhandledRejection) {
    parentProcess.on('unhandledRejection', listener);
  }
};
