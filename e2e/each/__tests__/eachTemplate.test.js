it.each([
  {something: {nested: 'value'}},
  {something: null},
  {something: undefined},
])('allows templating "$something.nested"', value => {
  expect(value).toBe(value);
});

it.each([{array: ['some value']}, {array: null}, {array: undefined}])(
  'allows templating "$array.length"',
  value => {
    expect(value).toBe(value);
  },
);
