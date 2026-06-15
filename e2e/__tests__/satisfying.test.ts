import runJest from '../runJest';

test('satisfying', () => {
  const {exitCode} = runJest('satisfying');
  expect(exitCode).toBe(0);
});
