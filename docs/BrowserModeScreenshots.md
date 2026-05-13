---
id: browser-mode-screenshots
title: Browser Mode Screenshots
---

:::caution

Jest ships with **experimental** support for Browser Mode. The implementation may have bugs and lack features.

:::

# Visual Regression Testing

Browser Mode includes built-in visual regression testing through `toMatchScreenshot`. It captures screenshots, compares them against reference images, and detects unintended visual changes.

## Basic Usage

```js
import {expect, it} from '@jest/globals';

it('component looks correct', async () => {
  // render your component...
  const element = document.querySelector('.my-component');
  await expect(element).toMatchScreenshot('component-name');
});
```

## Creating References

When you run a visual test for the first time, Jest creates a reference screenshot and fails the test:

```
expect(element).toMatchScreenshot()

No existing reference screenshot found; a new one was created.
Review it before running tests again.

Reference screenshot:
  __screenshots__/my-test.test.ts/component-name-chromium-darwin.png
```

Review the screenshot, then run the test again. Jest will now compare future runs against this baseline.

:::tip Reference screenshots live in `__screenshots__` folders next to your tests. Commit them to version control. :::

## Screenshot Organization

```
.
├── __screenshots__/
│   └── test-file.test.ts/
│       ├── component-chromium-darwin.png
│       ├── component-firefox-linux.png
│       └── component-webkit-win32.png
└── test-file.test.ts
```

The naming convention includes:

- **Name**: the first argument to `toMatchScreenshot()`, or auto-generated from the test name
- **Browser**: `chromium`, `firefox`, or `webkit`
- **Platform**: `darwin`, `linux`, or `win32`

## Auto-Naming

When no name is given, screenshots are named from the test:

```js
it('hero section', async () => {
  await expect(element).toMatchScreenshot(); // → "hero section 1"
  await expect(other).toMatchScreenshot(); // → "hero section 2"
});
```

## Page-Level Screenshots

Pass `page` to capture the full page:

```js
import {expect, it, page} from '@jest/globals';

it('full page', async () => {
  await expect(page).toMatchScreenshot('full-page');
});
```

## Masking Dynamic Content

Mask elements that change between runs (timestamps, avatars, etc.):

```js
await expect(element).toMatchScreenshot('profile', {
  screenshotOptions: {
    mask: [document.querySelector('.timestamp')],
  },
});
```

## Configuration

Configure thresholds globally:

```js tab title="jest.config.js"
const {defineConfig} = require('jest');

module.exports = defineConfig({
  browserMode: {
    enabled: true,
    provider: 'playwright',
    name: 'chromium',
    screenshotDirectory: '__screenshots__',
    screenshotFailures: true,
  },
});
```

Or per-assertion:

```js
await expect(element).toMatchScreenshot('text-heavy', {
  threshold: 0.1, // pixel comparison threshold (0-1)
});
```

## Debugging Failed Tests

When a visual test fails, Jest provides:

1. **Reference screenshot** — the expected baseline
2. **Actual screenshot** — what was captured
3. **Diff image** — highlights differences

```
expect(element).toMatchScreenshot()

Screenshot does not match the stored reference.
245 pixels differ.

Reference: __screenshots__/button.test.ts/button-chromium-darwin.png
Actual:    __diff__/button-chromium-darwin-actual.png
Diff:      __diff__/button-chromium-darwin-diff.png
```

## Best Practices

**Test specific elements** — capture components, not the full page, to reduce false positives:

```js
// ❌ Captures entire page; prone to unrelated changes
await expect(page).toMatchScreenshot();

// ✅ Captures only the component under test
await expect(document.querySelector('.card')).toMatchScreenshot();
```

**Disable animations** — add CSS to your test setup:

```css
*,
*::before,
*::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

**Set consistent viewport sizes** — avoid flaky tests from responsive behavior:

```json
{
  "browserMode": {
    "viewport": {"width": 1280, "height": 720}
  }
}
```

**Use Git LFS** — store reference screenshots in [Git LFS](https://github.com/git-lfs/git-lfs) for large test suites.
