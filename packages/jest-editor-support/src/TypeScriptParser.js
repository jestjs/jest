// @flow
'use strict';

const ts = require('typescript');
const {readFileSync} = require('fs');

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

const identifiers = [
  'describe',
  'it',
  'test',
  'expect',
];

function parse(file: string) {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.ES3
  );

  const itBlocks: ItBlock[] = [];
  const expects: Expect[] = [];
  function searchForItBlocks(node: ts.Node) {
    if (node.kind !== ts.SyntaxKind.ExpressionStatement) {
      return;
    }
    if (node.expression.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }
    const callExpression = node.expression;
    let identifier = callExpression.expression;
    if (identifier.kind !== ts.SyntaxKind.Identifier &&
      identifier.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return;
    }
    if (identifier.kind === ts.SyntaxKind.PropertyAccessExpression &&
      identifier.expression.kind === ts.SyntaxKind.CallExpression) {
      identifier = identifier.expression.expression;
    }
    const {text} = identifier;
    if (identifiers.indexOf(text) === -1) {
      return;
    }
    if (text === 'it' || text === 'test') {
      const position = getNode(sourceFile, callExpression, new ItBlock());
      position.name = callExpression.arguments[0].text;
      itBlocks.push(position);
    } else if (text === 'expect') {
      const position = getNode(sourceFile, callExpression, new Expect());
      expects.push(position);
    }
    callExpression.arguments
      .filter(arg => arg.kind === ts.SyntaxKind.ArrowFunction
                  || arg.kind === ts.SyntaxKind.FunctionExpression)
      .forEach(arg => ts.forEachChild(arg.body, searchForItBlocks));
  }

  ts.forEachChild(sourceFile, searchForItBlocks);
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
  Expect,
  ItBlock,
  Node,
  parse,
};
