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

const ts = require('typescript');
const {readFileSync} = require('fs');
const {Expect, ItBlock, Node} = require('jest-editor-support');

function parse(file: string) {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.ES3
  );

  const itBlocks: Array<ItBlock> = [];
  const expects: Array<Expect> = [];
  function searchNodes(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.CallExpression) {
      let {text} = node.expression;
      if (!text) {
        // Property access (it.only)
        text = node.expression.expression.text;
      }
      if (text === 'it' || text === 'test' || text === 'fit') {
        const position = getNode(sourceFile, node, new ItBlock());
        position.name = node.arguments[0].text;
        itBlocks.push(position);
      } else {
        let element = node.expression;
        let expectText: string;
        while (!expectText) {
          expectText = element.text;
          element = element.expression;
        }
        if (expectText === 'expect') {
          const position = getNode(sourceFile, node, new Expect());
          if (!expects.some(e => (
              e.start.line === position.start.line &&
              e.start.column === position.start.column
            ))) {
            expects.push(position);
          }
        }
      }
    }
    ts.forEachChild(node, searchNodes);
  }

  ts.forEachChild(sourceFile, searchNodes);
  return {
    expects,
    itBlocks,
  };
}

function getNode<T: Node>(
  file: ts.SourceFile,
  expression: ts.CallExpression,
  node: T
): T {
  const start = file.getLineAndCharacterOfPosition(expression.getStart(file));
  // TypeScript parser is 0 based, so we have to increment by 1 to normalize
  node.start = {
    column: start.character + 1,
    line: start.line + 1,
  };
  const end = file.getLineAndCharacterOfPosition(expression.getEnd());
  node.end = {
    column: end.character + 1,
    line: end.line + 1,
  };
  node.file = file.fileName;
  return node;
}

module.exports = {
  parse,
};
