/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {readFileSync} from 'fs';

import ts from 'typescript';
import {ParseResult} from 'jest-editor-support';
import type {NodeType, NodeClass} from 'jest-editor-support';

export function parse(file: string): ParseResult {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.ES3,
  );
  const parseResult = new ParseResult(file);

  const addNode = (
    tsNode: ts.Node,
    parent: NodeClass,
    type: NodeType,
  ): NodeClass => {
    const child = parent.addChild(type);

    switch (type) {
      case 'describe':
      case 'it':
        getNode(sourceFile, tsNode, child);
        child.name = tsNode.arguments[0].text;
        parseResult.addNode(child);
        break;
      case 'expect':
        getNode(sourceFile, tsNode, child);
        parseResult.addNode(child, true);
        break;
      default:
        throw new TypeError(`unexpected node type ${type}`);
    }

    return child;
  };

  // const itBlocks: Array<ItBlock> = [];
  // const expects: Array<Expect> = [];
  function searchNodes(parent: NodeClass) {
    return (node: ts.Node) => {
      let sNode: ?NodeClass;
      if (node.kind === ts.SyntaxKind.CallExpression) {
        let {text} = node.expression;
        if (!text) {
          // Property access (it.only)
          text = node.expression.expression.text;
        }
        if (text === 'describe') {
          sNode = addNode(node, parent, 'describe');
        } else if (text === 'it' || text === 'test' || text === 'fit') {
          sNode = addNode(node, parent, 'it');
        } else {
          let element = node.expression;
          let expectText = '';
          while (element && !expectText) {
            expectText = element.text;
            element = element.expression;
          }
          if (expectText === 'expect') {
            sNode = addNode(node, parent, 'expect');
          }
        }
      }
      ts.forEachChild(node, searchNodes(sNode || parent));
    };
  }

  ts.forEachChild(sourceFile, searchNodes(parseResult.root));
  return parseResult;
}

function getNode<T: Node>(
  file: ts.SourceFile,
  expression: ts.CallExpression,
  node: T,
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
