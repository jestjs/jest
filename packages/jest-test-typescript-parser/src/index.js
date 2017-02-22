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

const {parse: babylonParser, ItBlock, Expect} = require('jest-editor-support');
const {parse: typeScriptParser} = require('./TypeScriptParser');
export type ParserReturn = {
  itBlocks: Array<ItBlock>,
  expects: Array<Expect>,
};

/**
 * Converts the file into an AST, then passes out a
 * collection of it and expects.
 */
function parse(file: string): ParserReturn {
  if (file.match(/\.tsx?$/)) {
    return typeScriptParser(file);
  } else {
    return babylonParser(file);
  }
}

module.exports = {
  parse,
};
