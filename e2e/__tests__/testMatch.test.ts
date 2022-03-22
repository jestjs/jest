import {extractSummary} from '../Utils';
import runJest from '../runJest';

it('testMatch should able to match file with cjs and mjs extension', () => {
  const result = runJest('test-match');
  expect(result.exitCode).toBe(0);
  const {summary} = extractSummary(result.stderr);
  expect(summary).toMatchSnapshot();
});
