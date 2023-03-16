const { toMatchInlineSnapshot } = require('jest-snapshot');
expect.extend({
  toMatchCustomInlineSnapshot(received, ...args) {
    return toMatchInlineSnapshot.call(this, received, ...args);
  }
});
test('inline snapshots', () => {
  expect({apple: "original value"}).toMatchCustomInlineSnapshot();
});