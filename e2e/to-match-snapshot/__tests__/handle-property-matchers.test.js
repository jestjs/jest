test('handles property matchers', () => {
  expect({createdAt: new Date()}).toMatchSnapshot({createdAt: expect.any(Date)});
});