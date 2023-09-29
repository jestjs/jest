test('passing snapshots', () => expect(1).toMatchInlineSnapshot(`1`));
describe('with retries', () => {
  let index = 0;
  afterEach(() => {
    index += 1;
  });
  jest.retryTimes(2);
  test('snapshots', () => expect(index).toMatchInlineSnapshot(`3`));
});