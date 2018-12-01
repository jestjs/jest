test('handles property matchers with deep properties', () => {
  expect({user: {createdAt: new Date(), name: 'CHANGED'}}).toMatchSnapshot({
    user: {createdAt: expect.any(Date), name: 'CHANGED'},
  });
});
