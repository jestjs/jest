/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const reactPlugin = require('./ReactElement');
const IMMUTABLE_NAMESPACE = 'Immutable.';

const addKey = (isMap, key) => {
  return isMap ? (key + ': ') : '';
};

const printImmutable = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object,
  immutableDataStructureName: string,
  isMap: boolean,
) : string => {
  let result = IMMUTABLE_NAMESPACE + immutableDataStructureName;
  
  if (val.isEmpty()) {
    return result + ' []';
  }

  result += ' [ ';
  
  val.forEach((item: any, key: any) => {
    if (reactPlugin.test(item)) {
      result += addKey(isMap, key) + 
        reactPlugin.print(item, print, indent, opts, colors) + ', ';
    } else {
      result += addKey(isMap, key) + 
        print(item, print, indent, opts, colors) + ', ';
    }
  });
  
  return result.slice(0, -2) + ' ]';
};

module.exports = printImmutable;
