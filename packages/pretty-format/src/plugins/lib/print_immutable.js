/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Config, Printer, Refs} from 'types/PrettyFormat';

import {printIteratorEntries, printIteratorValues} from '../../collections';

const IMMUTABLE_NAMESPACE = 'Immutable.';
const SPACE = ' ';

const printImmutable = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  immutableDataStructureName: string,
  isMap: boolean,
): string => {
  const name = IMMUTABLE_NAMESPACE + (val._name || immutableDataStructureName);
  if (++depth > config.maxDepth) {
    return '[' + name + ']';
  }

  if (isMap) {
    if (Array.isArray(val._keys)) {
      return (
        name +
        SPACE +
        '{' +
        (val._keys.length !== 0
          ? printIteratorEntries(
              getRecordIterator(val),
              config,
              indentation,
              depth,
              refs,
              printer,
            )
          : config.spacingOuter + indentation) +
        '}'
      );
    }
    return (
      name +
      SPACE +
      '{' +
      (val.size !== 0
        ? printIteratorEntries(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer,
          )
        : config.spacingOuter + indentation) +
      '}'
    );
  }
  return (
    name +
    SPACE +
    '[' +
    (val.size !== 0
      ? printIteratorValues(
          val.values(),
          config,
          indentation,
          depth,
          refs,
          printer,
        )
      : config.spacingOuter + indentation) +
    ']'
  );
};

function getRecordIterator(val) {
  const keys = val._keys;
  let i = 0;
  return {
    next() {
      const done = i >= keys.length;
      if (done) {
        return {done: true};
      }
      const key = keys[i++];
      return {done: false, value: [key, val.get(key)]};
    },
  };
}

export default printImmutable;
