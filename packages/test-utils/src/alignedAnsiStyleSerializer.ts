/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ansiRegex = require('ansi-regex');
import style = require('ansi-styles');
import type {NewPlugin} from 'pretty-format';

export const alignedAnsiStyleSerializer: NewPlugin = {
  serialize(val: string): string {
    // Return the string itself, not escaped nor enclosed in double quote marks.
    return val.replace(ansiRegex(), match => {
      switch (match) {
        case style.inverse.open:
          return '<i>';
        case style.inverse.close:
          return '</i>';

        case style.bold.open:
          return '<b>';
        case style.dim.open:
          return '<d>';
        case style.green.open:
          return '<g>';
        case style.red.open:
          return '<r>';
        case style.yellow.open:
          return '<y>';
        case style.bgYellow.open:
          return '<Y>';

        case style.bold.close:
        case style.dim.close:
        case style.green.close:
        case style.red.close:
        case style.yellow.close:
        case style.bgYellow.close:
          return '</>';

        default:
          return match; // unexpected escape sequence
      }
    });
  },
  test(val: unknown): val is string {
    return typeof val === 'string';
  },
};
