---
id: browser-mode-multi-browser
title: Browser Mode Multi-Browser
---

:::caution

Jest ships with **experimental** support for Browser Mode. The implementation may have bugs and lack features.

:::

# Multiple Browsers and Mixed Projects

## Multiple Browsers

Run the same tests across multiple browsers using `instances`:

```js tab title="jest.config.js"
const {defineConfig} = require('jest');

module.exports = defineConfig({
  browserMode: {
    enabled: true,
    provider: 'playwright',
    headless: true,
    instances: [
      {browser: 'chromium'},
      {browser: 'firefox'},
      {browser: 'webkit'},
    ],
  },
});
```

```ts tab title="jest.config.ts"
import {defineConfig} from 'jest';

export default defineConfig({
  browserMode: {
    enabled: true,
    provider: 'playwright',
    headless: true,
    instances: [
      {browser: 'chromium'},
      {browser: 'firefox'},
      {browser: 'webkit', viewport: {width: 1280, height: 720}},
    ],
  },
});
```

Each instance can override:

- `headless`
- `providerOptions`
- `viewport`
- `screenshotDirectory`
- `screenshotFailures`

Jest runs each browser instance sequentially, reporting results per-browser in the test output.

## Mixed Node and Browser Projects

Run browser tests alongside Node-based unit tests using Jest's [projects](configuration#projects) feature:

```js tab title="jest.config.js"
const {defineConfig} = require('jest');

module.exports = defineConfig({
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      displayName: 'browser',
      testMatch: ['<rootDir>/tests/browser/**/*.test.ts'],
      browserMode: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
      },
    },
  ],
});
```

```ts tab title="jest.config.ts"
import {defineConfig} from 'jest';

export default defineConfig({
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      displayName: 'browser',
      testMatch: ['<rootDir>/tests/browser/**/*.test.ts'],
      browserMode: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
      },
    },
  ],
});
```

This allows you to:

- Keep fast unit tests running in Node.js
- Run integration/component tests in a real browser
- Use a single `jest` command to execute both

## Organizing Test Files

A recommended project structure for mixed configurations:

```
my-project/
├── jest.config.ts
├── tests/
│   ├── unit/          ← Node.js tests (jsdom or node env)
│   │   ├── utils.test.ts
│   │   └── api.test.ts
│   └── browser/       ← Browser mode tests
│       ├── dom.test.ts
│       ├── components.test.ts
│       └── visual.test.ts
└── src/
    └── ...
```

Use `testMatch` patterns to route files to the correct project configuration.
