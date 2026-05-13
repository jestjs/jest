/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import http from 'node:http';
import {type BirpcReturn, createBirpc} from 'birpc';
import {type WebSocket, WebSocketServer} from 'ws';

export interface TestResult {
  testPath: string;
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    stack?: string;
  }>;
}

/** Functions callable from browser → Node */
export interface NodeFunctions {
  onConsole: (type: string, args: Array<string>) => void;
  onUnhandledError: (error: {message: string; stack?: string}) => Promise<void>;
  pageClick: (
    selector: string,
    options?: Record<string, unknown>,
  ) => Promise<void>;
  pageEvaluate: (script: string) => Promise<unknown>;
  pageFill: (selector: string, value: string) => Promise<void>;
  pageGetText: (selector: string) => Promise<string>;
  pageScreenshot: (options?: Record<string, unknown>) => Promise<string>;
  pageType: (selector: string, text: string) => Promise<void>;
  pageWaitForSelector: (
    selector: string,
    options?: Record<string, unknown>,
  ) => Promise<void>;
  removeFile: (filePath: string) => Promise<void>;
  reportTestResult: (result: TestResult) => void;
  triggerCommand: (
    command: string,
    payload: Array<unknown>,
  ) => Promise<unknown>;
  screenshotMatch: (options: {
    mask?: Array<string>;
    name: string;
    screenshotOptions?: Record<string, unknown>;
    selector?: string;
    target: 'element' | 'page';
  }) => Promise<{
    actualPath?: string;
    diffPath?: string;
    diffPixels?: number;
    message: string;
    pass: boolean;
    referencePath: string;
  }>;
  screenshotSave: (options: {
    path: string;
    selector?: string;
    screenshotOptions?: Record<string, unknown>;
  }) => Promise<void>;
}

/** Functions callable from Node → browser */
export interface BrowserFunctions {
  runTests: (testFile: string) => Promise<void>;
  ping: () => string;
}

export interface BirpcServer {
  server: http.Server;
  port: number;
  waitForClient(
    timeout?: number,
  ): Promise<BirpcReturn<BrowserFunctions, NodeFunctions>>;
  close(): Promise<void>;
}

export async function createBirpcServer(
  nodeFunctions: NodeFunctions,
): Promise<BirpcServer> {
  const httpServer = http.createServer();
  const wss = new WebSocketServer({server: httpServer});

  let resolveClient:
    | ((rpc: BirpcReturn<BrowserFunctions, NodeFunctions>) => void)
    | null = null;
  const clientPromise = new Promise<
    BirpcReturn<BrowserFunctions, NodeFunctions>
  >(resolve => {
    resolveClient = resolve;
  });

  wss.on('connection', (ws: WebSocket) => {
    const rpc = createBirpc<BrowserFunctions, NodeFunctions>(nodeFunctions, {
      deserialize: v => JSON.parse(v as string),
      on: fn => ws.on('message', fn),
      post: data => ws.send(data),
      serialize: v => JSON.stringify(v),
    });
    resolveClient?.(rpc);
  });

  await new Promise<void>(resolve => {
    httpServer.listen(0, () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    close: async () => {
      wss.close();
      httpServer.close();
    },
    port,
    server: httpServer,
    waitForClient: async (timeout?: number) => {
      if (timeout === undefined) {
        return clientPromise;
      }

      return new Promise<BirpcReturn<BrowserFunctions, NodeFunctions>>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(
              new Error(`Browser client did not connect within ${timeout}ms`),
            );
          }, timeout);

          clientPromise.then(
            rpc => {
              clearTimeout(timeoutId);
              resolve(rpc);
            },
            error => {
              clearTimeout(timeoutId);
              reject(error instanceof Error ? error : new Error(String(error)));
            },
          );
        },
      );
    },
  };
}
