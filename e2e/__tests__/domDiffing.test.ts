import runJest from '../runJest';
import {extractSortedSummary} from '../Utils';

test('should work without error', () => {
  const output = runJest('dom-diffing');
  console.log(extractSortedSummary(output.stderr));
  expect(output.failed).toBe(true);
  expect(output.stderr).toMatchSnapshot();
});
