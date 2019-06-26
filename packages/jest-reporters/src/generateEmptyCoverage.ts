/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {readInitialCoverage} from 'istanbul-lib-instrument';
import {createFileCoverage} from 'istanbul-lib-coverage';
import {shouldInstrument, ScriptTransformer} from '@jest/transform';

export type CoverageWorkerResult = {
  coverage: any;
  sourceMapPath?: string | null;
};

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
  };
  let coverageWorkerResult: CoverageWorkerResult | null = null;
  if (shouldInstrument(filename, coverageOptions, config)) {
    // Transform file with instrumentation to make sure initial coverage data is well mapped to original code.
    const {code, mapCoverage, sourceMapPath} = new ScriptTransformer(
      config,
    ).transformSource(filename, source, true);
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
