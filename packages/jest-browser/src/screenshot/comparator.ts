/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import * as fs from 'graceful-fs';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

export interface ScreenshotCompareOptions {
  /** Screenshot PNG buffer from Playwright */
  actual: Buffer;
  /** Browser name (appended to filename) */
  browserName: string;
  /** Max allowed mismatch ratio (0-1) */
  maxDiffPixelRatio?: number;
  /** Max allowed mismatched pixels */
  maxDiffPixels?: number;
  /** Name for screenshot */
  name: string;
  /** Platform name (appended to filename) */
  platform: string;
  /** Root directory */
  rootDir: string;
  /** Directory to store reference screenshots */
  screenshotDirectory: string;
  /** Test file path (for directory structure) */
  testFilePath: string;
  /** Pixelmatch threshold (0-1) */
  threshold?: number;
  /** Whether to update references */
  updateScreenshots?: boolean;
}

export interface ScreenshotCompareResult {
  /** Path to actual image (on failure) */
  actualPath?: string;
  /** Path to diff image (on failure) */
  diffPath?: string;
  /** Number of mismatched pixels */
  diffPixels?: number;
  message: string;
  pass: boolean;
  /** Path to reference image */
  referencePath: string;
}

/**
 * Compare screenshot against reference image.
 * Creates reference on first run. Writes actual + diff on mismatch.
 */
export function compareScreenshot(
  options: ScreenshotCompareOptions,
): ScreenshotCompareResult {
  const {
    actual,
    browserName,
    maxDiffPixelRatio,
    maxDiffPixels,
    name,
    platform,
    rootDir,
    screenshotDirectory,
    testFilePath,
    threshold = 0.1,
    updateScreenshots = false,
  } = options;

  const relTestDir = path.relative(rootDir, path.dirname(testFilePath));
  const testFileName = path.basename(testFilePath, path.extname(testFilePath));

  const refDir = path.join(
    rootDir,
    relTestDir,
    screenshotDirectory,
    testFileName,
  );
  const refFileName = `${name}-${browserName}-${platform}.png`;
  const referencePath = path.join(refDir, refFileName);

  if (!fs.existsSync(referencePath) || updateScreenshots) {
    fs.mkdirSync(refDir, {recursive: true});
    fs.writeFileSync(referencePath, actual);

    if (updateScreenshots) {
      return {
        message: 'Screenshot reference updated',
        pass: true,
        referencePath,
      };
    }

    return {
      message: `Screenshot reference created at ${referencePath}. Run tests again to compare.`,
      pass: true,
      referencePath,
    };
  }

  const referenceBuffer = fs.readFileSync(referencePath);

  if (Buffer.compare(referenceBuffer, actual) === 0) {
    return {
      message: 'Screenshots match (byte-identical)',
      pass: true,
      referencePath,
    };
  }

  const refPng = PNG.sync.read(referenceBuffer);
  const actualPng = PNG.sync.read(actual);

  if (refPng.width !== actualPng.width || refPng.height !== actualPng.height) {
    const attachDir = path.join(refDir, '__diff__');
    fs.mkdirSync(attachDir, {recursive: true});
    const actualPath = path.join(
      attachDir,
      `${name}-actual-${browserName}-${platform}.png`,
    );
    fs.writeFileSync(actualPath, actual);

    return {
      actualPath,
      message: `Screenshot dimensions differ: reference ${refPng.width}x${refPng.height}, actual ${actualPng.width}x${actualPng.height}`,
      pass: false,
      referencePath,
    };
  }

  const diffPng = new PNG({height: refPng.height, width: refPng.width});
  const diffPixels = pixelmatch(
    refPng.data,
    actualPng.data,
    diffPng.data,
    refPng.width,
    refPng.height,
    {threshold},
  );

  const totalPixels = refPng.width * refPng.height;
  const diffRatio = diffPixels / totalPixels;

  let pass = diffPixels === 0;
  if (!pass && maxDiffPixels !== undefined) {
    pass = diffPixels <= maxDiffPixels;
  }
  if (!pass && maxDiffPixelRatio !== undefined) {
    pass = diffRatio <= maxDiffPixelRatio;
  }

  if (pass) {
    return {
      diffPixels,
      message: `Screenshots match (${diffPixels} pixels differ, within threshold)`,
      pass: true,
      referencePath,
    };
  }

  const attachDir = path.join(refDir, '__diff__');
  fs.mkdirSync(attachDir, {recursive: true});
  const actualPath = path.join(
    attachDir,
    `${name}-actual-${browserName}-${platform}.png`,
  );
  const diffPath = path.join(
    attachDir,
    `${name}-diff-${browserName}-${platform}.png`,
  );

  fs.writeFileSync(actualPath, actual);
  fs.writeFileSync(diffPath, PNG.sync.write(diffPng));

  return {
    actualPath,
    diffPath,
    diffPixels,
    message: `Screenshot mismatch: ${diffPixels} pixels (${(diffRatio * 100).toFixed(2)}%) differ`,
    pass: false,
    referencePath,
  };
}
