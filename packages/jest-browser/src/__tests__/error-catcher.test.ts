/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  disposeErrorCatcher,
  setupErrorCatcher,
} from '../client/tester/error-catcher';

type RpcLike = {
  onUnhandledError: jest.Mock<
    Promise<void>,
    [{message: string; stack?: string}]
  >;
};

function createRpc(): RpcLike {
  return {
    onUnhandledError: jest.fn(async () => undefined),
  };
}

describe('error-catcher', () => {
  afterEach(() => {
    disposeErrorCatcher();
    jest.clearAllMocks();
  });

  test('reports window error event with message and stack', async () => {
    const rpc = createRpc();
    setupErrorCatcher(rpc as never);

    const err = new Error('boom from error event');
    const event = new ErrorEvent('error', {
      error: err,
      message: 'fallback message',
    });

    globalThis.dispatchEvent(event);
    await Promise.resolve();

    expect(rpc.onUnhandledError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom from error event',
        stack: expect.any(String),
      }),
    );
  });

  test('reports unhandled rejection with serialized reason', async () => {
    const rpc = createRpc();
    setupErrorCatcher(rpc as never);

    const error = new Error('promise failed');
    const event = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(event, 'reason', {
      configurable: true,
      value: error,
    });

    globalThis.dispatchEvent(event);
    await Promise.resolve();

    expect(rpc.onUnhandledError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'promise failed',
        stack: expect.any(String),
      }),
    );
  });

  test('uses fallback message when error object missing on ErrorEvent', async () => {
    const rpc = createRpc();
    setupErrorCatcher(rpc as never);

    const event = new ErrorEvent('error', {message: 'plain message'});
    globalThis.dispatchEvent(event);
    await Promise.resolve();

    expect(rpc.onUnhandledError).toHaveBeenCalledWith({
      message: 'plain message',
    });
  });

  test('dispose removes handlers and stops reporting', async () => {
    const addSpy = jest.spyOn(globalThis, 'addEventListener');
    const removeSpy = jest.spyOn(globalThis, 'removeEventListener');
    const rpc = createRpc();
    setupErrorCatcher(rpc as never);

    const errorHandler = addSpy.mock.calls.find(
      call => call[0] === 'error',
    )?.[1] as EventListener;
    const rejectionHandler = addSpy.mock.calls.find(
      call => call[0] === 'unhandledrejection',
    )?.[1] as EventListener;

    disposeErrorCatcher();

    expect(removeSpy).toHaveBeenCalledWith('error', errorHandler);
    expect(removeSpy).toHaveBeenCalledWith(
      'unhandledrejection',
      rejectionHandler,
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
    await Promise.resolve();
  });
});
