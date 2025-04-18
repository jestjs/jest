/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {types} from 'util';
import * as fs from 'graceful-fs';
import semver = require('semver');
import {runPrettier, runPrettier2} from './prettier';
import type {InlineSnapshot} from './types';
import {groupSnapshotsByFile, processInlineSnapshotsWithBabel} from './utils';

type Prettier = typeof runPrettier;
type Prettier2 = typeof import('prettier-v2');

const cachedPrettier = new Map<string, Prettier | Prettier2>();

export function saveInlineSnapshots(
  snapshots: Array<InlineSnapshot>,
  rootDir: string,
  prettierPath: string | null,
): void {
  let prettier: Prettier2 | undefined = prettierPath
    ? (cachedPrettier.get(`module|${prettierPath}`) as Prettier2)
    : undefined;
  let workerFn: Prettier | undefined = prettierPath
    ? (cachedPrettier.get(`worker|${prettierPath}`) as Prettier)
    : undefined;
  if (prettierPath && !prettier) {
    try {
      prettier =
        // @ts-expect-error requireOutside
        requireOutside(prettierPath) as Prettier2;
      cachedPrettier.set(`module|${prettierPath}`, prettier);

      if (semver.gte(prettier.version, '3.0.0')) {
        workerFn = runPrettier;
        cachedPrettier.set(`worker|${prettierPath}`, workerFn);
      }
    } catch (error) {
      if (!types.isNativeError(error)) {
        throw error;
      }

      if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }

  const snapshotsByFile = groupSnapshotsByFile(snapshots);

  for (const sourceFilePath of Object.keys(snapshotsByFile)) {
    const {sourceFileWithSnapshots, snapshotMatcherNames, sourceFile} =
      processInlineSnapshotsWithBabel(
        snapshotsByFile[sourceFilePath],
        sourceFilePath,
        rootDir,
      );

    let newSourceFile = sourceFileWithSnapshots;

    if (workerFn) {
      newSourceFile = workerFn(
        prettierPath!,
        sourceFilePath,
        sourceFileWithSnapshots,
        snapshotMatcherNames,
      );
    } else if (prettier && semver.gte(prettier.version, '1.5.0')) {
      newSourceFile = runPrettier2(
        prettier,
        sourceFilePath,
        sourceFileWithSnapshots,
        snapshotMatcherNames,
      );
    }

    if (newSourceFile !== sourceFile) {
      fs.writeFileSync(sourceFilePath, newSourceFile);
    }
  }
}
