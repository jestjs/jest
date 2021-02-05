test('inline snapshots', () =>
expect({apple: 'updated value'}).toMatchInlineSnapshot(`
  Object {
    "apple": "original value",
  }
`));