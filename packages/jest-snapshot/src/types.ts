/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Config} from '@jest/types';

export type SnapshotResolver = {
  testPathForConsistencyCheck: string;
  resolveSnapshotPath(testPath: Config.Path, extension?: string): Config.Path;
  resolveTestPath(snapshotPath: Config.Path, extension?: string): Config.Path;
};

export type SnapshotData = {[key: string]: string};
