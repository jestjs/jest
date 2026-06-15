it('Satisfying inline assertion works', () => {
  const user = {age: 50, email: 'john4@gmail.com'};
  expect(user).toEqual({
    age: expect.satisfying(n => n >= 18),
    email: expect.stringMatching(/@/),
  });
});
