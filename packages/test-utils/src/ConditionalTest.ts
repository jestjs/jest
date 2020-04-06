/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

import semver = require('semver');

export function isJestCircusRun(): boolean {
  return process.env.JEST_CIRCUS === '1';
}

export function skipSuiteOnJasmine(): void {
  if (!isJestCircusRun()) {
    test.only('does not work on Jasmine', () => {
      console.warn('[SKIP] Does not work on Jasmine');
    });
  }
}

export function skipSuiteOnJestCircus(): void {
  if (isJestCircusRun()) {
    test.only('does not work on jest-circus', () => {
      console.warn('[SKIP] Does not work on jest-circus');
    });
  }
}

export function skipSuiteOnWindows(): void {
  if (process.platform === 'win32') {
    test.only('does not work on Windows', () => {
      console.warn('[SKIP] Does not work on Windows');
    });
  }
}

export function onNodeVersions(
  versionRange: string,
  testBody: () => void,
): void {
  const description = `on node ${versionRange}`;
  if (!semver.satisfies(process.versions.node, versionRange)) {
    describe.skip(description, () => {
      testBody();
    });
  } else {
    describe(description, () => {
      testBody();
    });
  }
}

/* eslint-enable */
