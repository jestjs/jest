/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');
const packageJsonPath = resolve(dir, 'package.json');
const originalPackageJson = fs.readFileSync(packageJsonPath, 'utf8');

describe('browser provider plugin integration', () => {
  afterAll(() => {
    fs.writeFileSync(packageJsonPath, originalPackageJson);
  });

  test("default provider works with provider: '@jest/browser-playwright'", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      jest: {
        browserMode: {
          provider: string;
        };
      };
    };

    pkg.jest.browserMode.provider = '@jest/browser-playwright';
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

    const result = runJest(dir, ['basic.test.ts']);

    expect(result.exitCode).toBe(0);
  });

  test('provider exports playwright factory and PlaywrightBrowserProvider class', () => {
    const providerModule = require('@jest/browser-playwright') as {
      PlaywrightBrowserProvider?: unknown;
      playwright?: unknown;
    };

    expect(typeof providerModule.playwright).toBe('function');
    expect(providerModule.PlaywrightBrowserProvider).toBeDefined();
  });
});
