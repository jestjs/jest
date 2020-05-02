/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ansiRegex = require('ansi-regex');
import style = require('ansi-styles');
import type {Config, NewPlugin, Printer, Refs} from '../types';

const toHumanReadableAnsi = (text: string) =>
  text.replace(ansiRegex(), match => {
    switch (match) {
      case style.red.close:
      case style.green.close:
      case style.cyan.close:
      case style.gray.close:
      case style.white.close:
      case style.yellow.close:
      case style.bgRed.close:
      case style.bgGreen.close:
      case style.bgYellow.close:
      case style.inverse.close:
      case style.dim.close:
      case style.bold.close:
      case style.reset.open:
      case style.reset.close:
        return '</>';
      case style.red.open:
        return '<red>';
      case style.green.open:
        return '<green>';
      case style.cyan.open:
        return '<cyan>';
      case style.gray.open:
        return '<gray>';
      case style.white.open:
        return '<white>';
      case style.yellow.open:
        return '<yellow>';
      case style.bgRed.open:
        return '<bgRed>';
      case style.bgGreen.open:
        return '<bgGreen>';
      case style.bgYellow.open:
        return '<bgYellow>';
      case style.inverse.open:
        return '<inverse>';
      case style.dim.open:
        return '<dim>';
      case style.bold.open:
        return '<bold>';
      default:
        return '';
    }
  });

export const test: NewPlugin['test'] = (val: unknown) =>
  typeof val === 'string' && !!val.match(ansiRegex());

export const serialize: NewPlugin['serialize'] = (
  val: string,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) => printer(toHumanReadableAnsi(val), config, indentation, depth, refs);

const plugin: NewPlugin = {serialize, test};

export default plugin;
