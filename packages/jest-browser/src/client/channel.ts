/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface TesterCleanupEvent {
  event: 'cleanup';
  sessionId: string;
}

export interface TesterExecuteEvent {
  event: 'execute';
  sessionId: string;
  testFiles: Array<string>;
}

export interface TesterPrepareEvent {
  event: 'prepare';
  sessionId: string;
}

export type TesterChannelEvent =
  | TesterCleanupEvent
  | TesterExecuteEvent
  | TesterPrepareEvent;
