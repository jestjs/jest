import getNoTestFound from './get_no_test_found';
import getNoTestFoundRelatedToChangedFiles from './get_no_test_found_related_to_changed_files';
import getNoTestFoundVerbose from './get_no_test_found_verbose';

export default function getNoTestsFoundMessage(
  testRunData,
  globalConfig,
): string {
  if (globalConfig.onlyChanged) {
    return getNoTestFoundRelatedToChangedFiles(globalConfig);
  }
  return testRunData.length === 1 || globalConfig.verbose
    ? getNoTestFoundVerbose(testRunData, globalConfig)
    : getNoTestFound(testRunData, globalConfig);
}
