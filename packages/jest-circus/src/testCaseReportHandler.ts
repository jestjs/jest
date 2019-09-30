import {Circus} from '@jest/types';
import {messageParent} from 'jest-worker';
import {TestCase} from '@jest/test-result';
import {makeSingleTestResult, parseSingleTestResult} from './utils';

const testCaseReportHandler = (
  testPath: string,
  parentProcess: NodeJS.Process,
) => (event: Circus.Event) => {
  switch (event.name) {
    case 'test_done': {
      const testResult = makeSingleTestResult(event.test);
      const testCaseResult = parseSingleTestResult(testResult);
      const testCase: TestCase = {
        fullName: testCaseResult.fullName,
        location: testCaseResult.location,
        title: testCaseResult.title,
        ancestorTitles: testCaseResult.ancestorTitles,
      };
      messageParent(
        ['test-case-result', [testPath, testCase, testCaseResult]],
        parentProcess,
      );
      break;
    }
  }
};

export default testCaseReportHandler;
