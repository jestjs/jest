/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Plugins} from 'types/PrettyFormat';

const diff = require('jest-diff');
const prettyFormat = require('../');

module.exports = {
  getPrettyPrint: (plugins: Plugins) =>
    function(received: any, expected: any, opts: any) {
      const prettyFormatted = prettyFormat(
        received,
        Object.assign(
          {
            plugins,
          },
          opts,
        ),
      );
      const pass = prettyFormatted === expected;

      const message = pass
        ? () =>
            this.utils.matcherHint('.not.toBe') +
            '\n\n' +
            `Expected value to not be:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(prettyFormatted)}`
        : () => {
            const diffString = diff(expected, prettyFormatted, {
              expand: this.expand,
            });
            return (
              this.utils.matcherHint('.toBe') +
              '\n\n' +
              `Expected value to be:\n` +
              `  ${this.utils.printExpected(expected)}\n` +
              `Received:\n` +
              `  ${this.utils.printReceived(prettyFormatted)}` +
              (diffString ? `\n\nDifference:\n\n${diffString}` : '')
            );
          };

      return {actual: prettyFormatted, message, pass};
    },
};
