/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {compareScreenshot} from '../screenshot/comparator';

jest.mock('pixelmatch', () => jest.fn());

const pixelmatchMock = pixelmatch as unknown as jest.Mock<
  number,
  Array<unknown>
>;

function createPng(
  width: number,
  height: number,
  rgba: [number, number, number, number],
): Buffer {
  const png = new PNG({height, width});
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    png.data[offset] = rgba[0];
    png.data[offset + 1] = rgba[1];
    png.data[offset + 2] = rgba[2];
    png.data[offset + 3] = rgba[3];
  }
  return PNG.sync.write(png);
}

function setupReference(rootDir: string, referenceBuffer: Buffer): void {
  compareScreenshot({
    actual: referenceBuffer,
    browserName: 'chromium',
    name: 'sample',
    platform: 'darwin',
    rootDir,
    screenshotDirectory: '__screenshots__',
    testFilePath: path.join(rootDir, 'tests', 'sample.test.ts'),
  });
}

describe('compareScreenshot config options', () => {
  const tempDirs: Array<string> = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, {force: true, recursive: true});
    }
    tempDirs.length = 0;
  });

  test('uses provided threshold over default', () => {
    pixelmatchMock.mockReturnValue(1);

    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jb-threshold-'));
    tempDirs.push(rootDir);

    const reference = createPng(2, 2, [0, 0, 0, 255]);
    const actual = createPng(2, 2, [255, 255, 255, 255]);
    setupReference(rootDir, reference);

    compareScreenshot({
      actual,
      browserName: 'chromium',
      name: 'sample',
      platform: 'darwin',
      rootDir,
      screenshotDirectory: '__screenshots__',
      testFilePath: path.join(rootDir, 'tests', 'sample.test.ts'),
      threshold: 0.5,
    });

    expect(pixelmatchMock).toHaveBeenCalledTimes(1);
    const options = pixelmatchMock.mock.calls[0]?.[5] as {threshold?: number};
    expect(options.threshold).toBe(0.5);
  });

  test('uses provided maxDiffPixelRatio', () => {
    pixelmatchMock.mockReturnValue(1);

    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jb-ratio-'));
    tempDirs.push(rootDir);

    const reference = createPng(2, 2, [0, 0, 0, 255]);
    const actual = createPng(2, 2, [255, 255, 255, 255]);
    setupReference(rootDir, reference);

    const result = compareScreenshot({
      actual,
      browserName: 'chromium',
      maxDiffPixelRatio: 0.3,
      name: 'sample',
      platform: 'darwin',
      rootDir,
      screenshotDirectory: '__screenshots__',
      testFilePath: path.join(rootDir, 'tests', 'sample.test.ts'),
    });

    expect(result.pass).toBe(true);
    expect(result.diffPixels).toBe(1);
  });

  test('uses provided maxDiffPixels', () => {
    pixelmatchMock.mockReturnValue(2);

    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jb-pixels-'));
    tempDirs.push(rootDir);

    const reference = createPng(2, 2, [0, 0, 0, 255]);
    const actual = createPng(2, 2, [255, 255, 255, 255]);
    setupReference(rootDir, reference);

    const result = compareScreenshot({
      actual,
      browserName: 'chromium',
      maxDiffPixels: 3,
      name: 'sample',
      platform: 'darwin',
      rootDir,
      screenshotDirectory: '__screenshots__',
      testFilePath: path.join(rootDir, 'tests', 'sample.test.ts'),
    });

    expect(result.pass).toBe(true);
    expect(result.diffPixels).toBe(2);
  });
});
