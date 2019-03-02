describe('describe', () => {
  test('correct test def', () => {});

  Promise.resolve().then(() => {
    test('async definition inside describe', () => {});
    afterAll(() => {});
  });
});

Promise.resolve().then(() => {
  test('async definition outside describe', () => {});
  afterAll(() => {});
});
