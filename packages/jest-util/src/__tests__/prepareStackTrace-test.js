const error = new Error('error name');

const namedFunction = () => {
  throw error;
};

test('named function', () => {
  expect(() => namedFunction()).toThrowErrorMatchingSnapshot();
});
