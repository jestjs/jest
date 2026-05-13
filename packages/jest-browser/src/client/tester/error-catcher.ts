/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {BirpcReturn} from 'birpc';

type UnhandledErrorPayload = {
  message: string;
  stack?: string;
};

type NodeFunctions = {
  onUnhandledError: (error: UnhandledErrorPayload) => Promise<void>;
};

type BrowserFunctions = {
  ping: () => string;
  runTests: (testFile: string) => Promise<void>;
};

let attached = false;
let currentRpc: BirpcReturn<NodeFunctions, BrowserFunctions> | null = null;
let errorHandler: ((event: ErrorEvent) => void) | null = null;
let rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

function serializeError(
  value: unknown,
  fallbackMessage?: string,
): UnhandledErrorPayload {
  if (value instanceof Error) {
    return {
      message: (value.message || fallbackMessage) ?? 'Error',
      stack: value.stack,
    };
  }

  if (fallbackMessage != null && fallbackMessage !== '') {
    return {message: fallbackMessage};
  }

  return {message: String(value)};
}

function reportUnhandledError(payload: UnhandledErrorPayload): void {
  void currentRpc?.onUnhandledError(payload).catch(() => undefined);
}

export function setupErrorCatcher(
  rpc: BirpcReturn<NodeFunctions, BrowserFunctions>,
): void {
  currentRpc = rpc;

  if (attached) {
    return;
  }

  errorHandler = (event: ErrorEvent) => {
    reportUnhandledError(serializeError(event.error, event.message));
  };

  rejectionHandler = (event: PromiseRejectionEvent) => {
    reportUnhandledError(serializeError(event.reason));
  };

  globalThis.addEventListener('error', errorHandler);
  globalThis.addEventListener('unhandledrejection', rejectionHandler);
  attached = true;
}

export function disposeErrorCatcher(): void {
  if (errorHandler) {
    globalThis.removeEventListener('error', errorHandler);
    errorHandler = null;
  }

  if (rejectionHandler) {
    globalThis.removeEventListener('unhandledrejection', rejectionHandler);
    rejectionHandler = null;
  }

  currentRpc = null;
  attached = false;
}
