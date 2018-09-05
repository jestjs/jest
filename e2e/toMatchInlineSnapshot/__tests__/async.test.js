
    test('inline snapshots', async () => {
      await 'next tick';
      expect(42).toMatchInlineSnapshot();
    });
  