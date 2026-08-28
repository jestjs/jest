/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {isPrimitive} from '@jest/get-type';
import {escapeStrForRegex} from 'jest-regex-util';
import {format as pretty} from 'pretty-format';

export type Template = Record<string, unknown>;
export type Templates = Array<Template>;
export type Headings = Array<string>;

export const interpolateVariables = (
  title: string,
  template: Template,
  index: number,
): string => {
  const keys = Object.keys(template);
  // Regex alternation is ordered, so for overlapping keys such as `a` and
  // `a|b` (or `count` and `count(*)`), listing the shorter key first would let
  // `$a|b` match `$a` and leave `|b`. Sort the keys longest-first so the more
  // specific key always wins, independent of object property insertion order.
  const alternation = [...keys]
    .sort((a, b) => b.length - a.length)
    .map(key => escapeStrForRegex(key))
    .join('|');
  // An empty alternation matches a bare `$`, so a row with no keys would
  // otherwise replace every `$` in the title with the whole (empty) row.
  const interpolated =
    keys.length > 0
      ? title.replaceAll(
          new RegExp(`\\$(${alternation})[.\\w]*`, 'g'),
          match => {
            const keyPath = match.slice(1).split('.');
            const value = getPath(template, keyPath);

            return isPrimitive(value)
              ? String(value)
              : pretty(value, {maxDepth: 1, min: true});
          },
        )
      : title;

  return interpolated.replace('$#', `${index}`);
};

/* eslint import-x/export: 0*/
export function getPath<
  Obj extends Template,
  A extends keyof Obj,
  B extends keyof Obj[A],
  C extends keyof Obj[A][B],
  D extends keyof Obj[A][B][C],
  E extends keyof Obj[A][B][C][D],
>(obj: Obj, path: [A, B, C, D, E]): Obj[A][B][C][D][E];
export function getPath<
  Obj extends Template,
  A extends keyof Obj,
  B extends keyof Obj[A],
  C extends keyof Obj[A][B],
  D extends keyof Obj[A][B][C],
>(obj: Obj, path: [A, B, C, D]): Obj[A][B][C][D];
export function getPath<
  Obj extends Template,
  A extends keyof Obj,
  B extends keyof Obj[A],
  C extends keyof Obj[A][B],
>(obj: Obj, path: [A, B, C]): Obj[A][B][C];
export function getPath<
  Obj extends Template,
  A extends keyof Obj,
  B extends keyof Obj[A],
>(obj: Obj, path: [A, B]): Obj[A][B];
export function getPath<Obj extends Template, A extends keyof Obj>(
  obj: Obj,
  path: [A],
): Obj[A];
export function getPath<Obj extends Template>(
  obj: Obj,
  path: Array<string>,
): unknown;
export function getPath(
  template: Template,
  [head, ...tail]: Array<string>,
): unknown {
  if (template === null) return 'null';
  if (template === undefined) return 'undefined';
  if (!head || !Object.prototype.hasOwnProperty.call(template, head))
    return template;
  return getPath(template[head] as Template, tail);
}
