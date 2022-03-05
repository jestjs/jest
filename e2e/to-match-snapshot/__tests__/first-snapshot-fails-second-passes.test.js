test('snapshots', () => {
  expect('apple').toMatchSnapshot();
  expect('banana').toMatchSnapshot();
});
