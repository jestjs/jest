/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {V8Coverage} from 'collect-v8-coverage';
import * as fs from 'graceful-fs';
import {FileCoverage, createFileCoverage} from 'istanbul-lib-coverage';
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
      kind: 'V8Coverage';
      result: SingleV8Coverage;
    };

export default async function (
  source: string,
  filename: Config.Path,
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  changedFiles?: Set<Config.Path>,
  sourcesRelatedToTestsInChangedFiles?: Set<Config.Path>,
): Promise<CoverageWorkerResult | null> {
  const coverageOptions = {
    changedFiles,
    collectCoverage: globalConfig.collectCoverage,
    collectCoverageFrom: globalConfig.collectCoverageFrom,
    collectCoverageOnlyFrom: globalConfig.collectCoverageOnlyFrom,
    coverageProvider: globalConfig.coverageProvider,
    sourcesRelatedToTestsInChangedFiles,
  };
  let coverageWorkerResult: CoverageWorkerResult | null = null;
  if (shouldInstrument(filename, coverageOptions, config)) {
    if (coverageOptions.coverageProvider === 'v8') {
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
