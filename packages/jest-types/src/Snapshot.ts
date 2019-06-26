/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Path} from './Config';

export type SnapshotResolver = {
  testPathForConsistencyCheck: string;
  resolveSnapshotPath(testPath: Path, extension?: string): Path;
  resolveTestPath(snapshotPath: Path, extension?: string): Path;
};
