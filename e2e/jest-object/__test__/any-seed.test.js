test('ensure seed exists', () => {
  expect(jest.getSeed()).toBe(expect.any(Number));
});
