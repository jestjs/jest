const { toMatchInlineSnapshot } = require('jest-snapshot');
expect.extend({
  toMatchCustomInlineSnapshot(received, ...args) {
    return toMatchInlineSnapshot.call(this, received, ...args);
  },
  toMatchCustomInlineSnapshot2(received, ...args) {
    return toMatchInlineSnapshot.call(this, received, ...args);
  },
});
test('inline snapshots', () => {
  expect({apple: "value 1"}).toMatchCustomInlineSnapshot();
  expect({apple: "value 2"}).toMatchInlineSnapshot();
  expect({apple: "value 3"}).toMatchCustomInlineSnapshot2();
  expect({apple: "value 4"}).toMatchInlineSnapshot();
});