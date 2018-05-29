test('snapshots are written to custom location', () => {
  expect('foobar').toMatchSnapshot();
});
