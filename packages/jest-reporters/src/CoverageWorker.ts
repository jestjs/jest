/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import exit = require('exit');
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import generateEmptyCoverage, {
  CoverageWorkerResult,
} from './generateEmptyCoverage';
import type {ReporterContext} from './types';

type SerializeSet<T> = T extends Set<infer U> ? Array<U> : T;

type CoverageReporterContext = Pick<
  ReporterContext,
  'changedFiles' | 'sourcesRelatedToTestsInChangedFiles'
>;

type CoverageReporterSerializedContext = {
  [K in keyof CoverageReporterContext]: SerializeSet<ReporterContext[K]>;
};

export type CoverageWorkerData = {
  config: Config.ProjectConfig;
  context: CoverageReporterSerializedContext;
  globalConfig: Config.GlobalConfig;
  path: string;
};

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  exit(1);
});

export function worker({
  config,
  globalConfig,
  path,
  context,
}: CoverageWorkerData): Promise<CoverageWorkerResult | null> {
  return generateEmptyCoverage(
    fs.readFileSync(path, 'utf8'),
    path,
    globalConfig,
    config,
    context.changedFiles && new Set(context.changedFiles),
    context.sourcesRelatedToTestsInChangedFiles &&
      new Set(context.sourcesRelatedToTestsInChangedFiles),
  );
}
