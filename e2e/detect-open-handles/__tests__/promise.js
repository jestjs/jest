test('something', () => {
  // eslint-disable-next-line no-new
  new Promise(() => {});
  expect(true).toBe(true);
});
