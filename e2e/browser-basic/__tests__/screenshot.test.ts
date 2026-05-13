/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {afterEach, beforeEach, describe, expect, it} from '@jest/globals';
import {page, server} from '@jest/browser';

const screenshotDir = '__screenshots__';
const testFile = 'screenshot.test';

function refPath(name: string): string {
  return `__tests__/${screenshotDir}/${testFile}/${name}-${server.browser}-${server.platform}.png`;
}

describe('screenshots', () => {
  const cleanupPaths: Array<string> = [];

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(async () => {
    for (const p of cleanupPaths) {
      await server.commands.removeFile(p);
    }
    cleanupPaths.length = 0;
  });

  it('compares element screenshot correctly', async () => {
    const name = globalThis.crypto.randomUUID();
    const path = refPath(name);
    cleanupPaths.push(path);

    // Create a red box
    const box = document.createElement('div');
    box.style.width = '100px';
    box.style.height = '100px';
    box.style.backgroundColor = 'red';
    box.dataset.testid = 'red-box';
    document.body.append(box);

    // Create reference screenshot explicitly
    await page.screenshot({element: box, path, save: true});

    // Compare — should match since element hasn't changed
    await expect(box).toMatchScreenshot(name);
  });

  it('detects mismatch when element changes', async () => {
    const name = globalThis.crypto.randomUUID();
    const path = refPath(name);
    cleanupPaths.push(path);

    // Create reference with red box
    const box = document.createElement('div');
    box.style.width = '100px';
    box.style.height = '100px';
    box.style.backgroundColor = 'red';
    box.dataset.testid = 'mismatch-box';
    document.body.append(box);

    await page.screenshot({element: box, path, save: true});

    // Change color — should cause mismatch
    box.style.backgroundColor = 'blue';

    let errorMessage = '';
    try {
      await expect(box).toMatchScreenshot(name);
    } catch (error) {
      errorMessage = (error as Error).message;
    }

    expect(errorMessage).toContain('mismatch');
  });

  it('creates reference on first run', async () => {
    const name = globalThis.crypto.randomUUID();
    const path = refPath(name);
    cleanupPaths.push(path);

    const box = document.createElement('div');
    box.style.width = '50px';
    box.style.height = '50px';
    box.style.backgroundColor = 'green';
    document.body.append(box);

    // No pre-existing reference → should create one and pass
    await expect(box).toMatchScreenshot(name);
  });

  it('auto-names screenshots with counter', async () => {
    const autoName1 = 'screenshots > auto-names screenshots with counter 1';
    const autoName2 = 'screenshots > auto-names screenshots with counter 2';
    cleanupPaths.push(refPath(autoName1), refPath(autoName2));

    const el = document.createElement('div');
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.backgroundColor = 'purple';
    document.body.append(el);

    // Create refs for auto-named screenshots
    await page.screenshot({element: el, path: refPath(autoName1), save: true});
    await page.screenshot({element: el, path: refPath(autoName2), save: true});

    // Auto-naming: "testName counter"
    await expect(el).toMatchScreenshot();
    await expect(el).toMatchScreenshot();
  });
});
