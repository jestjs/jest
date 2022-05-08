test.todo('one the way');

test('quick passing test', () => {
  expect(10).toBe(10);
});

test('quick passing snapshot test', () => {
  expect('some thing').toMatchSnapshot();
});

test('quick failing snapshot test', () => {
  expect('another thing').toMatchSnapshot();
});

test.skip('quick skipped test', () => {
  expect(10).toBe(10);
});

test('quick failing test', () => {
  expect(10).toBe(1);
});

describe('nested', () => {
  test('failing test', () => {
    expect(abc).toBe(1);
  });
});
