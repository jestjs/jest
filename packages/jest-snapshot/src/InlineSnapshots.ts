/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import * as fs from 'graceful-fs';
import type {
  CustomParser as PrettierCustomParser,
  BuiltInParserName as PrettierParserName,
} from 'prettier-v2';
import {isError} from 'jest-util';
import type {InlineSnapshot} from './types';
import {
  groupSnapshotsByFile,
  processInlineSnapshotsWithBabel,
  processPrettierAst,
} from './utils';

type Prettier = typeof import('prettier-v2');
type WorkerFn = (
  prettierPath: string,
  filepath: string,
  sourceFileWithSnapshots: string,
  snapshotMatcherNames: Array<string>,
) => string;

const cachedPrettier = new Map<string, Prettier | WorkerFn>();

// Required on demand: this module loads in every test process, but semver and
// synckit are only needed when inline snapshots are written with prettier.
// Resolving outside the VM keeps the require native, which also exempts it
// from the runtime's between-tests require gate at snapshot-save time.
function semverGte(version: string, other: string): boolean {
  const semver = require(
    require.resolve('semver', {
      [Symbol.for('jest-resolve-outside-vm-option')]: true,
    }),
  ) as typeof import('semver');
  return semver.gte(version, other);
}

export function saveInlineSnapshots(
  snapshots: Array<InlineSnapshot>,
  rootDir: string,
  prettierPath: string | null,
): void {
  let prettier: Prettier | undefined = prettierPath
    ? (cachedPrettier.get(`module|${prettierPath}`) as Prettier)
    : undefined;
  let workerFn: WorkerFn | undefined = prettierPath
    ? (cachedPrettier.get(`worker|${prettierPath}`) as WorkerFn)
    : undefined;
  if (prettierPath && !prettier) {
    try {
      prettier = require(
        require.resolve(prettierPath, {
          [Symbol.for('jest-resolve-outside-vm-option')]: true,
        }),
      ) as Prettier;

      cachedPrettier.set(`module|${prettierPath}`, prettier);

      if (semverGte(prettier.version, '3.0.0')) {
        const {createSyncFn} = require(
          require.resolve('synckit', {
            [Symbol.for('jest-resolve-outside-vm-option')]: true,
          }),
        ) as typeof import('synckit');
        workerFn = createSyncFn(
          require.resolve(/*webpackIgnore: true*/ './worker'),
        ) as WorkerFn;
        cachedPrettier.set(`worker|${prettierPath}`, workerFn);
      }
    } catch (error) {
      if (!isError(error)) {
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
    } else if (prettier && semverGte(prettier.version, '1.5.0')) {
      newSourceFile = runPrettier(
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

const runPrettier = (
  prettier: Prettier,
  sourceFilePath: string,
  sourceFileWithSnapshots: string,
  snapshotMatcherNames: Array<string>,
) => {
  // Resolve project configuration.
  // For older versions of Prettier, do not load configuration.
  const config = prettier.resolveConfig
    ? prettier.resolveConfig.sync(sourceFilePath, {editorconfig: true})
    : null;

  // Prioritize parser found in the project config.
  // If not found detect the parser for the test file.
  // For older versions of Prettier, fallback to a simple parser detection.
  // @ts-expect-error - `inferredParser` is `string`
  const inferredParser: PrettierParserName | null | undefined =
    (typeof config?.parser === 'string' && config.parser) ||
    (prettier.getFileInfo
      ? prettier.getFileInfo.sync(sourceFilePath).inferredParser
      : simpleDetectParser(sourceFilePath));

  if (!inferredParser) {
    throw new Error(
      `Could not infer Prettier parser for file ${sourceFilePath}`,
    );
  }

  // Snapshots have now been inserted. Run prettier to make sure that the code is
  // formatted, except snapshot indentation. Snapshots cannot be formatted until
  // after the initial format because we don't know where the call expression
  // will be placed (specifically its indentation), so we have to do two
  // prettier.format calls back-to-back.
  return prettier.format(
    prettier.format(sourceFileWithSnapshots, {
      ...config,
      filepath: sourceFilePath,
    }),
    {
      ...config,
      filepath: sourceFilePath,
      parser: createFormattingParser(snapshotMatcherNames, inferredParser),
    },
  );
};

// This parser formats snapshots to the correct indentation.
const createFormattingParser =
  (
    snapshotMatcherNames: Array<string>,
    inferredParser: PrettierParserName,
  ): PrettierCustomParser =>
  (text, parsers, options) => {
    // Workaround for https://github.com/prettier/prettier/issues/3150
    options.parser = inferredParser;

    const ast = parsers[inferredParser](text, options);
    processPrettierAst(ast, options, snapshotMatcherNames);

    return ast;
  };

const simpleDetectParser = (filePath: string): PrettierParserName => {
  const extname = path.extname(filePath);
  if (/\.tsx?$/.test(extname)) {
    return 'typescript';
  }
  return 'babel';
};
