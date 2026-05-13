/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type RpcClientModule = {
  createBrowserRpc: (wsPort: number) => {
    cleanupTesters(): Promise<void>;
    createTesters(opts: {
      sessionId: string;
      testFiles: Array<string>;
    }): Promise<void>;
  };
};

const mockSocketOn = jest.fn();
const mockSocketSend = jest.fn();
const mockSocketClose = jest.fn();
const mockSocket = {
  close: mockSocketClose,
  on: mockSocketOn,
  send: mockSocketSend,
};

const mockWebSocketCtor = jest.fn(() => mockSocket);
const mockCreateBirpc = jest.fn(() => ({
  cleanupTesters: jest.fn(async () => undefined),
  createTesters: jest.fn(async () => undefined),
}));

jest.mock('ws', () => ({
  WebSocket: (...args: Array<unknown>) =>
    (mockWebSocketCtor as (...a: Array<unknown>) => unknown)(...args),
}));

jest.mock('birpc', () => ({
  createBirpc: (...args: Array<unknown>) =>
    (mockCreateBirpc as (...a: Array<unknown>) => unknown)(...args),
}));

function loadModule(): RpcClientModule {
  return require('../../client/tester/rpc') as RpcClientModule;
}

describe('createBrowserRpc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('connects to /__jest_browser_api__ with tester query and port', () => {
    const {createBrowserRpc} = loadModule();
    createBrowserRpc(43_210);

    expect(mockWebSocketCtor).toHaveBeenCalledTimes(1);
    const wsCalls = mockWebSocketCtor.mock.calls as unknown as Array<
      Array<unknown>
    >;
    const firstArg = wsCalls[0]?.[0];
    const socketUrl = typeof firstArg === 'string' ? firstArg : '';
    expect(socketUrl).toContain('ws://localhost:43210/__jest_browser_api__');
    expect(socketUrl).toContain('type=tester');
  });

  test('creates birpc bridge bound to websocket events', () => {
    const {createBrowserRpc} = loadModule();
    createBrowserRpc(43_210);

    expect(mockCreateBirpc).toHaveBeenCalledTimes(1);
    expect(mockSocketOn).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('returns BrowserRpcEvents client with createTesters and cleanupTesters', async () => {
    const {createBrowserRpc} = loadModule();
    const rpc = createBrowserRpc(43_210);

    await expect(
      rpc.createTesters({
        sessionId: 'session-1',
        testFiles: ['/repo/a.test.ts'],
      }),
    ).resolves.toBeUndefined();
    await expect(rpc.cleanupTesters()).resolves.toBeUndefined();

    const birpcClient = mockCreateBirpc.mock.results[0]?.value as {
      createTesters: jest.Mock;
      cleanupTesters: jest.Mock;
    };

    expect(birpcClient.createTesters).toHaveBeenCalledWith({
      sessionId: 'session-1',
      testFiles: ['/repo/a.test.ts'],
    });
    expect(birpcClient.cleanupTesters).toHaveBeenCalledTimes(1);
  });

  test('closes websocket when window unload event fired', () => {
    const addEventListenerSpy = jest.spyOn(globalThis, 'addEventListener');
    const {createBrowserRpc} = loadModule();
    createBrowserRpc(43_210);

    const unloadHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'beforeunload',
    )?.[1] as EventListener | undefined;

    expect(unloadHandler).toBeDefined();
    unloadHandler?.(new Event('beforeunload'));
    expect(mockSocketClose).toHaveBeenCalledTimes(1);
  });
});
