// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import type {ProjectConfig, Path} from 'types/Config';
import type {SnapshotResolver} from 'types/SnapshotResolver';
import chalk from 'chalk';
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
    throw new TypeError(mustImplement('resolveSnapshotPath'));
  }
  if (typeof custom.resolveTestPath !== 'function') {
    throw new TypeError(mustImplement('resolveTestPath'));
  }

  const customResolver = {
    resolveSnapshotPath: testPath =>
      custom.resolveSnapshotPath(testPath, DOT_EXTENSION),
    resolveTestPath: snapshotPath =>
      custom.resolveTestPath(snapshotPath, DOT_EXTENSION),
  };

  verifyConsistentTransformations(customResolver);

  return customResolver;
}

function mustImplement(functionName: string) {
  return (
    chalk.bold(
      `Custom snapshot resolver must implement a \`${functionName}\` function.`,
    ) +
    '\nDocumentation: https://facebook.github.io/jest/docs/en/configuration.html#snapshotResolver'
  );
}

function verifyConsistentTransformations(custom: SnapshotResolver) {
  const fakeTestPath = path.posix.join(
    'some-path',
    '__tests__',
    'snapshot_resolver.test.js',
  );
  const transformedPath = custom.resolveTestPath(
    custom.resolveSnapshotPath(fakeTestPath),
  );
  if (transformedPath !== fakeTestPath) {
    throw new Error(
      chalk.bold(
        `Custom snapshot resolver functions must transform paths consistently, i.e. expects resolveTestPath(resolveSnapshotPath('${fakeTestPath}')) === ${transformedPath}`,
      ),
    );
  }
}
