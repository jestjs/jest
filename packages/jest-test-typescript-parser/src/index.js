/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse as babylonParser, ParseResult} from 'jest-editor-support';
import * as TypeScriptParser from './type_script_parser';

/**
 * Converts the file into an AST, then passes out a
 * collection of it and expects.
 */
function parse(file: string, data?: string): ParseResult {
  if (file.match(/\.tsx?$/)) {
    return TypeScriptParser.parse(file, data);
  } else {
    return babylonParser(file, data);
  }
}

module.exports = {
  TypeScriptParser,
  parse,
};
