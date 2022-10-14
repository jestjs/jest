/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import semver = require('semver');
import type {Global} from '@jest/types';

declare const describe: Global.TestFrameworkGlobals['describe'];
declare const test: Global.TestFrameworkGlobals['test'];

export function isJestJasmineRun(): boolean {
  return process.env.JEST_JASMINE === '1';
}

export function skipSuiteOnJasmine(): void {
  if (isJestJasmineRun()) {
    test.only('does not work on Jasmine', () => {
      console.warn('[SKIP] Does not work on Jasmine');
    });
  }
}

export function skipSuiteOnJestCircus(): void {
  if (!isJestJasmineRun()) {
    test.only('does not work on jest-circus', () => {
      console.warn('[SKIP] Does not work on jest-circus');
    });
  }
}

export function onNodeVersions(
  versionRange: string,
  testBody: () => void,
): void {
  const description = `on node ${versionRange}`;
  if (semver.satisfies(process.versions.node, versionRange)) {
    describe(description, () => {
      testBody();
    });
  } else {
    describe.skip(description, () => {
      testBody();
    });
  }
}
