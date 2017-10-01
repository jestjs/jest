/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse as babylonParser, ItBlock, Expect} from 'jest-editor-support';
import * as TypeScriptParser from './type_script_parser';

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
    return TypeScriptParser.parse(file);
  } else {
    return babylonParser(file);
  }
}

module.exports = {
  TypeScriptParser,
  parse,
};
