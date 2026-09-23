/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {V8Coverage} from 'collect-v8-coverage';
import * as fs from 'graceful-fs';
import {type FileCoverage, createFileCoverage} from 'istanbul-lib-coverage';
import {readInitialCoverage} from 'istanbul-lib-instrument';
import {createScriptTransformer, shouldInstrument} from '@jest/transform';
import type {Config} from '@jest/types';

type SingleV8Coverage = V8Coverage[number];

export type CoverageWorkerResult =
  | {
      kind: 'BabelCoverage';
      coverage: FileCoverage;
    }
  | {
      kind: 'EmptyCoverage';
      coverage: FileCoverage;
    }
  | {
      kind: 'V8Coverage';
      result: SingleV8Coverage;
    };

export default async function generateEmptyCoverage(
  source: string,
  filename: string,
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  changedFiles?: Set<string>,
  sourcesRelatedToTestsInChangedFiles?: Set<string>,
): Promise<CoverageWorkerResult | null> {
  const coverageOptions = {
    changedFiles,
    collectCoverage: globalConfig.collectCoverage,
    collectCoverageFrom: globalConfig.collectCoverageFrom,
    coverageProvider: globalConfig.coverageProvider,
    globalRootDir: globalConfig.rootDir,
    sourcesRelatedToTestsInChangedFiles,
  };
  let coverageWorkerResult: CoverageWorkerResult | null = null;
  if (shouldInstrument(filename, coverageOptions, config)) {
    const scriptTransformer = await createScriptTransformer(config);

    // Transform file with instrumentation to make sure initial coverage data is well mapped to original code.
    const {code} = await scriptTransformer.transformSourceAsync(
      filename,
      source,
      {
        instrument: true,
        supportsDynamicImport: true,
        supportsExportNamespaceFrom: true,
        supportsStaticESM: true,
        supportsTopLevelAwait: true,
      },
    );
    // TODO: consider passing AST
    const extracted = readInitialCoverage(code);

    if (coverageOptions.coverageProvider === 'v8') {
      // Transforming can erase all statements from a file, e.g. a TypeScript file that
      // only exports types. Such a file cannot be executed, so it should not be reported
      // as untested code: V8 never sees it and the fabricated report below would mark
      // lines of code that never exist as uncovered. Report it with no statements
      // instead, which is what the `babel` coverage provider does for the same file.
      if (
        extracted &&
        Object.keys(extracted.coverageData.statementMap).length === 0
      ) {
        return {
          coverage: createFileCoverage(extracted.coverageData),
          kind: 'EmptyCoverage',
        };
      }

      const stat = fs.statSync(filename);
      return {
        kind: 'V8Coverage',
        result: {
          functions: [
            {
              functionName: '(empty-report)',
              isBlockCoverage: true,
              ranges: [
                {
                  count: 0,
                  endOffset: stat.size,
                  startOffset: 0,
                },
              ],
            },
          ],
          scriptId: '0',
          url: filename,
        },
      };
    }

    // Check extracted initial coverage is not null, this can happen when using /* istanbul ignore file */
    if (extracted) {
      coverageWorkerResult = {
        coverage: createFileCoverage(extracted.coverageData),
        kind: 'BabelCoverage',
      };
    }
  }
  return coverageWorkerResult;
}
