/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Browser-side entry for `@jest/globals` virtual module.
 * This file is imported (not inlined) by jestGlobalsPlugin.
 * It wires together: test runner, expect, mock, timers, and birpc RPC.
 *
 * The wsPort and server info are injected via `__JEST_BROWSER_CONFIG__` global
 * set by the plugin before this module loads.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-empty-function, sort-keys */

import {type BirpcReturn, createBirpc} from 'birpc';
// This virtual module is resolved by jestGlobalsPlugin and sets __JEST_BROWSER_CONFIG__
import '@jest/browser-config';
import {disposeErrorCatcher, setupErrorCatcher} from './error-catcher';
import {createExpect} from './expect';
import {createMockSystem} from './mock';
import {createTestRunner} from './runner';
import {createTimerSystem} from './timers';

declare global {
  var __JEST_BROWSER_CONFIG__: {
    browserName: string;
    platform: string;
    trackUnhandledErrors?: boolean;
    wsPort: number;
  };
}

// --- RPC setup ---

interface NodeFunctions {
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
  reportTestResult: (result: unknown) => void;
  screenshotMatch: (options: unknown) => Promise<unknown>;
  screenshotSave: (options: unknown) => Promise<void>;
  triggerCommand: (
    command: string,
    payload: Array<unknown>,
  ) => Promise<unknown>;
}

interface BrowserFunctions {
  runTests: (testFile: string) => Promise<void>;
  ping: () => string;
}

let rpc: BirpcReturn<NodeFunctions, BrowserFunctions> | null = null;
let rpcReady: Promise<BirpcReturn<NodeFunctions, BrowserFunctions>> | null =
  null;

function initRpc(): Promise<BirpcReturn<NodeFunctions, BrowserFunctions>> {
  if (rpcReady) return rpcReady;

  const config = globalThis.__JEST_BROWSER_CONFIG__;
  if (config == null) {
    throw new Error('[jest-browser] __JEST_BROWSER_CONFIG__ not set');
  }

  rpcReady = new Promise(resolve => {
    const ws = new WebSocket(`ws://localhost:${config.wsPort}`);

    const browserFunctions: BrowserFunctions = {
      async runTests(testFile: string) {
        await runAllTests(testFile);
      },
      ping() {
        return 'pong';
      },
    };

    ws.addEventListener('open', () => {
      rpc = createBirpc<NodeFunctions, BrowserFunctions>(browserFunctions, {
        deserialize: v => JSON.parse(v as string),
        on: fn => {
          ws.addEventListener('message', e => fn(e.data));
        },
        post: data => ws.send(data as string),
        serialize: v => JSON.stringify(v),
        timeout: -1,
      });

      if (config.trackUnhandledErrors === false) {
        disposeErrorCatcher();
      } else {
        setupErrorCatcher(rpc);
      }

      resolve(rpc);
    });
  });

  return rpcReady;
}

// --- Test runner ---

const runner = createTestRunner();
const expectFn = createExpect();
const mockSystem = createMockSystem();
const timerSystem = createTimerSystem();

// --- jest object ---

const jest = {
  fn: mockSystem.fn,
  spyOn: mockSystem.spyOn,
  mocked: mockSystem.mocked,
  isMockFunction: mockSystem.isMockFunction,
  clearAllMocks: mockSystem.clearAllMocks,
  resetAllMocks: mockSystem.resetAllMocks,
  restoreAllMocks: mockSystem.restoreAllMocks,
  useFakeTimers: () => {
    timerSystem.useFakeTimers();
    return jest;
  },
  useRealTimers: () => {
    timerSystem.useRealTimers();
    return jest;
  },
  runAllTimers: () => {
    timerSystem.runAllTimers();
    return jest;
  },
  runOnlyPendingTimers: () => {
    timerSystem.runOnlyPendingTimers();
    return jest;
  },
  advanceTimersByTime: (ms: number) => {
    timerSystem.advanceTimersByTime(ms);
    return jest;
  },
  advanceTimersToNextTimer: () => {
    timerSystem.advanceTimersToNextTimer();
    return jest;
  },
  clearAllTimers: () => {
    timerSystem.clearAllTimers();
    return jest;
  },
  getTimerCount: () => timerSystem.getTimerCount(),
  setSystemTime: (time: number | Date) => {
    timerSystem.setSystemTime(time);
    return jest;
  },
  getRealSystemTime: () => timerSystem.getRealSystemTime(),
};

// --- Console forwarding ---

let consoleForwardingInstalled = false;

function setupConsoleForwarding(): void {
  if (consoleForwardingInstalled) return;
  consoleForwardingInstalled = true;

  const methods = ['log', 'warn', 'error', 'info', 'debug'] as const;
  for (const type of methods) {
    // eslint-disable-next-line no-console
    const original = console[type].bind(console);
    // eslint-disable-next-line no-console
    console[type] = (...args: Array<unknown>) => {
      original(...args);
      if (rpc) {
        rpc.onConsole(type, args.map(serializeArg)).catch(() => {});
      }
    };
  }
}

