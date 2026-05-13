/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface PageAPI {
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  getText(selector: string): Promise<string>;
  waitForSelector(selector: string): Promise<void>;
  screenshot(options?: {
    element?: Element;
    path?: string;
    save?: boolean;
    screenshotOptions?: Record<string, unknown>;
  }): Promise<string | void>;
  evaluate(script: string): Promise<unknown>;
}

export interface UserEventAPI {
  click(element: Element): Promise<void>;
  type(element: Element, text: string): Promise<void>;
  clear(element: Element): Promise<void>;
  hover(element: Element): Promise<void>;
  tab(): Promise<void>;
}

export interface CommandsAPI {
  removeFile(filePath: string): Promise<void>;
}

export interface ServerAPI {
  browser: string;
  platform: string;
  commands: CommandsAPI;
}

declare module '@jest/browser' {
  export const page: PageAPI;
  export const userEvent: UserEventAPI;
  export const commands: CommandsAPI;
  export const server: ServerAPI;
}

export interface ScreenshotMatcherOptions {
  /** Custom name for the screenshot. Auto-generated from test name if omitted. */
  name?: string;
  /** CSS selectors of elements to mask during screenshot. */
  mask?: Array<string>;
  /** Options passed to Playwright's screenshot method. */
  screenshotOptions?: Record<string, unknown>;
  /** Allowed pixel mismatch ratio (0-1). Default: 0. */
  threshold?: number;
}

declare module 'expect' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    /**
     * Takes a screenshot of an element or page and compares it against
     * a stored reference screenshot. On first run, creates the reference.
     *
     * @example
     * // Element screenshot with auto-generated name
     * await expect(element).toMatchScreenshot();
     *
     * // With custom name
     * await expect(element).toMatchScreenshot('button-primary');
     *
     * // With options
     * await expect(element).toMatchScreenshot('button', { threshold: 0.01 });
     */
    toMatchScreenshot(
      name?: string,
      options?: ScreenshotMatcherOptions,
    ): Promise<R>;
    toMatchScreenshot(options?: ScreenshotMatcherOptions): Promise<R>;
  }
}
