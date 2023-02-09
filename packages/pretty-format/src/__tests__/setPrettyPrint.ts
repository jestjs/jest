/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from '../';
import type {OptionsReceived, Plugins} from '../types';

declare module 'expect' {
  interface Matchers<R> {
    toPrettyPrintTo(expected: unknown, options?: OptionsReceived): R;
  }
}

const setPrettyPrint = (plugins: Plugins) => {
  expect.extend({
    toPrettyPrintTo(
      received: unknown,
      expected: unknown,
      options?: OptionsReceived,
    ) {
      const prettyFormatted = prettyFormat(received, {plugins, ...options});
      const pass = prettyFormatted === expected;

      return {
        actual: prettyFormatted,
        message: pass
          ? () =>
              `${this.utils.matcherHint('.not.toBe')}\n\n` +
              'Expected value to not be:\n' +
              `  ${this.utils.printExpected(expected)}\n` +
              'Received:\n' +
              `  ${this.utils.printReceived(prettyFormatted)}`
          : () => {
              const diffString = this.utils.diff(expected, prettyFormatted, {
                expand: this.expand,
              });
              return (
                `${this.utils.matcherHint('.toBe')}\n\n` +
                'Expected value to be:\n' +
                `  ${this.utils.printExpected(expected)}\n` +
                'Received:\n' +
                `  ${this.utils.printReceived(prettyFormatted)}${
                  diffString != null ? `\n\nDifference:\n\n${diffString}` : ''
                }`
              );
            },
        pass,
      };
    },
  });
};

export default setPrettyPrint;
