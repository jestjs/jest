/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is here to make it possible to avoid huge dependency trees just for types
export declare namespace TestResult {
  export type Milliseconds = number;

  export type Status =
    | 'passed'
    | 'failed'
    | 'skipped'
    | 'pending'
    | 'todo'
    | 'disabled';

  export type Callsite = {
    column: number;
    line: number;
  };

  export type AssertionResult = {
    ancestorTitles: Array<string>;
    duration?: Milliseconds | null;
    failureDetails: Array<unknown>;
    failureMessages: Array<string>;
    fullName: string;
    invocations?: number;
    location?: Callsite | null;
    numPassingAsserts: number;
    retryReasons?: Array<string>;
    status: Status;
    title: string;
  };

  export type SerializableError = {
    code?: unknown;
    message: string;
    stack: string | null | undefined;
    type?: string;
  };
}
