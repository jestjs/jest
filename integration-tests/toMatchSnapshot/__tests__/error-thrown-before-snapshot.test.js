test('snapshots', () => {
      expect(false).toBeTruthy();
      expect({a: "original"}).toMatchSnapshot();
    });