// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import getNoTestFound from './getNoTestFound';
import getNoTestFoundRelatedToChangedFiles from './getNoTestFoundRelatedToChangedFiles';
import getNoTestFoundVerbose from './getNoTestFoundVerbose';
import getNoTestFoundFailed from './getNoTestFoundFailed';

export default function getNoTestsFoundMessage(
  testRunData,
  globalConfig,
): string {
  if (globalConfig.onlyFailures) {
    return getNoTestFoundFailed();
  }
  if (globalConfig.onlyChanged) {
    return getNoTestFoundRelatedToChangedFiles(globalConfig);
  }
  return testRunData.length === 1 || globalConfig.verbose
    ? getNoTestFoundVerbose(testRunData, globalConfig)
    : getNoTestFound(testRunData, globalConfig);
}
