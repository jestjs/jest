test('updates existing snapshot', () => {
  expect(() => {
    throw new Error('apple');
  })
    .toThrowErrorMatchingInlineSnapshot(`"banana"`);
});