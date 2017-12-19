/**
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';

function getFailedSnapshotTests(testResults: AggregatedResult) {
  const failedTestPaths = [];
  if (testResults.numFailedTests === 0 || !testResults.testResults) {
    return failedTestPaths;
  }

  testResults.testResults.forEach(testResult => {
    if (testResult.snapshot && testResult.snapshot.unmatched) {
      failedTestPaths.push(testResult.testFilePath);
    }
  });

  return failedTestPaths;
}

export default getFailedSnapshotTests;
