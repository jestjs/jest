/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unused-vars, sort-keys */

export interface BrowserPage {
  extend(
    methods: Record<string | symbol, (...args: Array<unknown>) => unknown>,
  ): BrowserPage;
  elementLocator(element: Element): ElementLocator;
  screenshot(options?: any): Promise<any>;
  cleanup(): void;
  [key: string]: any;
  [key: symbol]: any;
}

export interface ElementLocator {
  click(): Promise<void>;
  element(): Element;
}

const CLEANUP_SYMBOL = Symbol.for('jest:component-cleanup');

export function createPage(
  triggerCommand: (cmd: string, ...args: Array<any>) => Promise<any>,
  rpcAccess?: {
    screenshotSave: (opts: any) => Promise<any>;
    pageScreenshot: (opts?: any) => Promise<any>;
    toSelector: (el: unknown) => string;
  },
): BrowserPage {
  const page: BrowserPage = {
    extend(methods) {
      for (const key of [
        ...Object.keys(methods),
        ...Object.getOwnPropertySymbols(methods),
      ]) {
        page[key] = methods[key];
      }
      return page;
    },

    elementLocator(element: Element): ElementLocator {
      return {
        click: async () => {
          element.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        },
        element: () => element,
      };
    },

    screenshot: async (options?: any) => {
      if (rpcAccess != null && options?.save != null) {
        const {save: _save, ...rest} = options;
        const selector =
          options.element == null
            ? undefined
            : rpcAccess.toSelector(options.element);
        return rpcAccess.screenshotSave({
          path: options.path,
          screenshotOptions: rest,
          selector,
        });
      }
      if (rpcAccess != null) {
        return rpcAccess.pageScreenshot(options);
      }
      return triggerCommand('__jest_screenshot', options);
    },

    cleanup() {
      const fn = page[CLEANUP_SYMBOL];
      if (typeof fn === 'function') {
        fn();
      }
    },
  };

  return page;
}
