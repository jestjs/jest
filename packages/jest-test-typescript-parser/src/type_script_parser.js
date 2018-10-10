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
import {NamedBlock, Node as ParsedNode, ParseResult} from 'jest-editor-support';
import type {NodeType} from 'jest-editor-support';

export function parse(file: string): ParseResult {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.ES3,
  );
  const parseResult = new ParseResult(file);

  const addNode = (
    tsNode: ts.Node,
    parent: ParsedNode,
    type: NodeType,
  ): ParsedNode => {
    const child = parent.addChild(type);
    getNode(sourceFile, tsNode, child);

    if (child instanceof NamedBlock) {
      const firstArg = tsNode.arguments[0];
      child.name = firstArg.text;
      if (!child.name) {
        if (ts.isTemplateExpression(firstArg)) {
          child.name = sourceFile.text.substring(
            firstArg.pos + 1,
            firstArg.end - 1,
          );
        } else {
          console.warn(
            `NamedBlock but no name found for ${type} tsNode=`,
            tsNode,
          );
        }
      }
      parseResult.addNode(child);
    } else {
      // block has no name, thus perform extra dedup check by line info
      parseResult.addNode(child, true);
    }

    return child;
  };

  function searchNodes(parent: ParsedNode) {
    return (node: ts.Node) => {
      let sNode: ?ParsedNode;
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

function getNode<T: ParsedNode>(
  file: ts.SourceFile,
  expression: ts.CallExpression,
  node: T,
): T {
  const start = file.getLineAndCharacterOfPosition(expression.getStart(file));
  node.start = {
    column: start.character + 1,
    line: start.line + 1,
  };
  const pos = expression.getEnd();
  const end = file.getLineAndCharacterOfPosition(pos);

  // our end position is 1-based end character, including whitespace and
  // statement separator.  getLineAndCharacterOfPosition in typescript, however,
  // returns the 1-based location of the last non-whitespace char position.
  // Therefore we need to adjust for the actual lineEnd position here
  const lineEnd = file.getLineEndOfPosition(pos);
  const lineEndDiff = lineEnd - pos;

  // TypeScript parser is 0 based, so we have to increment by 1 to normalize
  // but the character position is the exclusive, so no need to to increment by 1
  node.end = {
    column: end.character + lineEndDiff,
    line: end.line + 1,
  };
  node.file = file.fileName;
  return node;
}
