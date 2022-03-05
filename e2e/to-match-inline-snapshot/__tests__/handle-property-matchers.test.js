test('handles property matchers', () => {
  expect({createdAt: new Date()}).toMatchInlineSnapshot({
    createdAt: expect.any(Date),
  });
});
