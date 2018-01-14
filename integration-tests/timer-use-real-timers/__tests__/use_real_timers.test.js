jest.useRealTimers();

test('bar', () => {
  jest.runAllTimers();
});
