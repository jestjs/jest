/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {readFileSync} from 'fs';

import type {NodeType} from './parser_nodes';
import {NamedBlock, ParseResult, Node} from './parser_nodes';
import {
  File as BabylonFile,
  Node as BabylonNode,
  parse as babylonParse,
} from 'babylon';

export const getASTfor = (file: string): BabylonFile => {
  const [bFile] = _getASTfor(file);
  return bFile;
};

const _getASTfor = (file: string): [BabylonFile, string] => {
  const data = readFileSync(file).toString();
  const config = {plugins: ['*'], sourceType: 'module'};
  return [babylonParse(data, config), data];
};

export const parse = (file: string): ParseResult => {
  const parseResult = new ParseResult(file);
  const [ast, data] = _getASTfor(file);

  const updateNode = (node: Node, babylonNode: BabylonNode) => {
    node.start = babylonNode.loc.start;
    node.end = babylonNode.loc.end;
    node.start.column += 1;

    parseResult.addNode(node);
    if (node instanceof NamedBlock) {
      node.name = getBlockName(babylonNode);
    }
  };

  const isFunctionCall = node =>
    node.type === 'ExpressionStatement' &&
    node.expression &&
    node.expression.type === 'CallExpression';

  const isFunctionDeclaration = (nodeType: string) =>
    nodeType === 'ArrowFunctionExpression' || nodeType === 'FunctionExpression';

  const getBlockName = (bNode: BabylonNode): string => {
    const arg = bNode.expression.arguments[0];
    const name = arg.value;
    if (name) {
      return name;
    }

    if (arg.type === 'TemplateLiteral') {
      //construct name from the quasis + expression
      const tString = data.substring(arg.start + 1, arg.end - 1);
      return tString;
    }

    throw new TypeError(`failed to find name for: ${JSON.stringify(bNode)}`);
  };

  // Pull out the name of a CallExpression (describe/it)
  // handle cases where it's a member expression (.only)
  const getNameForNode = node => {
    if (!isFunctionCall(node)) {
      return false;
    }
    let name =
      node && node.expression && node.expression.callee
        ? node.expression.callee.name
        : undefined;
    if (
      !name &&
      node &&
      node.expression &&
      node.expression.callee &&
      node.expression.callee.object
    ) {
      name = node.expression.callee.object.name;
    }
    return name;
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = node => {
    const name = getNameForNode(node);
    return name === 'it' || name === 'fit' || name === 'test';
  };

  const isAnDescribe = node => {
    const name = getNameForNode(node);
    return name === 'describe';
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = node => {
    if (!isFunctionCall(node)) {
      return false;
    }
    let name = '';
    let element = node && node.expression ? node.expression.callee : undefined;
    while (!name && element) {
      name = element.name;
      // Because expect may have accessors tacked on (.to.be) or nothing
      // (expect()) we have to check multiple levels for the name
      element = element.object || element.callee;
    }
    return name === 'expect';
  };

  const addNode = (
    type: NodeType,
    parent: Node,
    babylonNode: BabylonNode,
  ): Node => {
    const child = parent.addChild(type);
    updateNode(child, babylonNode);

    if (child instanceof NamedBlock && !(child: NamedBlock).name) {
      console.warn(`block is missing name: ${JSON.stringify(babylonNode)}`);
    }
    return child;
  };

  // A recursive AST parser
  const searchNodes = (babylonParent: BabylonNode, parent: Node) => {
    // Look through the node's children
    let child: ?Node;

    for (const node in babylonParent.body) {
      if (!babylonParent.body.hasOwnProperty(node)) {
        return;
      }

      child = undefined;
      // Pull out the node
      const element = babylonParent.body[node];

      if (isAnDescribe(element)) {
        child = addNode('describe', parent, element);
      } else if (isAnIt(element)) {
        child = addNode('it', parent, element);
      } else if (isAnExpect(element)) {
        child = addNode('expect', parent, element);
      } else if (element && element.type === 'VariableDeclaration') {
        element.declarations
          .filter(
            declaration =>
              declaration.init && isFunctionDeclaration(declaration.init.type),
          )
          .forEach(declaration => searchNodes(declaration.init.body, parent));
      } else if (
        element &&
        element.type === 'ExpressionStatement' &&
        element.expression &&
        element.expression.type === 'AssignmentExpression' &&
        element.expression.right &&
        isFunctionDeclaration(element.expression.right.type)
      ) {
        searchNodes(element.expression.right.body, parent);
      } else if (
        element.type === 'ReturnStatement' &&
        element.argument.arguments
      ) {
        element.argument.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, parent));
      }

      if (isFunctionCall(element)) {
        element.expression.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, child || parent));
      }
    }
  };

  const program: BabylonNode = ast['program'];
  searchNodes(program, parseResult.root);

  return parseResult;
};
