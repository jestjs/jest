/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface BrowserCommandContext {
  provider: unknown;
  sessionId: string;
  testPath: string;
}

export interface BrowserOrchestrator {
  rpc: unknown;
  sessionId: string;
}

export interface BrowserRpcEvents {
  cleanupTesters(): Promise<void>;
  createTesters(opts: {
    sessionId: string;
    testFiles: Array<string>;
  }): Promise<void>;
}

export interface BrowserTester {
  rpc: unknown;
  sessionId: string;
  testPath?: string;
}

export interface BrowserTestResult {
  failed: number;
  passed: number;
  results: Array<{
    duration: number;
    error?: string;
    name: string;
    stack?: string;
    status: 'passed' | 'failed' | 'skipped';
  }>;
  testPath: string;
  total: number;
}

export type BrowserCommand<P extends Array<unknown>, R> = (
  ctx: BrowserCommandContext,
  ...args: P
) => Promise<R>;

export interface NodeRpcHandlers {
  onConsole(type: string, args: Array<string>): void;
  reportTestResult(result: BrowserTestResult): void;
  triggerCommand(
    sessionId: string,
    cmd: string,
    path: string,
    payload: Array<unknown>,
  ): Promise<unknown>;
}
