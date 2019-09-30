import {Circus} from '@jest/types';
import {messageParent} from 'jest-worker';

const testCaseReportHandler = (
  testPath: string,
  parentProcess: NodeJS.Process,
) => (event: Circus.Event) => {
  switch (event.name) {
    case 'test_done': {
      const quickStats =
        event.test.errors.length === 0
          ? {
              testPath,
              numFailingTests: 0,
              numPassingTests: 1,
              numPendingTests: 0,
            }
          : {
              testPath,
              numFailingTests: 1,
              numPassingTests: 0,
              numPendingTests: 0,
            };
      messageParent(['test-case-result', [quickStats]], parentProcess);
      break;
    }
  }
};

export default testCaseReportHandler;
