/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Browser, BrowserContext, BrowserType, Page} from 'playwright';
import type {
  BrowserCommand,
  BrowserPage,
  BrowserProvider,
  BrowserProviderOptions,
} from '@jest/browser';
import {playwrightCommands} from './commands';

class PlaywrightPage implements BrowserPage {
  private readonly _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  async goto(url: string): Promise<void> {
    await this._page.goto(url);
  }

  async evaluate<R>(fn: string | (() => R)): Promise<R> {
    return this._page.evaluate(fn);
  }

  async waitForClose(): Promise<void> {
    return new Promise<void>(resolve => {
      this._page.on('close', () => resolve());
    });
  }

  async close(): Promise<void> {
    await this._page.close();
  }
}

export class PlaywrightBrowserProvider implements BrowserProvider {
  readonly name = 'playwright';
  readonly supportedBrowsers = ['chromium', 'firefox', 'webkit'] as const;

  private _browser: Browser | null = null;
  private _context: BrowserContext | null = null;
  private _page: Page | null = null;

  get page(): Page | null {
    return this._page;
  }

  get context(): BrowserContext | null {
    return this._context;
  }

  getCommands(): Record<string, BrowserCommand> {
    return playwrightCommands;
  }

  async open(options: BrowserProviderOptions): Promise<void> {
    const browserName = options.browser as 'chromium' | 'firefox' | 'webkit';

    if (!this.supportedBrowsers.includes(browserName)) {
      throw new Error(
        `Browser "${browserName}" is not supported by playwright provider. ` +
          `Supported browsers: ${this.supportedBrowsers.join(', ')}`,
      );
    }

    const playwright = await import('playwright');
    const browserType: BrowserType = playwright[browserName];

    this._browser = await browserType.launch({
      headless: options.headless ?? true,
      ...options.launchOptions,
    });

    this._context = await this._browser.newContext({
      viewport: options.viewport,
    });
  }

  async openPage(url: string): Promise<BrowserPage> {
    if (!this._context) {
      throw new Error('Browser not opened. Call open() first.');
    }

    const page = await this._context.newPage();
    this._page = page;
    await page.goto(url);
    return new PlaywrightPage(page);
  }

  async close(): Promise<void> {
    if (this._context) {
      await this._context.close();
      this._context = null;
      this._page = null;
    }
    if (this._browser) {
      await this._browser.close();
      this._browser = null;
    }
  }
}
