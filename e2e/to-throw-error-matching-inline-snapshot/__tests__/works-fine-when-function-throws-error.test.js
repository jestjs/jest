
    test('works fine when function throws error', () => {
      expect(() => {
        throw new Error('apple');
      })
        .toThrowErrorMatchingInlineSnapshot();
    });
  