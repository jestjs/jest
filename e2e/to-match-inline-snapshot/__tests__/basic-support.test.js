test('inline snapshots', () =>
  expect({apple: 'original value'}).toMatchInlineSnapshot(`
    {
      "apple": "original value",
    }
  `));
