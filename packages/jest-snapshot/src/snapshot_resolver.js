import type {ProjectConfig, Path} from 'types/Config';
import type {SnapshotResolver} from 'types/SnapshotResolver';
import path from 'path';

export const EXTENSION = 'snap';
export const DOT_EXTENSION = '.' + EXTENSION;

export const isSnapshotPath = (path: string): boolean =>
  path.endsWith(DOT_EXTENSION);

const cache: Map<Path, SnapshotResolver> = new Map();
export const buildSnapshotResolver = (
  config: ProjectConfig,
): SnapshotResolver => {
  const key = config.rootDir;
  if (!cache.has(key)) {
    cache.set(key, createSnapshotResolver(config.snapshotResolver));
  }
  return cache.get(key);
};

function createSnapshotResolver(snapshotResolverPath: ?Path): SnapshotResolver {
  return typeof snapshotResolverPath === 'string'
    ? createCustomSnapshotResolver(snapshotResolverPath)
    : {
        resolveSnapshotPath: (testPath: Path) =>
          path.join(
            path.join(path.dirname(testPath), '__snapshots__'),
            path.basename(testPath) + DOT_EXTENSION,
          ),

        resolveTestPath: (snapshotPath: Path) =>
          path.resolve(
            path.dirname(snapshotPath),
            '..',
            path.basename(snapshotPath, DOT_EXTENSION),
          ),
      };
}

function createCustomSnapshotResolver(
  snapshotResolverPath: Path,
): SnapshotResolver {
  const custom = (require(snapshotResolverPath): SnapshotResolver);

  if (typeof custom.resolveSnapshotPath !== 'function') {
    throw new TypeError(
      'snapshotResolver does not have a resolveSnapshotPath function',
    );
  }
  if (typeof custom.resolveTestPath !== 'function') {
    throw new TypeError(
      'snapshotResolver does not have a resolveTestPath function',
    );
  }

  return {
    resolveSnapshotPath: testPath =>
      custom.resolveSnapshotPath(testPath, DOT_EXTENSION),
    resolveTestPath: snapshotPath =>
      custom.resolveTestPath(snapshotPath, DOT_EXTENSION),
  };
}
