/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import getNoTestFound from './getNoTestFound';
import getNoTestFoundFailed from './getNoTestFoundFailed';
import getNoTestFoundPassWithNoTests from './getNoTestFoundPassWithNoTests';
import getNoTestFoundRelatedToChangedFiles from './getNoTestFoundRelatedToChangedFiles';
import getNoTestFoundVerbose from './getNoTestFoundVerbose';
import type {TestRunData} from './types';

export default function getNoTestsFoundMessage(
  testRunData: TestRunData,
  globalConfig: Config.GlobalConfig,
): {exitWith0: boolean; message: string} {
  const exitWith0 =
    globalConfig.passWithNoTests ||
    globalConfig.lastCommit ||
    globalConfig.onlyChanged;

  if (globalConfig.onlyFailures) {
    return {exitWith0, message: getNoTestFoundFailed(globalConfig)};
  }
  if (globalConfig.onlyChanged) {
    return {
      exitWith0,
      message: getNoTestFoundRelatedToChangedFiles(globalConfig),
    };
  }
  if (globalConfig.passWithNoTests) {
    return {exitWith0, message: getNoTestFoundPassWithNoTests()};
  }
  return {
    exitWith0,
    message:
      testRunData.length === 1 || globalConfig.verbose
        ? getNoTestFoundVerbose(testRunData, globalConfig, exitWith0)
        : getNoTestFound(testRunData, globalConfig, exitWith0),
  };
}
