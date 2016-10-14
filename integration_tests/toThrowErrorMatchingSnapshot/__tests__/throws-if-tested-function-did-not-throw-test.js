test('throws the error if tested function did not throw error', () => {
      expect(() => {}).toThrowErrorMatchingSnapshot();
    });
    