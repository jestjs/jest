// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

import {Config} from '@jest/types';

export type SnapshotResolver = {
  testPathForConsistencyCheck: string;
  resolveSnapshotPath(testPath: Config.Path, extension?: string): Config.Path;
  resolveTestPath(snapshotPath: Config.Path, extension?: string): Config.Path;
};
