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
const {Expect, ItBlock, Node} = require('../ScriptParser');

function parse(file: string) {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.ES3
  );

  const itBlocks: Array<ItBlock> = [];
  const expects: Array<Expect> = [];
  function searchNodes(node: ts.Node) {
    const callExpression = node.expression || {};
    const identifier = callExpression.expression || {};
    const {text} = identifier;
    if (text === 'it' || text === 'test' || text === 'fit') {
      const isOnlyNode = !callExpression.arguments ? node : callExpression;
      const position = getNode(sourceFile, isOnlyNode, new ItBlock());
      position.name = isOnlyNode.arguments[0].text;
      itBlocks.push(position);
    } else if (text === 'expect') {
      const position = getNode(sourceFile, callExpression, new Expect());
      expects.push(position);
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
  node.start = {
    column: start.character,
    line: start.line,
  };
  const end = file.getLineAndCharacterOfPosition(expression.getEnd());
  node.end = {
    column: end.character,
    line: end.line,
  };
  node.file = file.fileName;
  return node;
}

module.exports = {
  parse,
};
