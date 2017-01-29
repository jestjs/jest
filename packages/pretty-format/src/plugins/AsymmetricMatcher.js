/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const asymmetricMatcher = Symbol.for('jest.asymmetricMatcher');
const SPACE = ' ';

class ArrayContaining extends Array {}
class ObjectContaining extends Object {}

const printAsymmetricMatcher = (
  val: any,
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
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

module.exports = {
  print: printAsymmetricMatcher,
  test: (object: any) => object && object.$$typeof === asymmetricMatcher,
};
