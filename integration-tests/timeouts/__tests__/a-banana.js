
      jest.setTimeout(20);

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      });
    