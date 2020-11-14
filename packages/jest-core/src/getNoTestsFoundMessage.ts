/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
): string {
  if (globalConfig.onlyFailures) {
    return getNoTestFoundFailed(globalConfig);
  }
  if (globalConfig.onlyChanged) {
    return getNoTestFoundRelatedToChangedFiles(globalConfig);
  }
  if (globalConfig.passWithNoTests) {
    return getNoTestFoundPassWithNoTests();
  }
  return testRunData.length === 1 || globalConfig.verbose
    ? getNoTestFoundVerbose(testRunData, globalConfig)
    : getNoTestFound(testRunData, globalConfig);
}
