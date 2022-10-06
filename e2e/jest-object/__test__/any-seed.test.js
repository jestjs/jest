test('ensure seed exists', () => {
  expect(jest.getSeed()).toEqual(expect.any(Number));
});
