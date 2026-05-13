/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import * as path from 'node:path';
import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');
const screenshotDir = path.resolve(
  dir,
  '__screenshots__',
  'intentional-failure.test',
);

describe('browser screenshotFailures', () => {
  afterEach(() => {
    if (!fs.existsSync(screenshotDir)) {
      return;
    }

    for (const file of fs.readdirSync(screenshotDir)) {
      if (!file.endsWith('.png')) {
        continue;
      }

      fs.unlinkSync(path.join(screenshotDir, file));
    }
  });

  test('writes screenshot file when test fails', () => {
    const result = runJest(dir, ['intentional-failure.test.ts']);

    expect(result.exitCode).toBe(1);
    expect(fs.existsSync(screenshotDir)).toBe(true);

    const screenshotFiles = fs
      .readdirSync(screenshotDir)
      .filter(file => file.endsWith('.png'));

    expect(screenshotFiles.length).toBeGreaterThan(0);
  });
});
