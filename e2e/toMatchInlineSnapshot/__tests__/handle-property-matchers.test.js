test('handles property matchers', () => {
  expect({createdAt: 'string'}).toMatchInlineSnapshot(
    {createdAt: expect.any(String)},
    `
Object {
  "createdAt": Any<Date>,
}
`
  );
});
