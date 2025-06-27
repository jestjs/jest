test('CR\r', () => {
  expect(1).toMatchSnapshot();
});

test('CRLF\r\n', () => {
  expect(2).toMatchSnapshot();
});

test('LF\n', () => {
  expect(3).toMatchSnapshot();
});
