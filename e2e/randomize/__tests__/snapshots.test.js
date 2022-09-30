it.each([1, 2, 3])('test%d', n => {
  expect(n).toMatchSnapshot();
});

describe.each([1, 2])('describe%d', () => {
  it.each([4, 5, 6])('test%d', n => {
    expect(n).toMatchSnapshot();
  });
});

describe('describe3', () => {
  it.each([10, 11, 12])('test%d', n => {
    expect(n).toMatchSnapshot();
  });

  describe('describe4', () => {
    it.each([13, 14, 15])('test%d', n => {
      expect(n).toMatchSnapshot();
    });
  });
});
