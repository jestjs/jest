/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Colors, Indent, Options, Print, Plugin} from 'types/PrettyFormat';

const asymmetricMatcher = Symbol.for('jest.asymmetricMatcher');
const SPACE = ' ';

class ArrayContaining extends Array {}
class ObjectContaining extends Object {}

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
) => {
  const stringedValue = val.toString();

  if (stringedValue === 'ArrayContaining') {
    const array = ArrayContaining.from(val.sample);
    return opts.spacing === SPACE
      ? stringedValue + SPACE + print(array)
      : print(array);
  }

  if (stringedValue === 'ObjectContaining') {
    const object = Object.assign(new ObjectContaining(), val.sample);
    return opts.spacing === SPACE
      ? stringedValue + SPACE + print(object)
      : print(object);
  }

  if (stringedValue === 'StringMatching') {
    return stringedValue + SPACE + print(val.sample);
  }

  if (stringedValue === 'StringContaining') {
    return stringedValue + SPACE + print(val.sample);
  }

  return val.toAsymmetricMatcher();
};

const test = (object: any) => object && object.$$typeof === asymmetricMatcher;

module.exports = ({print, test}: Plugin);
