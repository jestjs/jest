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

const asymmetricMatcher = Symbol.for('jest.asymmetricMatcher');
const SPACE = ' ';

class ArrayContaining extends Array {}
class ObjectContaining extends Object {}

export const serialize = (
  val: any,
  config: Config,
  print: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string => {
  const stringedValue = val.toString();

  if (stringedValue === 'ArrayContaining') {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }
    const array = ArrayContaining.from(val.sample);
    return (
      (config.min ? stringedValue + SPACE : '') +
      print(array, indentation, depth, refs)
    );
  }

  if (stringedValue === 'ObjectContaining') {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }
    const object = Object.assign(new ObjectContaining(), val.sample);
    return (
      (config.min ? stringedValue + SPACE : '') +
      print(object, indentation, depth, refs)
    );
  }

  if (stringedValue === 'StringMatching') {
    return stringedValue + SPACE + print(val.sample, indentation, depth, refs);
  }

  if (stringedValue === 'StringContaining') {
    return stringedValue + SPACE + print(val.sample, indentation, depth, refs);
  }

  return val.toAsymmetricMatcher();
};

export const test = (val: any) => val && val.$$typeof === asymmetricMatcher;

export default ({serialize, test}: NewPlugin);
