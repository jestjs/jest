/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectNotAssignable, expectType} from 'tsd-lite';
import type {SnapshotResolver} from 'jest-snapshot';

// SnapshotResolver

const snapshotResolver: SnapshotResolver = {
  resolveSnapshotPath: (testPath, snapshotExtension) => {
    expectType<string>(testPath);
    expectType<string | undefined>(snapshotExtension);
    return 'snapshot/path';
  },

  resolveTestPath: (snapshotPath, snapshotExtension) => {
    expectType<string>(snapshotPath);
    expectType<string | undefined>(snapshotExtension);
    return 'test/path';
  },

  testPathForConsistencyCheck: 'test/path/example',
};

// resolveSnapshotPath

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: (testPath: string, snapshotExtension: boolean) =>
    'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: (testPath: boolean) => 'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => true,
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

// resolveTestPath

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: (snapshotPath: string, snapshotExtension: boolean) =>
    'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: (snapshotPath: boolean) => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => true,
  testPathForConsistencyCheck: 'test/path/example',
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  testPathForConsistencyCheck: 'test/path/example',
});

// testPathForConsistencyCheck

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: true,
});

expectNotAssignable<SnapshotResolver>({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => 'test/path',
});
