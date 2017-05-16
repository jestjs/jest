const runJest = require('../runJest');
const {extractSummary} = require('../utils');

test('moduleNameMapper wrong configuration', () => {
  const {stderr, status} = runJest('moduleNameMapper-wrong-config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper correct configuration', () => {
  const {stderr, status} = runJest('moduleNameMapper-correct-config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
});
