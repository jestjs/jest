/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import SnapshotState from '../State';

type RetryableSnapshotState = {
  _inlineSnapshots: Array<unknown>;
  getRetryCheckpoint: () => {restore: () => void};
};

test('restores snapshot state to a describe retry checkpoint', () => {
  const state = new SnapshotState(
    path.join(__dirname, '__does_not_exist__.snap'),
    {
      rootDir: __dirname,
      snapshotFormat: {},
      updateSnapshot: 'new',
    },
  );
  const retryState = state as unknown as RetryableSnapshotState;

  const first = state.match({
    isInline: false,
    received: 'first',
    testName: 'test',
  });
  const checkpoint = retryState.getRetryCheckpoint();

  state.match({
    isInline: false,
    received: 'discarded',
    testName: 'test',
  });
  state.unmatched = 2;
  checkpoint.restore();

  const retried = state.match({
    isInline: false,
    received: 'retried',
    testName: 'test',
  });

  expect(first).toMatchObject({count: 1, pass: true});
  expect(retried).toMatchObject({count: 2, pass: true});
  expect(state.added).toBe(2);
  expect(state.unmatched).toBe(0);
});

test('clears only inline snapshots owned by the retried test', () => {
  const state = new SnapshotState(
    path.join(__dirname, '__does_not_exist__.snap'),
    {
      rootDir: __dirname,
      snapshotFormat: {},
      updateSnapshot: 'new',
    },
  );
  const retryState = state as unknown as RetryableSnapshotState;
  const addInlineSnapshot = (
    received: string,
    line: number,
    testRetryId?: string,
  ) => {
    const inlineError = new Error('inline snapshot callsite');
    inlineError.stack = `Error: inline snapshot callsite\n    at Object.<anonymous> (/tmp/inline-snapshot-test.ts:${line}:1)`;
    state.match({
      error: inlineError,
      inlineSnapshot: undefined,
      isInline: true,
      received,
      testName: testRetryId ?? 'hook',
      testRetryId,
    });
  };

  addInlineSnapshot('discarded', 1, 'retried test');
  addInlineSnapshot('other test', 2, 'other test');
  addInlineSnapshot('hook', 3);

  expect(retryState._inlineSnapshots).toHaveLength(3);
  state.clear('retried test');

  expect(state.added).toBe(0);
  expect(retryState._inlineSnapshots).toHaveLength(2);
  state.clear('other test');
  expect(retryState._inlineSnapshots).toHaveLength(1);
  state.clear();
  expect(retryState._inlineSnapshots).toHaveLength(0);
});
