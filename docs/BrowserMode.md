---
id: browser-mode
title: Browser Mode
---

:::caution

Jest ships with **experimental** support for Browser Mode.

The implementation may have bugs and lack features. For the latest status check out the [issue](https://github.com/jestjs/jest/issues/7185) and the [label](https://github.com/jestjs/jest/labels/Browser%20Mode) on the issue tracker.

:::

# Browser Mode

Run your Jest tests in a real browser using Playwright, with access to native browser APIs like `window`, `document`, and the full DOM — no simulations.

## Why Browser Mode?

### The Simulation Caveat

Testing JavaScript programs in simulated environments such as `jsdom` or `happy-dom` has simplified test setup and provided an easy-to-use API. However, these tools only _simulate_ a browser environment — not an actual browser — which can result in discrepancies between test and production behavior. False positives and negatives occur.

To achieve the highest confidence, it's crucial to test in a real browser. Browser Mode runs tests natively in Chromium, Firefox, or WebKit so you can trust that your tests reflect real user behavior.

### What Real Browsers Give You

- **Event handling**: Disabled buttons don't fire click events in real browsers — `jsdom` fires them anyway
- **CSS**: Layout, computed styles, and media queries work correctly
- **Web APIs**: `IntersectionObserver`, `ResizeObserver`, `fetch`, `WebSocket`, `Canvas`, Web Animations, and more work natively
- **Security**: CORS, CSP, and other security policies are enforced
- **Rendering**: Font rendering, viewport behavior, and responsive layouts are real

### Drawbacks

- **Longer initialization**: Browser Mode spins up Vite and a browser process, adding startup time compared to in-process environments
- **ESM only**: Test files are served as ES modules via Vite — CommonJS `require()` is not available
- **Early development**: Some features (module mocking, coverage) are not yet supported

## Installation

Install Playwright as a peer dependency:

```bash npm2yarn
npm install --save-dev playwright
```

Install browser binaries:

```bash
npx playwright install chromium
```

To test in Firefox or WebKit, install those as well:

```bash
npx playwright install firefox webkit
```

## Quick Start

Activate browser mode by adding the `browserMode` field to your Jest configuration:

```js tab title="jest.config.js"
const {defineConfig} = require('jest');

module.exports = defineConfig({
  browserMode: {
    enabled: true,
    provider: 'playwright',
    name: 'chromium',
    headless: true,
  },
});
```

```ts tab title="jest.config.ts"
import {defineConfig} from 'jest';

export default defineConfig({
  browserMode: {
    enabled: true,
    provider: 'playwright',
    name: 'chromium',
    headless: true,
  },
});
```

For full configuration options, see [Browser Mode Configuration](browser-mode-configuration).

## Writing Tests

Tests use explicit imports from `@jest/globals`:

```js
import {describe, expect, it} from '@jest/globals';

describe('DOM operations', () => {
  it('creates and queries elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello Browser';
    div.dataset.testid = 'greeting';
    document.body.append(div);

    const found = document.querySelector('[data-testid="greeting"]');
    expect(found.textContent).toBe('Hello Browser');
  });

  it('handles events correctly', () => {
    const button = document.createElement('button');
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });

    button.click();
    expect(clicked).toBe(true);
  });
});
```

Run tests:

```bash
npx jest
```

### Fake Timers

`jest.useFakeTimers()` works in browser mode, patching `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, and `Date.now`:

```js
import {expect, it, jest} from '@jest/globals';

it('advances timers', () => {
  jest.useFakeTimers();
  let called = false;
  setTimeout(() => {
    called = true;
  }, 1000);

  jest.advanceTimersByTime(1000);
  expect(called).toBe(true);

  jest.useRealTimers();
});
```

### Lifecycle Hooks

`beforeAll`, `afterAll`, `beforeEach`, and `afterEach` work as expected with proper scope inheritance in nested `describe` blocks.

### Parametric Tests

`it.each` and `describe.each` are supported:

```js
import {expect, it} from '@jest/globals';

it.each([
  [1, 1, 2],
  [2, 3, 5],
  [10, 20, 30],
])('adds %d + %d = %d', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

## How It Works

```
Jest (Node.js)
├── Vite dev server (serves tests + deps as ESM)
├── WebSocket server (birpc — bidirectional RPC)
└── Playwright (launches real browser)
      │
      ▼
  Browser
  ├── @jest/globals (virtual module via Vite plugin)
  │   ├── describe / it / test / expect
  │   ├── jest.fn() / jest.useFakeTimers()
  │   ├── page / userEvent
  │   └── toMatchScreenshot
  ├── Test files (native ESM via Vite)
  └── Results → birpc → Jest → terminal output
```

1. Jest detects `browserMode.enabled` and activates the browser runner
2. **Vite** starts as a dev server, serving test files and dependencies as native ES modules
3. **Playwright** launches the specified browser and navigates to a Jest entry page
4. The entry page loads `@jest/globals` as a Vite virtual module containing the test framework, assertion library, and a birpc client
5. The browser connects back to Node via WebSocket
6. Node instructs the browser to import and run each test file
7. Results flow back through birpc to Jest's standard reporting pipeline

## Supported Browsers

| Browser  | Engine     | Provider   |
| -------- | ---------- | ---------- |
| Chromium | Blink/V8   | Playwright |
| Firefox  | Gecko      | Playwright |
| WebKit   | WebKit/JSC | Playwright |

## Limitations

### No `jest.mock()` Module Mocking (Yet)

Module mocking via `jest.mock()` is not yet supported in browser mode. This requires AST-level transforms to hoist mock calls and intercept module requests — planned for a future release.

`jest.fn()` and `jest.spyOn()` work normally since they operate on runtime objects.

### No Runner Options (Yet)

Unlike Node environment runner-level options (`testTimeout`, `retry`, `sequence`, `maxConcurrency`, `bail`, custom runner class), Jest browser mode does not yet support configuring these per-runner. Test timeout and retry behavior use Jest's global configuration but are not individually tunable for browser tests.

### No Code Coverage (Yet)

Code coverage collection is not yet supported in browser mode.

### Thread-Blocking Dialogs

`alert()`, `confirm()`, and `prompt()` block the browser thread and cannot be used. Mock them if your code calls these APIs:

```js
window.alert = jest.fn();
window.confirm = jest.fn(() => true);
```

### ESM Only

Test files are served as ES modules via Vite. Use `import`/`export` syntax. CommonJS `require()` is not available in the browser.

### Spying on Module Exports

Browser mode uses native ESM — module namespace objects are sealed and can't be reconfigured. You cannot call `jest.spyOn` on an imported module's exports directly:

```js
import * as utils from './utils.js';
jest.spyOn(utils, 'helper'); // ❌ throws — module namespace is sealed
```

Instead, spy on object methods or use dependency injection patterns.

## Limitations

### `jest.mock()` Hoisting Not Supported

In Node-based Jest, `jest.mock()` calls are automatically hoisted to the top of the file by `babel-jest`. In browser mode, test files are served as native ES modules via Vite and this hoisting transform is **not yet implemented**.

This means:

- `jest.mock('./module')` will not work as expected — imports resolve before `jest.mock()` executes
- Manual mocks (`__mocks__/` directory) are not supported

**Workaround:** Use dependency injection, pass dependencies as function arguments, or mock at the object/method level:

```js
// ✅ Works — mock methods on imported objects
import {api} from './api.js';
api.fetch = jest.fn();

// ✅ Works — dependency injection
function createService(fetcher = fetch) {
  /* ... */
}
```

### No Node.js APIs in Test Files

Browser tests run in an actual browser context. Node.js built-in modules (`fs`, `path`, `child_process`, etc.) are not available. Use [custom commands](./BrowserModeAPI.md) to perform server-side operations from your tests.

### No Snapshot Testing

`toMatchSnapshot()` and `toMatchInlineSnapshot()` are not supported in browser mode. Use explicit assertions instead.

### Thread/Worker Isolation

Each test file runs in an isolated iframe. There is no shared state between test files. Unlike Node-based Jest, `--runInBand` has no effect on browser tests — they always run in parallel iframes managed by the orchestrator.

### Limited `jest.config` Options

Many Jest configuration options are designed for Node.js and are ignored in browser mode, including:

- `transform` — Vite handles all transforms
- `moduleNameMapper` — use Vite `resolve.alias` instead
- `testEnvironment` — always browser
- `globals` — use Vite `define` instead
