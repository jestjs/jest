/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type Status =
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'pending'
  | 'todo'
  | 'disabled'
  | 'focused';

type Callsite = {
  column: number;
  line: number;
};

// this is here to make it possible to avoid huge dependency trees just for types
export type AssertionResult = {
  ancestorTitles: Array<string>;
  duration?: number | null;
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
