/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import {createTranspilingRequire} from '@jest/transform';
import type {Config} from '@jest/types';
import {interopRequireDefault} from 'jest-util';

export type SnapshotResolver = {
  /** Resolves from `testPath` to snapshot path. */
  resolveSnapshotPath(testPath: string, snapshotExtension?: string): string;
  /** Resolves from `snapshotPath` to test path. */
  resolveTestPath(snapshotPath: string, snapshotExtension?: string): string;
  /** Example test path, used for preflight consistency check of the implementation above. */
  testPathForConsistencyCheck: string;
};

export const EXTENSION = 'snap';
export const DOT_EXTENSION = `.${EXTENSION}`;

export const isSnapshotPath = (path: string): boolean =>
  path.endsWith(DOT_EXTENSION);

const cache = new Map<string, SnapshotResolver>();

type LocalRequire = (module: string) => unknown;

export const buildSnapshotResolver = async (
  config: Config.ProjectConfig,
  localRequire: Promise<LocalRequire> | LocalRequire = createTranspilingRequire(
    config,
  ),
): Promise<SnapshotResolver> => {
  const key = config.rootDir;

  const resolver =
    cache.get(key) ??
    (await createSnapshotResolver(await localRequire, config.snapshotResolver));

  cache.set(key, resolver);

  return resolver;
};

async function createSnapshotResolver(
  localRequire: LocalRequire,
  snapshotResolverPath?: string | null,
): Promise<SnapshotResolver> {
  return typeof snapshotResolverPath === 'string'
    ? createCustomSnapshotResolver(snapshotResolverPath, localRequire)
    : createDefaultSnapshotResolver();
}

function createDefaultSnapshotResolver(): SnapshotResolver {
  return {
    resolveSnapshotPath: (testPath: string) =>
      path.join(
        path.join(path.dirname(testPath), '__snapshots__'),
        path.basename(testPath) + DOT_EXTENSION,
      ),

    resolveTestPath: (snapshotPath: string) =>
      path.resolve(
        path.dirname(snapshotPath),
        '..',
        path.basename(snapshotPath, DOT_EXTENSION),
      ),

    testPathForConsistencyCheck: path.posix.join(
      'consistency_check',
      '__tests__',
      'example.test.js',
    ),
  };
}

async function createCustomSnapshotResolver(
  snapshotResolverPath: string,
  localRequire: LocalRequire,
): Promise<SnapshotResolver> {
  const custom: SnapshotResolver = interopRequireDefault(
    await localRequire(snapshotResolverPath),
  ).default;

  const keys: Array<[keyof SnapshotResolver, string]> = [
    ['resolveSnapshotPath', 'function'],
    ['resolveTestPath', 'function'],
    ['testPathForConsistencyCheck', 'string'],
  ];
  keys.forEach(([propName, requiredType]) => {
    if (typeof custom[propName] !== requiredType) {
      throw new TypeError(mustImplement(propName, requiredType));
    }
  });

  const customResolver: SnapshotResolver = {
    resolveSnapshotPath: (testPath: string) =>
      custom.resolveSnapshotPath(testPath, DOT_EXTENSION),
    resolveTestPath: (snapshotPath: string) =>
      custom.resolveTestPath(snapshotPath, DOT_EXTENSION),
    testPathForConsistencyCheck: custom.testPathForConsistencyCheck,
  };

  verifyConsistentTransformations(customResolver);

  return customResolver;
}

function mustImplement(propName: string, requiredType: string) {
  return `${chalk.bold(
    `Custom snapshot resolver must implement a \`${propName}\` as a ${requiredType}.`,
  )}\nDocumentation: https://jestjs.io/docs/configuration#snapshotresolver-string`;
}

function verifyConsistentTransformations(custom: SnapshotResolver) {
  const resolvedSnapshotPath = custom.resolveSnapshotPath(
    custom.testPathForConsistencyCheck,
  );
  const resolvedTestPath = custom.resolveTestPath(resolvedSnapshotPath);
  if (resolvedTestPath !== custom.testPathForConsistencyCheck) {
    throw new Error(
      chalk.bold(
        `Custom snapshot resolver functions must transform paths consistently, i.e. expects resolveTestPath(resolveSnapshotPath('${custom.testPathForConsistencyCheck}')) === ${resolvedTestPath}`,
      ),
    );
  }
}
