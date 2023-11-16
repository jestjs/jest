/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test, TestContext} from '@jest/test-result';

export type Stats = {
  roots: number;
  testMatch: number;
  testPathIgnorePatterns: number;
  testRegex: number;
  testPathPatterns?: number;
};

export type TestRunData = Array<{
  context: TestContext;
  matches: {
    allTests: number;
    tests: Array<Test>;
    total?: number;
    stats?: Stats;
  };
}>;

export type TestPathCases = Array<{
  stat: keyof Stats;
  isMatch: (path: string) => boolean;
}>;

export type TestPathCasesWithPathPattern = TestPathCases & {
  testPathPatterns: (path: string) => boolean;
};

export type Filter = (testPaths: Array<string>) => Promise<{
  filtered: Array<string>;
}>;
