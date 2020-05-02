/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Context} from 'jest-runtime';
import type {Test} from 'jest-runner';
import type {Config} from '@jest/types';

export type Stats = {
  roots: number;
  testMatch: number;
  testPathIgnorePatterns: number;
  testRegex: number;
  testPathPattern?: number;
};

export type TestRunData = Array<{
  context: Context;
  matches: {
    allTests: number;
    tests: Array<Test>;
    total?: number;
    stats?: Stats;
  };
}>;

export type TestPathCases = Array<{
  stat: keyof Stats;
  isMatch: (path: Config.Path) => boolean;
}>;

export type TestPathCasesWithPathPattern = TestPathCases & {
  testPathPattern: (path: Config.Path) => boolean;
};

export type FilterResult = {
  test: string;
  message: string;
};

export type Filter = (
  testPaths: Array<string>,
) => Promise<{
  filtered: Array<FilterResult>;
}>;
