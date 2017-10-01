/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Config, Printer, Refs} from 'types/PrettyFormat';

const getSymbols = Object.getOwnPropertySymbols || (obj => []);

const isSymbol = key =>
  // $FlowFixMe string literal `symbol`. This value is not a valid `typeof` return value
  typeof key === 'symbol' || toString.call(key) === '[object Symbol]';

// Return entries (for example, of a map)
// with spacing, indentation, and comma
// without surrounding punctuation (for example, braces)
export function printIteratorEntries(
  // Flow 0.51.0: property `@@iterator` of $Iterator not found in Object
  // To allow simplistic getRecordIterator in immutable.js
  // replaced Iterator<[any, any]> with any
  iterator: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  // Too bad, so sad that separator for ECMAScript Map has been ' => '
  // What a distracting diff if you change a data structure to/from
  // ECMAScript Object or Immutable.Map/OrderedMap which use the default.
  separator: string = ': ',
): string {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    while (!current.done) {
      const name = printer(
        current.value[0],
        config,
        indentationNext,
        depth,
        refs,
      );
      const value = printer(
        current.value[1],
        config,
        indentationNext,
        depth,
        refs,
      );

      result += indentationNext + name + separator + value;

      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

// Return values (for example, of a set)
// with spacing, indentation, and comma
// without surrounding punctuation (braces or brackets)
export function printIteratorValues(
  iterator: Iterator<any>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    while (!current.done) {
      result +=
        indentationNext +
        printer(current.value, config, indentationNext, depth, refs);

      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

// Return items (for example, of an array)
// with spacing, indentation, and comma
// without surrounding punctuation (for example, brackets)
export function printListItems(
  list: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string {
  let result = '';

  if (list.length) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    for (let i = 0; i < list.length; i++) {
      result +=
        indentationNext +
        printer(list[i], config, indentationNext, depth, refs);

      if (i < list.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

// Return properties of an object
// with spacing, indentation, and comma
// without surrounding punctuation (for example, braces)
export function printObjectProperties(
  val: Object,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string {
  let result = '';
  let keys = Object.keys(val).sort();
  const symbols = getSymbols(val);

  if (symbols.length) {
    keys = keys.filter(key => !isSymbol(key)).concat(symbols);
  }

  if (keys.length) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = printer(key, config, indentationNext, depth, refs);
      const value = printer(val[key], config, indentationNext, depth, refs);

      result += indentationNext + name + ': ' + value;

      if (i < keys.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
