/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  resolveSnapshotPath: (testPath, snapshotExtension) =>
    testPath.replace('__tests__', '__snapshots__') + snapshotExtension,

  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
    snapshotFilePath
      .replace('__snapshots__', '__tests__')
      .slice(0, -snapshotExtension.length),

  testPathForConsistencyCheck: 'foo/__tests__/bar.test.js',
};
