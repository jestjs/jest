// Only runs if the name is exactly 'literal match'
test('literal match', () => {
  expect(true).toBe(true);
});

// Includes special character '*', useful for literal matching test
test('check * literal asterisk', () => {
  expect(1).toBe(1);
});

// Includes parentheses, used to test literal handling of regex-sensitive characters
test('special (characters)', () => {
  expect('value').toBe('value');
});
