/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

import {SourceTextModule, SyntheticModule} from 'node:vm';
import * as semver from 'semver';
import {describe, test} from '@jest/globals';

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

export function testWithVmEsm(
  ...args: Parameters<typeof test>
): ReturnType<typeof test> {
  const fn = typeof SyntheticModule === 'function' ? test : test.skip;
  return fn(...args);
}

export function testWithSyncEsm(
  ...args: Parameters<typeof test>
): ReturnType<typeof test> {
  const fn =
    // @ts-expect-error - hasAsyncGraph is in Node v24.9+, not yet typed
    typeof SourceTextModule?.prototype.hasAsyncGraph === 'function'
      ? test
      : test.skip;
  return fn(...args);
}

export function testWithLinkedSyntheticModule(
  ...args: Parameters<typeof test>
): ReturnType<typeof test> {
  const fn =
    // @ts-expect-error - linkRequests is in Node v22.21+/v24.8+, not yet typed
    typeof SourceTextModule?.prototype.linkRequests === 'function'
      ? test
      : test.skip;
  return fn(...args);
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
