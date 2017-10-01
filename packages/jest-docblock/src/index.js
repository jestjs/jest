/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import detectNewline from 'detect-newline';
import {EOL} from 'os';

const commentEndRe = /\*\/$/;
const commentStartRe = /^\/\*\*/;
const docblockRe = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
const lineCommentRe = /\/\/([^\r\n]*)/g;
const ltrimRe = /^\s*/;
const rtrimRe = /\s*$/;
const ltrimNewlineRe = /^(\r?\n)+/;
const multilineRe = /(?:^|\r?\n) *(@[^\r\n]*?) *\r?\n *([^@\r\n\s][^@\r\n]+?) *\r?\n/g;
const propertyRe = /(?:^|\r?\n) *@(\S+) *([^\r\n]*)/g;
const stringStartRe = /(\r?\n|^) *\* ?/g;

export function extract(contents: string): string {
  const match = contents.match(docblockRe);
  return match ? match[0].replace(ltrimRe, '') || '' : '';
}

export function strip(contents: string) {
  const match = contents.match(docblockRe);
  return match && match[0] ? contents.substring(match[0].length) : contents;
}

export function parse(docblock: string): {[key: string]: string} {
  return parseWithComments(docblock).pragmas;
}

export function parseWithComments(
  docblock: string,
): {comments: string, pragmas: {[key: string]: string}} {
  const line = detectNewline(docblock) || EOL;

  docblock = docblock
    .replace(commentStartRe, '')
    .replace(commentEndRe, '')
    .replace(lineCommentRe, '')
    .replace(stringStartRe, '$1');

  // Normalize multi-line directives
  let prev = '';
  while (prev !== docblock) {
    prev = docblock;
    docblock = docblock.replace(multilineRe, `${line}$1 $2${line}`);
  }
  docblock = docblock.replace(ltrimNewlineRe, '').replace(rtrimRe, '');

  const result = Object.create(null);
  const comments = docblock.replace(propertyRe, '');

  let match;
  while ((match = propertyRe.exec(docblock))) {
    result[match[1]] = match[2];
  }
  return {comments, pragmas: result};
}

export function print({
  comments = '',
  pragmas = {},
}: {
  comments?: string,
  pragmas?: {[key: string]: string},
}): string {
  const line = detectNewline(comments) || EOL;
  const head = '/**';
  const start = ' *';
  const tail = ' */';

  const keys = Object.keys(pragmas);

  const printedObject = keys
    .map(key => start + ' ' + printKeyValue(key, pragmas[key]) + line)
    .join('');

  if (!comments) {
    if (keys.length === 0) {
      return '';
    }
    if (keys.length === 1) {
      return `${head} ${printKeyValue(keys[0], pragmas[keys[0]])}${tail}`;
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
    (comments && keys.length ? start + line : '') +
    printedObject +
    tail
  );
}

function printKeyValue(key, value) {
  return `@${key} ${value}`.trim();
}
