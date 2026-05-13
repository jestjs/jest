/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface BrowserProviderOptions {
  /** Browser name: 'chromium' | 'firefox' | 'webkit' */
  browser: string;
  /** Run in headless mode */
  headless?: boolean;
  /** Playwright launch options */
  launchOptions?: Record<string, unknown>;
  /** Viewport dimensions */
  viewport?: {width: number; height: number};
}

export type BrowserCommand = (
  context: {context: any; page: any},
  ...args: Array<any>
) => Promise<any>;

export interface BrowserProvider {
  /** Provider name */
  readonly name: string;
  /** Supported browser names */
  readonly supportedBrowsers: ReadonlyArray<string>;

  /** Launch the browser */
  open(options: BrowserProviderOptions): Promise<void>;
  /** Navigate a page to a URL, return the page handle */
  openPage(url: string): Promise<BrowserPage>;
  /** Close browser and cleanup */
  close(): Promise<void>;
  /** Command registry for browser-side user events */
  getCommands(): Record<string, BrowserCommand>;
}

export interface BrowserPage {
  /** Navigate to URL */
  goto(url: string): Promise<void>;
  /** Evaluate JS in page context */
  evaluate<R>(fn: string | (() => R)): Promise<R>;
  /** Wait for page to be closed or navigate away */
  waitForClose(): Promise<void>;
  /** Close this page */
  close(): Promise<void>;
}
