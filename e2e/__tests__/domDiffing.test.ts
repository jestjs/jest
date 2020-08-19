import runJest from '../runJest';
import {replaceTime} from '../Utils';

test('should work without error', () => {
  const output = runJest('dom-diffing');
  expect(output.failed).toBe(true);
  expect(replaceTime(output.stderr)).toMatchSnapshot();
});
