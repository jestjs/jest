const {expect} = require('expect');

expect.extend({
  toPass(received, expected) {
    const {pass} = this.matchers.toEqual(received, expected);

    const message = () =>
      `expected ${this.utils.printReceived(
        received,
      )} to be equal to ${this.utils.printReceived(expected)}`;

    return {
      message,
      pass,
    };
  },
});

it('should pass', () => {
  expect(1).toPass(1);
});

it('internal match should not pass', () => {
  expect(1).toPass(2);
});
