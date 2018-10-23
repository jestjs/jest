// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import type {Path} from './Config';

export type SnapshotResolver = {|
  resolveSnapshotPath(testPath: Path): Path,
  resoveTestPath(snapshotPath: Path): Path,
|};
