import type {Path} from './Config';

export type SnapshotResolver = {|
  resolveSnapshotPath(testPath: Path): Path,
  resoveTestPath(snapshotPath: Path): Path,
|};
