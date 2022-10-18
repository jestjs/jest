/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {V8Coverage} from 'collect-v8-coverage';
import * as fs from 'graceful-fs';
import {shouldInstrument} from '@jest/transform';
import type {Config} from '@jest/types';

type SingleV8Coverage = V8Coverage[number];

export type CoverageWorkerResult = {
  kind: 'V8Coverage';
  result: SingleV8Coverage;
};

export default async function generateEmptyCoverage(
  filename: string,
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  changedFiles?: Set<string>,
  sourcesRelatedToTestsInChangedFiles?: Set<string>,
): Promise<CoverageWorkerResult | null> {
  if (
    shouldInstrument(
      filename,
      {
        changedFiles,
        collectCoverage: globalConfig.collectCoverage,
        collectCoverageFrom: globalConfig.collectCoverageFrom,
        sourcesRelatedToTestsInChangedFiles,
      },
      config,
    )
  ) {
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
                endOffset: fs.statSync(filename).size,
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
  return null;
}
