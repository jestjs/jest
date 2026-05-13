/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {BirpcReturn} from 'birpc';
import {
  type BrowserFunctions,
  type NodeFunctions,
  createBirpcServer,
} from '../rpc';

const mockHttpServer = {
  address: jest.fn(() => ({port: 43_210})),
  close: jest.fn(),
  listen: jest.fn((_port: number, cb: () => void) => cb()),
};

const mockHttpCreateServer = jest.fn(() => mockHttpServer);

const mockWsServer = {
  close: jest.fn(),
  on: jest.fn(),
};

const mockWebSocketServerCtor = jest.fn(() => mockWsServer);
const mockCreateBirpc = jest.fn();

jest.mock('http', () => ({
  __esModule: true,
  createServer: (...args: Array<unknown>) => mockHttpCreateServer(...args),
  default: {
    createServer: (...args: Array<unknown>) => mockHttpCreateServer(...args),
  },
}));

jest.mock('ws', () => ({
  get WebSocketServer() {
    return mockWebSocketServerCtor;
  },
}));

jest.mock('birpc', () => ({
  createBirpc: (...args: Array<unknown>) => mockCreateBirpc(...args),
}));

describe('createBirpcServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates HTTP + WS server and assigns port', async () => {
    const nodeFunctions = {
      onConsole: jest.fn(),
      onUnhandledError: jest.fn(async () => {}),
      reportTestResult: jest.fn(),
    } as unknown as NodeFunctions;

    const server = await createBirpcServer(nodeFunctions);

    expect(mockHttpCreateServer).toHaveBeenCalledTimes(1);
    expect(mockWebSocketServerCtor).toHaveBeenCalledWith({
      server: mockHttpServer,
    });
    expect(server.port).toBe(43_210);
    expect(typeof server.close).toBe('function');
  });

  test('waitForClient resolves rpc from ws connection', async () => {
    const rpcClient = {
      ping: jest.fn(),
      runTests: jest.fn(),
    } as unknown as BirpcReturn<BrowserFunctions, NodeFunctions>;
    mockCreateBirpc.mockReturnValue(rpcClient);

    const nodeFunctions = {
      onConsole: jest.fn(),
      onUnhandledError: jest.fn(async () => {}),
      reportTestResult: jest.fn(),
    } as unknown as NodeFunctions;

    const server = await createBirpcServer(nodeFunctions);

    const onConnection = mockWsServer.on.mock.calls[0]?.[1] as (socket: {
      on: (event: string, fn: (...args: Array<unknown>) => void) => void;
      send: (data: unknown) => void;
    }) => void;

    const socket = {
      on: jest.fn(),
      send: jest.fn(),
    };

    onConnection(socket);
    await expect(server.waitForClient()).resolves.toBe(rpcClient);
  });

  test('close closes ws and http servers', async () => {
    const nodeFunctions = {
      onConsole: jest.fn(),
      onUnhandledError: jest.fn(async () => {}),
      reportTestResult: jest.fn(),
    } as unknown as NodeFunctions;

    const server = await createBirpcServer(nodeFunctions);
    await server.close();

    expect(mockWsServer.close).toHaveBeenCalledTimes(1);
    expect(mockHttpServer.close).toHaveBeenCalledTimes(1);
  });
});
