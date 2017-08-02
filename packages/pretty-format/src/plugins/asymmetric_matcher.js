/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

import {printListItems, printObjectProperties} from '../collections';

const asymmetricMatcher = Symbol.for('jest.asymmetricMatcher');
const SPACE = ' ';

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  const stringedValue = val.toString();

  if (stringedValue === 'ArrayContaining') {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }
    return (
      stringedValue +
      SPACE +
      '[' +
      printListItems(val.sample, config, indentation, depth, refs, printer) +
      ']'
    );
  }

  if (stringedValue === 'ObjectContaining') {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }
    return (
      stringedValue +
      SPACE +
      '{' +
      printObjectProperties(
        Object.keys(val.sample).sort(),
        val.sample,
        config,
        indentation,
        depth,
        refs,
        printer,
      ) +
      '}'
    );
  }

  if (stringedValue === 'StringMatching') {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  if (stringedValue === 'StringContaining') {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  return val.toAsymmetricMatcher();
};

export const test = (val: any) => val && val.$$typeof === asymmetricMatcher;

export default ({serialize, test}: NewPlugin);
