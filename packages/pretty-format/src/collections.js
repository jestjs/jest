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

// Return entries (for examples, of a map)
// with spacing, indentation, and separating punctuation (comma)
// without surrounding punctuation (for example, braces)
export function printIteratorEntries(
  iterator: Iterator<[any, any]>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
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

// Return values (for examples, of a set)
// with spacing, indentation, and separating punctuation (comma)
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

// Return items (for examples, of an array)
// with spacing, indentation, and separating punctuation (comma)
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
// with spacing, indentation, and separating punctuation (comma)
// without surrounding punctuation (for example, braces)
export function printObjectProperties(
  keys: Array<string|Symbol>,
  val: Object,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string {
  let result = '';
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
