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

const {babylonParser} = require('./parsers/BabylonParser');
import type {Location} from './types';

class Node {
  start: Location;
  end: Location;
  file: string;
}

class Expect extends Node {}

class ItBlock extends Node {
  name: string;
}

export type ParserReturn = {
  itBlocks: Array<ItBlock>,
  expects: Array<Expect>,
};

/**
 * Converts the file into an AST, then passes out a
 * collection of it and expects.
 */
function parse(file: string): ParserReturn {
  if (file.match(/\.ts?$/)) {
    // This require is done here so that it can be optional for clients
    const {parse} = require('./parsers/TypeScriptParser');
    return parse(file);
  } else {
    return babylonParser(file);
  }
}

module.exports = {
  Expect,
  ItBlock,
  Node,
  parse,
};
