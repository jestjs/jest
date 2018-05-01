describe('.test.only.each', () => {
  test.only.each([[0, 0, 0], [1, 1, 2], [5, 10, 15]])(
    'returns result of adding %s to %s',
    (a, b, expected) => {
      expect(a + b).toBe(expected);
    },
  );
});
