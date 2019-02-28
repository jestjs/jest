/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: Remove this when whole project is migrated

import {Path} from './Config';

type Tester = (a: any, b: any) => boolean | undefined;

export type MatcherState = {
  assertionCalls: number;
  currentTestName?: string;
  dontThrow?: () => void;
  error?: Error;
  equals: (
    a: unknown,
    b: unknown,
    customTesters?: Array<Tester>,
    strictCheck?: boolean,
  ) => boolean;
  expand?: boolean;
  expectedAssertionsNumber?: number;
  isExpectingAssertions?: boolean;
  isNot: boolean;
  promise: string;
  suppressedErrors: Array<Error>;
  testPath?: Path;
  // This is output from `jest-matcher-utils` plus iterableEquality, subsetEquality
  // Type it correctly when moving it to `expect`
  utils: {
    printExpected: (value: unknown) => string;
    printReceived: (value: unknown) => string;
    iterableEquality: Tester;
    subsetEquality: Tester;
  };
};
