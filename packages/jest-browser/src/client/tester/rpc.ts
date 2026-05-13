/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-empty-function */

import {createBirpc} from 'birpc';
import {WebSocket} from 'ws';
import type {BrowserRpcEvents, NodeRpcHandlers} from '../../node/types';

const noopNodeHandlers: NodeRpcHandlers = {
  onConsole: () => {},
  reportTestResult: () => {},
  triggerCommand: async () => undefined,
};

export function createBrowserRpc(wsPort: number): BrowserRpcEvents {
  const createWebSocket = WebSocket as unknown as (url: string) => {
    close: () => void;
    on: (event: 'message', cb: (data: unknown) => void) => void;
    send: (data: unknown) => void;
  };

  const ws = createWebSocket(
    `ws://localhost:${wsPort}/__jest_browser_api__?type=tester`,
  );

  ws.on('message', () => {});

  const rpc = createBirpc<BrowserRpcEvents, NodeRpcHandlers>(noopNodeHandlers, {
    deserialize: data => JSON.parse(data as string),
    on: fn => ws.on('message', fn),
    post: data => ws.send(data),
    serialize: data => JSON.stringify(data),
  });

  globalThis.addEventListener('beforeunload', () => {
    ws.close();
  });

  return rpc;
}
