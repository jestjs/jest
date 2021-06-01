import runJest from '../runJest';

// https://jestjs.io/docs/configuration#testenvironment-string
test('jsdom is the default testEnvironment', () => {
  const result = runJest('configuration-defaults');
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toMatch('PASS __tests__/environment-jsdom.test.js');
});
