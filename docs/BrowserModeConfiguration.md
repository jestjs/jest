---
id: browser-mode-configuration
title: Browser Mode Configuration
---

:::caution

Jest ships with **experimental** support for Browser Mode. The implementation may have bugs and lack features.

:::

# Browser Mode Configuration

All options live under the `browserMode` key in your Jest configuration.

## `enabled`

- **Type:** `boolean`
- **Default:** `false`

Enable browser mode for the project.

```json
{
  "browserMode": {
    "enabled": true
  }
}
```

## `provider`

- **Type:** `string`
- **Default:** `'playwright'`

Browser automation provider. Currently only `'playwright'` is supported.

## `name`

- **Type:** `'chromium' | 'firefox' | 'webkit'`
- **Default:** `'chromium'`

Which browser to launch. Requires the corresponding Playwright browser to be installed (`npx playwright install chromium`).

## `headless`

- **Type:** `boolean`
- **Default:** `true`

Run the browser without a visible window. Set to `false` for debugging.

```json
{
  "browserMode": {
    "headless": false
  }
}
```

## `providerOptions`

- **Type:** `object`
- **Default:** `{}`

Passed directly to Playwright's [`browserType.launch()`](https://playwright.dev/docs/api/class-browsertype#browser-type-launch) method.

```json
{
  "browserMode": {
    "providerOptions": {
      "args": ["--disable-gpu"],
      "slowMo": 50
    }
  }
}
```

## `viewport`

- **Type:** `{ width: number, height: number }`
- **Default:** `{ width: 414, height: 896 }`

Default viewport dimensions for the browser page.

```json
{
  "browserMode": {
    "viewport": {"width": 1280, "height": 720}
  }
}
```

## `connectTimeout`

- **Type:** `number`
- **Default:** `60000`

Maximum time (ms) to wait for the browser WebSocket connection.

## `screenshotDirectory`

- **Type:** `string`
- **Default:** `'__screenshots__'`

Directory (relative to test file) where reference screenshots are stored.

## `screenshotFailures`

- **Type:** `boolean`
- **Default:** `true`

Automatically capture a screenshot when a test fails.

## `instances`

- **Type:** `Array<{ browser: string, headless?: boolean, providerOptions?: object, viewport?: object, screenshotDirectory?: string, screenshotFailures?: boolean }>`
- **Default:** `undefined`

Run the same tests across multiple browser configurations. See [Browser Mode Multi-Browser](browser-mode-multi-browser) for details.

```js
module.exports = {
  browserMode: {
    enabled: true,
    provider: 'playwright',
    instances: [
      {browser: 'chromium'},
      {browser: 'firefox'},
      {browser: 'webkit', viewport: {width: 1280, height: 720}},
    ],
  },
};
```

## `trackUnhandledErrors`

- **Type:** `boolean`
- **Default:** `true`

Track unhandled errors and unhandled promise rejections in the browser. When enabled, unhandled errors fail the test and are reported to stderr.

```json
{
  "browserMode": {
    "trackUnhandledErrors": false
  }
}
```

## `fileParallelism`

- **Type:** `boolean`
- **Default:** `true`

Run test files in parallel when in headless mode. Set to `false` to run files sequentially (useful for tests with shared state).

```json
{
  "browserMode": {
    "fileParallelism": false
  }
}
```

## `api`

- **Type:** `number | { port?: number, host?: string }`
- **Default:** random available port

Configure the Vite dev server port/host used by browser mode.

```json
{
  "browserMode": {
    "api": {"port": 5173, "host": "0.0.0.0"}
  }
}
```

## `testerHtmlPath`

- **Type:** `string`
- **Default:** built-in HTML template

Path to a custom HTML file used as the test runner page. The file must include a `</body>` tag where the test script will be injected.

```json
{
  "browserMode": {
    "testerHtmlPath": "./customTester.html"
  }
}
```

## `trace`

- **Type:** `'off' | 'on' | 'retain-on-failure'`
- **Default:** `'off'`

Record Playwright traces for debugging. Traces are saved to `__traces__/` directory.

- `'on'` — record trace for every test
- `'retain-on-failure'` — only keep traces for failed tests
- `'off'` — no tracing

```json
{
  "browserMode": {
    "trace": "retain-on-failure"
  }
}
```

## `expect`

- **Type:** `{ toMatchScreenshot?: { threshold?: number, maxDiffPixelRatio?: number, maxDiffPixels?: number } }`
- **Default:** `{ toMatchScreenshot: { threshold: 0.1 } }`

Configure screenshot comparison defaults for `toMatchScreenshot()`.

```json
{
  "browserMode": {
    "expect": {
      "toMatchScreenshot": {
        "threshold": 0.05,
        "maxDiffPixelRatio": 0.01
      }
    }
  }
}
```

## TypeScript Setup

For `toMatchScreenshot` type support, add `@jest/browser/matchers` to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@jest/globals", "@jest/browser/matchers"]
  }
}
```

Or add a triple-slash reference in a global `.d.ts` file:

```ts
/// <reference types="@jest/browser/matchers" />
```
