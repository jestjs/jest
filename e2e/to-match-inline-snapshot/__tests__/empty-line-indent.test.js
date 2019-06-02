test('inline snapshots', () => expect(`hello

world`).toMatchInlineSnapshot());
