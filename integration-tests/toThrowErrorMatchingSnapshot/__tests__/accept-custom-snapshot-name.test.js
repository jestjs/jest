test('accepts custom snapshot name', () => {
  expect(() => {
    throw new Error('apple');
  }).toThrowErrorMatchingSnapshot('custom-name');
});
