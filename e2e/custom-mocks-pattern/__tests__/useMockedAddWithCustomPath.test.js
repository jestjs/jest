jest.mock('add');

test('use mocked add method with custom path', () => {
  const result = require('add')(1, 1);
  expect(result).toBe(2);
});