function serializeArg(arg: unknown): string {
  if (arg === null || arg === undefined) return String(arg);
  if (typeof arg === 'string') return arg;
  if (
    typeof arg === 'number' ||
    typeof arg === 'boolean' ||
    typeof arg === 'bigint' ||
    typeof arg === 'symbol'
  ) {
    return String(arg);
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return Object.prototype.toString.call(arg);
  }
}

// --- toSelector ---

function toSelector(element: unknown): string {
  if (!(element instanceof Element)) {
    throw new TypeError('Expected DOM Element');
  }
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  if (
    element instanceof HTMLElement &&
    element.dataset.testid != null &&
    element.dataset.testid !== ''
  ) {
    return `[data-testid="${CSS.escape(element.dataset.testid)}"]`;
  }
  const tmpId = `__jest_selector_${Math.random().toString(36).slice(2)}`;
  element.id = tmpId;
  return `#${tmpId}`;
}

const screenshotCounters = new Map<string, number>();

function getCurrentTestName(): string | null {
  return runner.currentTestName;
}

expectFn.extend({
  async toMatchScreenshot(
    received: unknown,
    nameOrOptions?: unknown,
    options?: unknown,
  ) {
    const opts =
      typeof nameOrOptions === 'object' && nameOrOptions !== null
        ? (nameOrOptions as Record<string, unknown>)
        : ((options ?? {}) as Record<string, unknown>);
    let name = typeof nameOrOptions === 'string' ? nameOrOptions : null;

    if (name == null) {
      const testName = getCurrentTestName();
      if (testName == null) {
        throw new Error('toMatchScreenshot requires a name or test context');
      }
      const count = (screenshotCounters.get(testName) ?? 0) + 1;
      screenshotCounters.set(testName, count);
      name = `${testName} ${count}`;
    }

    const isPageTarget =
      received != null &&
      typeof received === 'object' &&
      typeof (received as Record<string, unknown>).viewport === 'function';
    let selector: string | undefined;
    const maskSelectors: Array<string> = [];

    if (!isPageTarget) {
      selector = toSelector(received);
    }

    if (
      opts.screenshotOptions != null &&
      Array.isArray((opts.screenshotOptions as Record<string, unknown>).mask)
    ) {
      for (const maskEl of (opts.screenshotOptions as Record<string, unknown>)
        .mask as Array<unknown>) {
        if (maskEl instanceof Element) {
          maskSelectors.push(toSelector(maskEl));
        }
      }
    }

    await initRpc();
    const result = (await rpc!.screenshotMatch({
      mask: maskSelectors.length > 0 ? maskSelectors : undefined,
      name,
      screenshotOptions: opts.screenshotOptions ?? undefined,
      selector,
      target: isPageTarget ? 'page' : 'element',
    })) as {
      pass: boolean;
      message?: string;
      referencePath?: string;
      actualPath?: string;
      diffPath?: string;
    };

    return {
      pass: result.pass,
      message: () => {
        const parts = [result.message ?? 'Screenshot mismatch'];
        if (result.referencePath != null && result.referencePath !== '')
          parts.push(`Reference: ${result.referencePath}`);
        if (result.actualPath != null && result.actualPath !== '')
          parts.push(`Actual: ${result.actualPath}`);
        if (result.diffPath != null && result.diffPath !== '')
          parts.push(`Diff: ${result.diffPath}`);
        return parts.join('\n');
      },
    };
  },
});

// --- Run all tests (called by node via birpc) ---

async function runAllTests(testFile: string): Promise<void> {
  // Import the test file — Vite transforms it
  await import(/* @vite-ignore */ testFile);
  setupConsoleForwarding();

  const result = await runner.run();

  const mappedResults = result.tests.map(t => ({
    name: t.fullName,
    status: t.status,
    duration: 0,
    ...(t.error ? {error: t.error.message, stack: t.error.stack} : {}),
  }));

  await rpc!.reportTestResult({
    testPath: testFile,
    passed: result.passed,
    failed: result.failed,
    skipped: result.skipped,
    total: result.tests.length,
    results: mappedResults,
  });
}

// --- Internals export ---

const __browserInternals = {
  get browser() {
    return globalThis.__JEST_BROWSER_CONFIG__?.browserName ?? 'unknown';
  },
  get currentTestName() {
    return getCurrentTestName();
  },
  initRpc,
  get platform() {
    return globalThis.__JEST_BROWSER_CONFIG__?.platform ?? 'unknown';
  },
  get rpc() {
    return rpc;
  },
  toSelector,
};

// --- Connect on load ---
void initRpc();

// Re-exported by jestGlobalsPlugin as `@jest/globals` virtual module
export const {describe, it, test, beforeAll, afterAll, beforeEach, afterEach} =
  runner;
export const expect = expectFn;
// `jest` and `__browserInternals` re-exported by jestGlobalsPlugin;
// `__browserInternals` also imported by browser-entry.ts
export {jest, __browserInternals};
