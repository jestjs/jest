it('Satisfying negation assertion works', () => {
  const isEmpty = x => x.length === 0;
  const value = [1, 2, 3];
  expect(value).toEqual(expect.not.satisfying(isEmpty));
});
