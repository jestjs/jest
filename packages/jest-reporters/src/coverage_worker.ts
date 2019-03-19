/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import {Config} from '@jest/types';
import exit from 'exit';
import {CoverageReporterSerializedOptions} from './types';

import generateEmptyCoverage, {
  CoverageWorkerResult,
} from './generateEmptyCoverage';

export type CoverageWorkerData = {
  globalConfig: Config.GlobalConfig;
  config: Config.ProjectConfig;
  path: Config.Path;
  options?: CoverageReporterSerializedOptions;
};

export {CoverageWorkerResult};

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  exit(1);
});

export function worker({
  config,
  globalConfig,
  path,
  options,
}: CoverageWorkerData): CoverageWorkerResult | null {
  return generateEmptyCoverage(
    fs.readFileSync(path, 'utf8'),
    path,
    globalConfig,
    config,
    options && options.changedFiles && new Set(options.changedFiles),
  );
}
