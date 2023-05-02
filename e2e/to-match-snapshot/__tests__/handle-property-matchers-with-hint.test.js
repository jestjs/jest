test('handles property matchers with hint', () => {
  expect({createdAt: new Date()}).toMatchSnapshot(
    {createdAt: expect.any(Date)},
    'descriptive hint',
  );
});
