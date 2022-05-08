test('failing snapshot example', () => {
  expect('nothing').toMatchSnapshot();
});

describe('nested', () => {
  test('failing example', () => {
    expect(10).toBe(1);
  });
});
