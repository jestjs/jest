/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import type {SnapshotResolver} from 'jest-snapshot';

// SnapshotResolver

const snapshotResolver: SnapshotResolver = {
  resolveSnapshotPath: (testPath, snapshotExtension) => {
    expect(testPath).type.toBeString();
    expect(snapshotExtension).type.toBe<string | undefined>();
    return 'snapshot/path';
  },

  resolveTestPath: (snapshotPath, snapshotExtension) => {
    expect(snapshotPath).type.toBeString();
    expect(snapshotExtension).type.toBe<string | undefined>();
    return 'test/path';
  },

  testPathForConsistencyCheck: 'test/path/example',
};

// resolveSnapshotPath

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: (testPath: string, snapshotExtension: boolean) =>
    'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: (testPath: boolean) => 'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => true,
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

// resolveTestPath

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: (snapshotPath: string, snapshotExtension: boolean) =>
    'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: (snapshotPath: boolean) => 'test/path',
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => true,
  testPathForConsistencyCheck: 'test/path/example',
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  testPathForConsistencyCheck: 'test/path/example',
});

// testPathForConsistencyCheck

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => 'test/path',
  testPathForConsistencyCheck: true,
});

expect<SnapshotResolver>().type.not.toBeAssignableWith({
  resolveSnapshotPath: () => 'snapshot/path',
  resolveTestPath: () => 'test/path',
});
