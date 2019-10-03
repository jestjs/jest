import {Circus} from '@jest/types';
import {TestCase, TestCaseResult} from '@jest/test-result';
import {makeSingleTestResult, parseSingleTestResult} from './utils';

const testCaseReportHandler = (
  testPath: string,
  sendMessageToJest: Function,
) => (event: Circus.Event) => {
  switch (event.name) {
    case 'test_done': {
      const testResult = makeSingleTestResult(event.test);
      const testCaseResult: TestCaseResult = parseSingleTestResult(testResult);
      const testCase: TestCase = {
        ancestorTitles: testCaseResult.ancestorTitles,
        fullName: testCaseResult.fullName,
        location: testCaseResult.location,
        title: testCaseResult.title,
      };
      sendMessageToJest('test-case-result', [
        testPath,
        testCase,
        testCaseResult,
      ]);
      break;
    }
  }
};

export default testCaseReportHandler;
