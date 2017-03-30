const diff = require('jest-diff');
const prettyFormat = require('../');

module.exports = {
  getPrettyPrint: plugins =>
    (received, expected, opts) => {
      const prettyPrintImmutable = prettyFormat(
        received,
        Object.assign(
          {
            plugins,
          },
          opts,
        ),
      );
      const pass = prettyPrintImmutable === expected;

      const message = pass
        ? () =>
            this.utils.matcherHint('.not.toBe') +
            '\n\n' +
            `Expected value to not be:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(prettyPrintImmutable)}`
        : () => {
            const diffString = diff(expected, prettyPrintImmutable, {
              expand: this.expand,
            });
            return this.utils.matcherHint('.toBe') +
              '\n\n' +
              `Expected value to be:\n` +
              `  ${this.utils.printExpected(expected)}\n` +
              `Received:\n` +
              `  ${this.utils.printReceived(prettyPrintImmutable)}` +
              (diffString ? `\n\nDifference:\n\n${diffString}` : '');
          };

      return {actual: prettyPrintImmutable, message, pass};
    },
};
