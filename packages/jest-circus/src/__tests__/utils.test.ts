import {runTest} from '../__mocks__/testUtils';

test('makeTestResults does not thrown a stack overflow exception', () => {
  let testString = 'describe("top level describe", () => {';
  const numberOfTestBlocks = 150_000;
  let currentTestIndex = 0;

  while (currentTestIndex < numberOfTestBlocks) {
    testString += `test("should do something #${currentTestIndex++}", () => {});`;
  }

  testString += '})';

  const {stdout} = runTest(testString);

  expect(stdout).toMatchSnapshot();
});
