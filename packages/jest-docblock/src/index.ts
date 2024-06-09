/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EOL} from 'os';
import {detectNewline} from 'detect-newline';

type Pragmas = Record<string, string | Array<string>>;

const commentEndRe = /\*\/$/;
const commentStartRe = /^\/\*\*?/;
const docblockRe = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
const lineCommentRe = /(^|\s+)\/\/([^\n\r]*)/g;
const ltrimNewlineRe = /^(\r?\n)+/;
const multilineRe =
  /(?:^|\r?\n) *(@[^\n\r]*?) *\r?\n *(?![^\n\r@]*\/\/[^]*)([^\s@][^\n\r@]+?) *\r?\n/g;
const propertyRe = /(?:^|\r?\n) *@(\S+) *([^\n\r]*)/g;
const stringStartRe = /(\r?\n|^) *\* ?/g;
const STRING_ARRAY: ReadonlyArray<string> = [];

export function extract(contents: string): string {
  const match = contents.match(docblockRe);
  return match ? match[0].trimStart() : '';
}

export function strip(contents: string): string {
  const matchResult = contents.match(docblockRe);
  const match = matchResult?.[0];
  return match == null ? contents : contents.slice(match.length);
}

export function parse(docblock: string): Pragmas {
  return parseWithComments(docblock).pragmas;
}

export function parseWithComments(docblock: string): {
  comments: string;
  pragmas: Pragmas;
} {
  const line = detectNewline(docblock) ?? EOL;

  docblock = docblock
    .replace(commentStartRe, '')
    .replace(commentEndRe, '')
    .replaceAll(stringStartRe, '$1');

  // Normalize multi-line directives
  let prev = '';
  while (prev !== docblock) {
    prev = docblock;
    docblock = docblock.replaceAll(multilineRe, `${line}$1 $2${line}`);
  }
  docblock = docblock.replace(ltrimNewlineRe, '').trimEnd();

  const result = Object.create(null) as Pragmas;
  const comments = docblock
    .replaceAll(propertyRe, '')
    .replace(ltrimNewlineRe, '')
    .trimEnd();

  let match;
  while ((match = propertyRe.exec(docblock))) {
    // strip linecomments from pragmas
    const nextPragma = match[2].replaceAll(lineCommentRe, '');
    if (
      typeof result[match[1]] === 'string' ||
      Array.isArray(result[match[1]])
    ) {
      const resultElement = result[match[1]];
      result[match[1]] = [
        ...STRING_ARRAY,
        ...(Array.isArray(resultElement) ? resultElement : [resultElement]),
        nextPragma,
      ];
    } else {
      result[match[1]] = nextPragma;
    }
  }
  return {comments, pragmas: result};
}

export function print({
  comments = '',
  pragmas = {},
}: {
  comments?: string;
  pragmas?: Pragmas;
}): string {
  const line = detectNewline(comments) ?? EOL;
  const head = '/**';
  const start = ' *';
  const tail = ' */';

  const keys = Object.keys(pragmas);

  const printedObject = keys
    .flatMap(key => printKeyValues(key, pragmas[key]))
    .map(keyValue => `${start} ${keyValue}${line}`)
    .join('');

  if (!comments) {
    if (keys.length === 0) {
      return '';
    }
    if (keys.length === 1 && !Array.isArray(pragmas[keys[0]])) {
      const value = pragmas[keys[0]];
      return `${head} ${printKeyValues(keys[0], value)[0]}${tail}`;
    }
  }

  const printedComments =
    comments
      .split(line)
      .map(textLine => `${start} ${textLine}`)
      .join(line) + line;

  return (
    head +
    line +
    (comments ? printedComments : '') +
    (comments && keys.length > 0 ? start + line : '') +
    printedObject +
    tail
  );
}

function printKeyValues(key: string, valueOrArray: string | Array<string>) {
  return [
    ...STRING_ARRAY,
    ...(Array.isArray(valueOrArray) ? valueOrArray : [valueOrArray]),
  ].map(value => `@${key} ${value}`.trim());
}
