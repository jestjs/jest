/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const IMMUTABLE_NAMESPACE = 'Immutable.';
const SPACE = ' ';

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
  const openTag = isMap ? '{' : '[';
  const closeTag = isMap ? '}' : ']';
  let result = IMMUTABLE_NAMESPACE + immutableDataStructureName + 
    SPACE + openTag + opts.edgeSpacing;

  const immutableArray = [];
  val.forEach((item: any, key: any) => {
    immutableArray.push(
      indent(addKey(isMap, key) + print(item, print, indent, opts, colors))
    );
  });
  
  result += immutableArray.join(',' + opts.spacing);

  return result + opts.edgeSpacing + closeTag;
};

module.exports = printImmutable;
