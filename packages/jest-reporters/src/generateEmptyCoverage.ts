/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import {Config} from '@jest/types';
import {readInitialCoverage} from 'istanbul-lib-instrument';
import {FileCoverage, createFileCoverage} from 'istanbul-lib-coverage';
import {ScriptTransformer, shouldInstrument} from '@jest/transform';
import {V8Coverage} from '@jest/coverage';

type SingleV8Coverage = V8Coverage[number];

export type CoverageWorkerResult =
  | {
      coverage: FileCoverage;
      sourceMapPath?: string | null;
    }
  | SingleV8Coverage;

export default function(
  source: string,
  filename: Config.Path,
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  changedFiles?: Set<Config.Path>,
): CoverageWorkerResult | null {
  const coverageOptions = {
    changedFiles,
    collectCoverage: globalConfig.collectCoverage,
    collectCoverageFrom: globalConfig.collectCoverageFrom,
    collectCoverageOnlyFrom: globalConfig.collectCoverageOnlyFrom,
    v8Coverage: globalConfig.v8Coverage,
  };
  let coverageWorkerResult: CoverageWorkerResult | null = null;
  if (shouldInstrument(filename, coverageOptions, config)) {
    if (coverageOptions.v8Coverage) {
      const stat = fs.statSync(filename);
      return {
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
      };
    }

    // Transform file with instrumentation to make sure initial coverage data is well mapped to original code.
    const {code, mapCoverage, sourceMapPath} = new ScriptTransformer(
      config,
    ).transformSource(filename, source, true);
    // TODO: consider passing AST
    const extracted = readInitialCoverage(code);
    // Check extracted initial coverage is not null, this can happen when using /* istanbul ignore file */
    if (extracted) {
      coverageWorkerResult = {
        coverage: createFileCoverage(extracted.coverageData),
        sourceMapPath: mapCoverage ? sourceMapPath : null,
      };
    }
  }
  return coverageWorkerResult;
}
