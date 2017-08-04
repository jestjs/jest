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

export const printImmutableEntries = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  type: string,
): string => {
  const name = IMMUTABLE_NAMESPACE + type;
  return ++depth > config.maxDepth
    ? '[' + name + ']'
    : name +
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
      '}';
};

// Return an iterator for Immutable Record as if it had an entries method.
const getRecordEntries = val => {
  let i = 0;
  return {
    next() {
      if (i < val._keys.length) {
        const key = val._keys[i++];
        return {done: false, value: [key, val.get(key)]};
      }
      return {done: true};
    },
  };
};

export const printImmutableRecord = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  // _name property is defined only for an Immutable Record instance
  // which was constructed with a second optional descriptive name arg
  const name = IMMUTABLE_NAMESPACE + (val._name || 'Record');
  return ++depth > config.maxDepth
    ? '[' + name + ']'
    : name +
      SPACE +
      '{' +
      (val._keys.length !== 0
        ? printIteratorEntries(
            getRecordEntries(val),
            config,
            indentation,
            depth,
            refs,
            printer,
          )
        : config.spacingOuter + indentation) +
      '}';
};

export const printImmutableValues = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  type: string,
): string => {
  const name = IMMUTABLE_NAMESPACE + type;
  return ++depth > config.maxDepth
    ? '[' + name + ']'
    : name +
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
      ']';
};
