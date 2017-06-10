/**
 * @flow
 */

import type {
    AggregatedResult,
} from 'types/TestResult';


function getFailedSnapshotTests(testResults: AggregatedResult) {
    const res = [];
    if (testResults.numFailedTests === 0) {
        return res;
    }

    testResults.testResults.forEach(testResult => {
        if (testResult.snapshot.unmatched) {
             res.push(testResult.testFilePath);
        }
    });

    return res;
}

module.exports = getFailedSnapshotTests;