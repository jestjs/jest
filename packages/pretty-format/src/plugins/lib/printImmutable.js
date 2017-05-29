/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Colors, Indent, Options, Print} from 'types/PrettyFormat';

const IMMUTABLE_NAMESPACE = 'Immutable.';
const SPACE = ' ';

const addKey = (isMap: boolean, key: any) => (isMap ? key + ': ' : '');

const addFinalEdgeSpacing = (length: number, edgeSpacing: string) =>
  length > 0 ? edgeSpacing : '';

const printImmutable = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
  immutableDataStructureName: string,
  isMap: boolean,
): string => {
  const [openTag, closeTag] = isMap ? ['{', '}'] : ['[', ']'];
  const fullStructureName = val._name || immutableDataStructureName;

  let result =
    IMMUTABLE_NAMESPACE +
    fullStructureName +
    SPACE +
    openTag +
    opts.edgeSpacing;

  const immutableArray = [];

  const pushToImmutableArray = (item: any, key: string) => {
    immutableArray.push(
      indent(addKey(isMap, key) + print(item, print, indent, opts, colors)),
    );
  };

  if (Array.isArray(val._keys)) {
    // if we have a record, we can not iterate on it directly
    val._keys.forEach(key => pushToImmutableArray(val.get(key), key));
  } else {
    val.forEach((item, key) => pushToImmutableArray(item, key));
  }

  result += immutableArray.join(',' + opts.spacing);
  if (!opts.min && immutableArray.length > 0) {
    result += ',';
  }

  return (
    result +
    addFinalEdgeSpacing(immutableArray.length, opts.edgeSpacing) +
    closeTag
  );
};

module.exports = printImmutable;
