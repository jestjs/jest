/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const commentEndRe = /\*\/$/;
const commentStartRe = /^\/\*\*/;
const docblockRe = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
const lineCommentRe = /\/\/([^\r\n]*)/g;
const ltrimRe = /^\s*/;
const multilineRe =
  /(?:^|\r?\n) *(@[^\r\n]*?) *\r?\n *([^@\r\n\s][^@\r\n]+?) *\r?\n/g;
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

exports.extract = extract;
exports.parse = parse;
