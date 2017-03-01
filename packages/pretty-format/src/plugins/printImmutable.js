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
  let result = IMMUTABLE_NAMESPACE + immutableDataStructureName;
  const openTag = isMap ? '{' : '[';
  const closeTag = isMap ? '}' : ']';
  
  if (val.isEmpty()) {
    return result + SPACE + openTag + closeTag;
  }

  result += SPACE + openTag + opts.edgeSpacing;
  val.forEach((item: any, key: any) => {
    result += indent(
        addKey(isMap, key) + print(item, print, indent, opts, colors)
      ) + ',' + opts.spacing;
  });
  
  if (opts.min) {
    //remove last comma and last spacing
    return result.slice(0, -2) + opts.edgeSpacing + closeTag;
  } else {
    //remove last spacing
    return result.slice(0, -1) + opts.edgeSpacing + closeTag;
  }
};

module.exports = printImmutable;
