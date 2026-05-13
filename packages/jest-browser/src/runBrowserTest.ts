/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import * as fs from 'graceful-fs';
import type {Test, TestContext, TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import {buildTestResult} from './buildTestResult';
import {type BrowserProviderWithCommands, resolveProvider} from './provider';
import {
  type TestResult as BrowserTestResult,
  type NodeFunctions,
  createBirpcServer,
} from './rpc';
import {compareScreenshot} from './screenshot/comparator';
import {createViteServer} from './vite/server';

/**
 * Run a single test file in the browser.
 *
 * Flow:
 * 1. Start birpc WebSocket server
 * 2. Start Vite dev server (with jest globals plugin pointing to WS port)
 * 3. Launch browser via Playwright
 * 4. Navigate to test entry page
 * 5. Tell browser to run test file via birpc
 * 6. Wait for test results via birpc
 * 7. Convert to Jest TestResult format
 * 8. Cleanup
 */
export async function runBrowserTest(
  test: Test,
  _globalConfig: Config.GlobalConfig,
): Promise<TestResult> {
  const testContext: TestContext = test.context;
  const projectConfig = testContext.config;
  const browserConfig = projectConfig.browserMode;
  const rootDir = projectConfig.rootDir;
  const screenshotDir = browserConfig?.screenshotDirectory ?? '__screenshots__';
  const trackUnhandledErrors = browserConfig?.trackUnhandledErrors !== false;
  const testPath = test.path;
  const relativeTestPath = path.relative(rootDir, testPath);
  const plugin = await resolveProvider(
    browserConfig?.provider ?? '@jest/browser-playwright',
    false,
  );

  let browserResult: BrowserTestResult | null = null;
  const unhandledErrors: Array<{message: string; stack?: string}> = [];
  let provider: BrowserProviderWithCommands | null = null;

  const getPage = () => {
    const page = (provider as {page?: unknown} | null)?.page;
    if (page == null) {
      throw new Error('No browser page');
    }
    return page as any;
  };

  const nodeFunctions: NodeFunctions = {
    onConsole(type: string, args: Array<string>) {
      // eslint-disable-next-line no-console
      console[type as 'log']?.(...args);
    },
    async onUnhandledError(error: {message: string; stack?: string}) {
      unhandledErrors.push(error);

      console.error(
        error.stack != null && error.stack !== ''
          ? `${error.message}\n${error.stack}`
          : error.message,
      );
    },
    async pageClick(selector: string, options?: Record<string, unknown>) {
      const page = getPage();
      await page.click(selector, options);
    },
    async pageEvaluate(script: string) {
      const page = getPage();
      return page.evaluate(script);
    },
    async pageFill(selector: string, value: string) {
      const page = getPage();
      await page.fill(selector, value);
    },
    async pageGetText(selector: string) {
      const page = getPage();
      const text = await page.textContent(selector);
      return text ?? '';
    },
    async pageScreenshot(options?: Record<string, unknown>) {
      const page = getPage();
      const screenshotBuffer = await page.screenshot(options);
      return Buffer.from(screenshotBuffer).toString('base64');
    },
    async pageType(selector: string, text: string) {
      const page = getPage();
      await page.type(selector, text);
    },
    async pageWaitForSelector(
      selector: string,
      options?: Record<string, unknown>,
    ) {
      const page = getPage();
      await page.waitForSelector(selector, options);
    },
    async removeFile(filePath: string) {
      const absolutePath = path.resolve(rootDir, filePath);
      const fs = await import('graceful-fs');
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    },
    reportTestResult(result: BrowserTestResult) {
      browserResult = result;
    },
    async screenshotMatch(options: {
      mask?: Array<string>;
      name: string;
      screenshotOptions?: Record<string, unknown>;
      selector?: string;
      target: 'element' | 'page';
    }) {
      const page = getPage();

      let screenshotBuffer: Buffer;

      if (options.target === 'page') {
        screenshotBuffer = Buffer.from(
          await page.screenshot(options.screenshotOptions),
        );
      } else {
        if (options.selector == null || options.selector === '') {
          throw new Error('Element selector required for element screenshots');
        }
        const element = await page.$(options.selector);
        if (element == null) {
          throw new Error(`Element not found: ${options.selector}`);
        }

        const screenshotOpts: Record<string, unknown> = {
          ...options.screenshotOptions,
        };
        // Convert mask selectors to Playwright Locators
        if (options.mask != null && options.mask.length > 0) {
          screenshotOpts.mask = options.mask.map(sel => page.locator(sel));
        }

        screenshotBuffer = Buffer.from(
          await element.screenshot(screenshotOpts),
        );
      }

      return compareScreenshot({
        actual: screenshotBuffer,
        browserName: browserConfig?.name ?? 'chromium',
        maxDiffPixelRatio:
          (options.screenshotOptions?.maxDiffPixelRatio as
            | number
            | undefined) ??
          browserConfig?.expect?.toMatchScreenshot?.maxDiffPixelRatio,
        maxDiffPixels:
          (options.screenshotOptions?.maxDiffPixels as number | undefined) ??
          browserConfig?.expect?.toMatchScreenshot?.maxDiffPixels,
        name: options.name,
        platform: process.platform,
        rootDir,
        screenshotDirectory: screenshotDir,
        testFilePath: testPath,
        threshold:
          (options.screenshotOptions?.threshold as number) ??
          browserConfig?.expect?.toMatchScreenshot?.threshold ??
          0.1,
        updateScreenshots:
          (options.screenshotOptions?.update as boolean) ?? false,
      });
    },
    async screenshotSave(options: {
      path: string;
      selector?: string;
      screenshotOptions?: Record<string, unknown>;
    }) {
      const page = getPage();
      const absolutePath = path.resolve(rootDir, options.path);
      const dir = path.dirname(absolutePath);
      const fs = await import('graceful-fs');
      fs.mkdirSync(dir, {recursive: true});

      let buffer: Buffer;
      if (options.selector != null && options.selector !== '') {
        const element = await page.$(options.selector);
        if (element == null) {
          throw new Error(`Element not found: ${options.selector}`);
        }
        buffer = Buffer.from(
          await element.screenshot(options.screenshotOptions),
        );
      } else {
        buffer = Buffer.from(await page.screenshot(options.screenshotOptions));
      }
      fs.writeFileSync(absolutePath, buffer);
    },
    async triggerCommand(command: string, payload: Array<unknown>) {
      if (!provider) {
        throw new Error('No browser provider');
      }

      const page = getPage();
      const commands = provider.getCommands();
      const normalizedCommand =
        command in commands ? command : `__jest_${command.replace(/^__/, '')}`;
      const handler = commands[normalizedCommand];
      const legacyCommandName = '__jest_click';

      if (handler == null) {
        throw new Error(`Unknown command: ${command}`);
      }

      void legacyCommandName;

      return handler(
        {
          context: page.context(),
          page,
        },
        ...payload,
      );
    },
  };

  const birpcServer = await createBirpcServer(nodeFunctions);

  try {
    const viteServer = await createViteServer({
      api: browserConfig?.api,
      browserName: browserConfig?.name ?? 'chromium',
      platform: process.platform,
      rootDir,
      testerHtmlPath: browserConfig?.testerHtmlPath,
      trackUnhandledErrors,
      wsPort: birpcServer.port,
    });

    const viteAddress = viteServer.httpServer?.address();
    const vitePort =
      typeof viteAddress === 'object' && viteAddress ? viteAddress.port : 5173;

    try {
      const browserOptions = {
        browser: browserConfig?.name ?? 'chromium',
        headless: browserConfig?.headless !== false,
        launchOptions: browserConfig?.providerOptions ?? {},
        viewport: browserConfig?.viewport,
      };

      provider = await plugin.setup(browserOptions);

      try {
        await provider.openPage(
          `http://localhost:${vitePort}/__jest_browser__`,
        );
        const rpc = await birpcServer.waitForClient(
          browserConfig?.connectTimeout,
        );

        // Start tracing if configured
        const traceMode = browserConfig?.trace ?? 'off';
        const tracePage = (provider as {page?: any}).page;
        if (traceMode !== 'off' && tracePage != null) {
          const context = tracePage.context();
          await context.tracing.start({screenshots: true, snapshots: true});
        }

        await rpc.runTests(`/${relativeTestPath}`);

        if (browserResult == null) {
          throw new Error('No test results received from browser');
        }

        const finalBrowserResult = browserResult as BrowserTestResult;

        // Stop tracing and save if needed
        if (traceMode !== 'off' && tracePage != null) {
          const context = tracePage.context();
          const shouldSave =
            traceMode === 'on' ||
            (traceMode === 'retain-on-failure' &&
              finalBrowserResult.failed > 0);

          if (shouldSave) {
            const traceDir = path.resolve(rootDir, '__traces__');
            const traceName = path.basename(
              relativeTestPath,
              path.extname(relativeTestPath),
            );
            const tracePath = path.join(traceDir, `${traceName}.trace.zip`);
            await fs.promises.mkdir(traceDir, {recursive: true});
            await context.tracing.stop({path: tracePath});
          } else {
            await context.tracing.stop();
          }
        }

        if (trackUnhandledErrors && unhandledErrors.length > 0) {
          const unhandledFailureMessage = unhandledErrors
            .map(error =>
              error.stack != null && error.stack !== ''
                ? `Unhandled error in browser: ${error.message}\n${error.stack}`
                : `Unhandled error in browser: ${error.message}`,
            )
            .join('\n\n');

          const hasSyntheticUnhandledFailure = finalBrowserResult.results.some(
            result => result.name === '[browser] unhandled errors',
          );

          if (!hasSyntheticUnhandledFailure) {
            finalBrowserResult.failed += 1;
            finalBrowserResult.total += 1;
            finalBrowserResult.results.push({
              duration: 0,
              error: unhandledFailureMessage,
              name: '[browser] unhandled errors',
              stack: unhandledFailureMessage,
              status: 'failed',
            });
          }
        }

        // Take screenshot on failure if configured
        if (
          browserConfig?.screenshotFailures !== false &&
          finalBrowserResult.failed > 0
        ) {
          const screenshotPath = path.join(
            path.resolve(
              rootDir,
              browserConfig?.screenshotDirectory ?? '__screenshots__',
            ),
            path.basename(relativeTestPath, path.extname(relativeTestPath)),
            'failure.png',
          );
          await fs.promises.mkdir(path.dirname(screenshotPath), {
            recursive: true,
          });
          if (tracePage != null) {
            await tracePage.screenshot({path: screenshotPath});
          }
        }

        return buildTestResult(test, finalBrowserResult);
      } finally {
        if (provider != null) {
          await provider.close();
        }
      }
    } finally {
      await viteServer.close();
    }
  } finally {
    await birpcServer.close();
  }
}
