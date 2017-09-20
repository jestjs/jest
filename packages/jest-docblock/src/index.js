/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const os = require('os');

const commentEndRe = /\*\/$/;
const commentStartRe = /^\/\*\*/;
const docblockRe = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
const lineCommentRe = /\/\/([^\r\n]*)/g;
const ltrimRe = /^\s*/;
const multilineRe = /(?:^|\r?\n) *(@[^\r\n]*?) *\r?\n *([^@\r\n\s][^@\r\n]+?) *\r?\n/g;
const propertyRe = /(?:^|\r?\n) *@(\S+) *([^\r\n]*)/g;
const stringStartRe = /(\r?\n|^) *\*/g;
const wsRe = /[\t ]+/g;

function extract(contents: string): string {
  const match = contents.match(docblockRe);
  return match ? match[0].replace(ltrimRe, '') || '' : '';
}

function parse(docblock: string): {[key: string]: string} {
  docblock = docblock
    .replace(commentStartRe, '')
    .replace(commentEndRe, '')
    .replace(wsRe, ' ')
    .replace(lineCommentRe, '')
    .replace(stringStartRe, '$1');

  // Normalize multi-line directives
  let prev = '';
  while (prev !== docblock) {
    prev = docblock;
    docblock = docblock.replace(multilineRe, '\n$1 $2\n');
  }
  docblock = docblock.trim();

  const result = Object.create(null);
  let match;
  while ((match = propertyRe.exec(docblock))) {
    result[match[1]] = match[2];
  }
  return result;
}

function print(object: {[key: string]: string} = {}, comments = ''): string {
  const head = '/**';
  const start = ' *';
  const tail = ' */';

  const keys = Object.keys(object);
  const line = os.EOL;

  const printedObject = keys
    .reduce(
      (acc, key) =>
        acc.concat(start, ' ', printKeyValue(key, object[key]), line),
      [],
    )
    .join('');

  if (!comments) {
    if (keys.length === 0) {
      return '';
    }
    if (keys.length === 1) {
      return `${head} ${printKeyValue(keys[0], object[keys[0]])}${tail}`;
    }
  }

  const printedComments =
    comments
      .split(os.EOL)
      .map(textLine => `${start} ${textLine}`)
      .join(os.EOL) + os.EOL;

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

exports.extract = extract;
exports.parse = parse;
exports.print = print;
