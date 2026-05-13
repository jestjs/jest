/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {createViteServer} from './vite/server';
export {
  createBirpcServer,
  type BrowserFunctions,
  type NodeFunctions,
} from './rpc';
export {
  defineBrowserProvider,
  resolveProvider,
  type BrowserCommand,
  type BrowserProviderPlugin,
} from './provider';
export {compareScreenshot} from './screenshot/comparator';
export type {
  BrowserPage,
  BrowserProvider,
  BrowserProviderOptions,
} from './provider/types';
export type {
  ScreenshotCompareOptions,
  ScreenshotCompareResult,
} from './screenshot/comparator';
export type {TestResult as BrowserTestResult} from './rpc';

// Runner — default export for Jest runner resolution
export {default} from './runner';
export {default as BrowserTestRunner} from './runner';
export {runBrowserTest} from './runBrowserTest';
export {buildTestResult} from './buildTestResult';
