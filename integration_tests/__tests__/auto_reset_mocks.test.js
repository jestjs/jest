const runJest = require('../runJest');

test('suite with auto-reset', () => {
  const result = runJest('auto-reset-mocks/with-auto-reset');
  expect(result.status).toBe(0);
});

test('suite without auto-reset', () => {
  const result = runJest('auto-reset-mocks/without-auto-reset');
  expect(result.status).toBe(0);
});
